import { LinuxBuildImage } from '@aws-cdk/aws-codebuild'
import { Repository } from '@aws-cdk/aws-codecommit'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core'
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource
} from '@aws-cdk/pipelines'
import { PipelineStage } from './PipelineStage'

export interface PipelineStackConfig extends StackProps {
  /** Application name */
  appName: string

  /** Application stage name (`Prod`, `Dev`) */
  appStageName: string

  /** Source CodeCommit repository ARN */
  sourceCodeCommitRepoArn: string

  /** Source repository branch to deploy */
  sourceBranch: string

  /** Event bus to get raw webhooks from */
  sourceWebhookEventBusArn: string

  /** Target event bus to place flattened webhooks (will be created) */
  targetWebhookEventBusName: string

  /** (optional) NPM token to install private dependencies */
  npmTokenSecretName?: string

  /** Webhook handler timeout (default: 60 sec) */
  webhookHandlerLambdaTimeoutSeconds?: Duration
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackConfig) {
    const stackPrefix = `${props.appStageName}-`

    if (id.indexOf(stackPrefix) !== 0) {
      throw new Error(
        `PipelineStack id should have app stage prefix "${stackPrefix}"`
      )
    }

    super(scope, id, props)

    const codeCommitRepository = Repository.fromRepositoryArn(
      this,
      'CodeCommitRepository',
      props.sourceCodeCommitRepoArn
    )

    const codeBuildStep = new CodeBuildStep('SynthStep', {
      input: CodePipelineSource.codeCommit(
        codeCommitRepository,
        props.sourceBranch
      ),
      installCommands: ['npm install -g aws-cdk json'],
      commands: [
        'echo "Node.js $(node -v), NPM $(npm -v)"',
        'touch .npmrc',
        ...(props.npmTokenSecretName
          ? [
              'NPM_TOKEN=$(aws secretsmanager get-secret-value --secret-id $NPM_TOKEN_SECRET_NAME | json SecretString)',
              'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc'
            ]
          : []),
        'npm ci',
        'npm run build'
      ],
      buildEnvironment: {
        /** node v14.15.4, npm v6.14.10 */
        buildImage: LinuxBuildImage.STANDARD_5_0
      },
      env: {
        ...(props.npmTokenSecretName
          ? { NPM_TOKEN_SECRET_NAME: props.npmTokenSecretName }
          : {})
      }
    })

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: codeBuildStep
    })

    const stage = new PipelineStage(this, 'Prod', {
      appName: props.appName,
      sourceWebhookEventBusArn: props.sourceWebhookEventBusArn,
      targetWebhookEventBusName: props.targetWebhookEventBusName,
      webhookHandlerLambdaTimeoutSeconds:
        props.webhookHandlerLambdaTimeoutSeconds
    })

    pipeline.addStage(stage)

    // [Definining the pipeline](https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html#definining-the-pipeline)
    // We should call buildPipeline before npmTokenSecret.grantRead,
    // otherwise "Error: Call pipeline.buildPipeline() before reading this property"
    pipeline.buildPipeline()

    if (props.npmTokenSecretName) {
      /**
       * NPM token to install private repos
       * @link https://docs.aws.amazon.com/cdk/latest/guide/get_secrets_manager_value.html
       */
      const npmTokenSecret = Secret.fromSecretNameV2(
        this,
        'NpmTokenSecret',
        props.npmTokenSecretName
      )

      npmTokenSecret.grantRead(codeBuildStep)
    }
  }
}
