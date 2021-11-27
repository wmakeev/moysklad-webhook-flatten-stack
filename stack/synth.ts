import { App } from '@aws-cdk/core'
import { config } from './config'
import { PipelineStack } from './PipelineStack'

const { APP_NAME, APP_STACK_ACCOUNT_NUMBER, APP_STACK_REGION } = config

const app = new App()

new PipelineStack(app, `${APP_NAME}CI`, {
  env: {
    account: APP_STACK_ACCOUNT_NUMBER,
    region: APP_STACK_REGION
  }
})

app.synth()
