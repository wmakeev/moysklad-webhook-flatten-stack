import type { Context, SQSEvent } from 'aws-lambda'
import type EventBridge from 'aws-sdk/clients/eventbridge'
import type SQS from 'aws-sdk/clients/sqs'
import test from 'tape'
import { getEnv } from '../../src/getEnv'
import { getWebhookHandler } from '../../src/handlers'
import type { ApiEvent, MoyskladFlattenedWebhook } from '../../src/types'

// TODO make env?
process.env['TARGET_EVENT_BUS_NAME'] = 'test.event-bus'
process.env['SOURCE_QUEUE_URL'] = 'test.source-queue-url'

test('webhookHandler', async t => {
  const { TARGET_EVENT_BUS_NAME, SOURCE_QUEUE_URL } = getEnv()

  const flattenedWebhooks: MoyskladFlattenedWebhook[] = []

  const deletedEvents: string[] = []

  const logs: any[] = []

  const eventBrige = {
    putEvents: (params: EventBridge.PutEventsRequest) => {
      params.Entries.forEach(ent => {
        t.equals(ent.Source, 'webhook')
        t.equals(ent.DetailType, 'MoyskladFlattenedWebhook')
        t.equals(ent.EventBusName, TARGET_EVENT_BUS_NAME)

        const detail = JSON.parse(ent.Detail!) as MoyskladFlattenedWebhook

        flattenedWebhooks.push(detail)
      })

      return {
        promise: () => Promise.resolve()
      } as any
    }
  } as EventBridge

  const sqs = {
    deleteMessageBatch: (params: SQS.DeleteMessageBatchRequest) => {
      t.equals(params.QueueUrl, SOURCE_QUEUE_URL)

      params.Entries.forEach(entry => {
        deletedEvents.push(entry.ReceiptHandle)
      })

      return {
        promise: () => Promise.resolve()
      } as any
    }
  } as SQS

  const log = (message?: any, ...optionalParams: any[]) => {
    logs.push([message, ...optionalParams])
  }

  const webhookHandler = getWebhookHandler({
    eventBrige,
    sqs,
    log
  })

  const recordBody = JSON.stringify({
    body: {
      events: [
        {
          accountId: 'event-1'
        },
        {
          accountId: 'event-2'
        }
      ]
    }
  } as ApiEvent)

  const mockSqsEvent = {
    Records: [
      {
        receiptHandle: 'receiptHandle-1',
        body: recordBody
      },
      {
        receiptHandle: 'receiptHandle-2',
        body: recordBody
      }
    ]
  } as SQSEvent

  const mockContext = {} as Context

  const mockCallback = () => {}

  await webhookHandler(mockSqsEvent, mockContext, mockCallback)

  t.deepEqual(
    flattenedWebhooks.map(it => it.event.accountId),
    ['event-1', 'event-2', 'event-1', 'event-2']
  )

  t.deepEqual(deletedEvents, ['receiptHandle-1', 'receiptHandle-2'])

  t.equals(JSON.parse(logs.pop()).totalRecordsProcessed, 2)
})
