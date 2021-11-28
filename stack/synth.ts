import { App, Duration } from '@aws-cdk/core'
import { PipelineStack } from './PipelineStack'
import { env } from './env'

const { CDK_DEFAULT_ACCOUNT: ACCOUNT, CDK_DEFAULT_REGION: REGION } = env
const APP_NAME = 'MoyskladWebhookFlatten'
const REPO_NAME = `${APP_NAME}Stack`

const app = new App()

new PipelineStack(app, `Prod-${APP_NAME}CI`, {
  env: {
    account: ACCOUNT,
    region: REGION
  },
  description: `${APP_NAME} production CI stack`,

  // Config
  appName: APP_NAME,
  appStageName: 'Prod',
  sourceCodeCommitRepoArn: `arn:aws:codecommit:${REGION}:${ACCOUNT}:${REPO_NAME}`,
  sourceBranch: 'master',
  sourceWebhookEventBusArn: `arn:aws:events:${REGION}:${ACCOUNT}:event-bus/webhook`,
  targetWebhookEventBusName: 'moysklad-webhook-events',
  webhookHandlerLambdaTimeoutSeconds: Duration.seconds(60)
  // npmTokenSecretName: '[path]/npm-token'
})

// Uncomment to use Stage deployment
/*
new PipelineStack(app, `Stage-${APP_NAME}CI`, {
  env: {
    account: env.CDK_DEFAULT_ACCOUNT,
    region: env.CDK_DEFAULT_REGION
  },
  description: `${APP_NAME} stage CI stack`,

  // Config
  appName: APP_NAME,
  sourceCodeCommitRepoArn: `arn:aws:codecommit:${REGION}:${ACCOUNT}:${REPO_NAME}`,
  sourceBranch: 'stage',
  sourceWebhookEventBusArn: `arn:aws:events:${REGION}:${ACCOUNT}:event-bus/stage-webhook`,
  targetWebhookEventBusName: 'stage-moysklad-webhook-events'
})
*/

app.synth()
