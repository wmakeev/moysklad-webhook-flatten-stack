import { LinuxBuildImage } from '@aws-cdk/aws-codebuild'
import { Repository } from '@aws-cdk/aws-codecommit'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { Construct, Stack, StackProps } from '@aws-cdk/core'
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource
} from '@aws-cdk/pipelines'
import { config } from './config'
import { PipelineStage } from './PipelineStage'

const { NPM_TOKEN_SECRET_NAME, SOURCE_CODECOMMIT_REPO_ARN } = config

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const codeCommitRepository = Repository.fromRepositoryArn(
      this,
      'CodeCommitRepository',
      SOURCE_CODECOMMIT_REPO_ARN
    )

    const codeBuildStep = new CodeBuildStep('SynthStep', {
      input: CodePipelineSource.codeCommit(codeCommitRepository, 'master'),
      installCommands: ['npm install -g aws-cdk json'],
      commands: [
        'echo "Node.js $(node -v), NPM $(npm -v)"',
        'touch .npmrc',
        ...(NPM_TOKEN_SECRET_NAME
          ? [
              'NPM_TOKEN=$(aws secretsmanager get-secret-value --secret-id $NPM_TOKEN_SECRET_NAME | json SecretString)',
              'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc'
            ]
          : []),
        'npm ci',
        'npm run build',
        'npx cdk synth'
      ],
      buildEnvironment: {
        /** node v14.15.4, npm v6.14.10 */
        buildImage: LinuxBuildImage.STANDARD_5_0
      },
      env: {
        ...(NPM_TOKEN_SECRET_NAME ? { NPM_TOKEN_SECRET_NAME } : {})
      }
    })

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: codeBuildStep
    })

    const stage = new PipelineStage(this, 'Prod')

    pipeline.addStage(stage)

    // [Definining the pipeline](https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html#definining-the-pipeline)
    // We should call buildPipeline before npmTokenSecret.grantRead,
    // otherwise "Error: Call pipeline.buildPipeline() before reading this property"
    pipeline.buildPipeline()

    if (NPM_TOKEN_SECRET_NAME) {
      /**
       * NPM token to install private repos
       * @link https://docs.aws.amazon.com/cdk/latest/guide/get_secrets_manager_value.html
       */
      const npmTokenSecret = Secret.fromSecretNameV2(
        this,
        'NpmTokenSecret',
        NPM_TOKEN_SECRET_NAME
      )

      npmTokenSecret.grantRead(codeBuildStep)
    }
  }
}
