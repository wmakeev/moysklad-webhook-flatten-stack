import { AppStack } from './AppStack'
import { Stage, Construct, StageProps, Duration } from '@aws-cdk/core'

export interface PipelineStageProps extends StageProps {
  appName: string
  sourceWebhookEventBusArn: string
  targetWebhookEventBusName: string
  webhookHandlerLambdaTimeoutSeconds?: Duration
}

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props)

    new AppStack(this, `${props.appName}Stack`, {
      appName: props.appName,
      sourceWebhookEventBusArn: props.sourceWebhookEventBusArn,
      targetWebhookEventBusName: props.targetWebhookEventBusName,
      webhookHandlerLambdaTimeoutSeconds:
        props.webhookHandlerLambdaTimeoutSeconds
    })
  }
}
