import { AppStack } from './AppStack'
import { Stage, Construct, StageProps } from '@aws-cdk/core'
import { config } from './config'

const { APP_NAME } = config

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)

    new AppStack(this, APP_NAME)
  }
}
