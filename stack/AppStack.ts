import { EventBus, EventPattern, Rule } from '@aws-cdk/aws-events'
import { SqsQueue as SqsQueueTarget } from '@aws-cdk/aws-events-targets'
import {
  Code,
  Function,
  FunctionProps,
  LayerVersion,
  Runtime
} from '@aws-cdk/aws-lambda'
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { Queue } from '@aws-cdk/aws-sqs'
import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core'
import { webhookHandler } from '../src'
import type { HandlersEnvironment } from '../src/getEnv'
import { capitalize } from '../src/tools'
import { config } from './config'

const {
  APP_NAME,
  LAMBDA_PROCESS_TIMEOUT_SECONDS,
  WEBHOOK_EVENT_BUS,
  WEBHOOK_FLATTEN_EVENT_BUS_NAME
} = config

/** Lambda timeout */
const LAMBDA_PROCESS_TIMEOUT = Duration.seconds(LAMBDA_PROCESS_TIMEOUT_SECONDS)

/** Environment keys expected by lambdas */
type LambdaEnvKeys = keyof typeof HandlersEnvironment

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const dependenciesLayer = new LayerVersion(this, `${APP_NAME}Deps`, {
      code: Code.fromAsset('./layer/dependencies/'),
      compatibleRuntimes: [Runtime.NODEJS_14_X]
    })

    /** Raw webhooks source */
    const webhookEventBus = EventBus.fromEventBusArn(
      this,
      'WebhookEventBus',
      WEBHOOK_EVENT_BUS
    )

    /** Flattened webhooks target */
    const webhookFlattenEventBus = new EventBus(
      this,
      'WebhookFlattenEventBus',
      {
        eventBusName: WEBHOOK_FLATTEN_EVENT_BUS_NAME
      }
    )

    const webhooksQueue = new Queue(this, 'WebhookQueue', {
      visibilityTimeout: LAMBDA_PROCESS_TIMEOUT
    })

    const LambdasEnv: Record<LambdaEnvKeys, string> = {
      SOURCE_QUEUE_URL: webhooksQueue.queueUrl,
      TARGET_EVENT_BUS: webhookFlattenEventBus.eventBusArn
    }

    const commonLambdaConfig: FunctionProps = {
      code: Code.fromAsset('./src'),
      handler: '',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 128,
      timeout: LAMBDA_PROCESS_TIMEOUT,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        ...LambdasEnv
      },
      layers: [dependenciesLayer],
      reservedConcurrentExecutions: 1
    }

    const webhooksQueueHandlerLambda = new Function(
      this,
      `${capitalize(webhookHandler.name)}Lambda`,
      {
        ...commonLambdaConfig,
        handler: `index.${webhookHandler.name}`,
        description: webhookHandler.description
      }
    )

    webhooksQueueHandlerLambda.addEventSource(
      new SqsEventSource(webhooksQueue, {
        batchSize: 10 // max default
      })
    )

    // TODO Нужно ли если добавлен как EventSource
    webhooksQueue.grantConsumeMessages(webhooksQueueHandlerLambda)

    const webhookEventPattern: EventPattern = {
      source: ['webhook'],
      detailType: ['moysklad']
    }

    const webhookEventRule = new Rule(this, 'WebhookEventRule', {
      eventBus: webhookEventBus,
      description: 'Подписка на веб-хуки МойСклад'
    })

    webhookEventRule.addEventPattern(webhookEventPattern)
    webhookEventRule.addTarget(new SqsQueueTarget(webhooksQueue))

    webhookFlattenEventBus.grantPutEventsTo(webhooksQueueHandlerLambda)
  }
}