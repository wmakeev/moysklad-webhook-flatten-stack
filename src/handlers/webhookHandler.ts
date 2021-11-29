import _H from 'highland'
import { getEnv } from '../getEnv'
import type {
  MoyskladFlattenedWebhook,
  WebhookHandler,
  WebhookSqsRecordBody
} from '../types'
import EventBridge from 'aws-sdk/clients/eventbridge'
import SQS from 'aws-sdk/clients/sqs'

export interface GetWebhookHandlerParams {
  eventBrige: EventBridge
  sqs: SQS
  log: typeof console.log
}

export function getWebhookHandler(
  params: GetWebhookHandlerParams
): WebhookHandler {
  const { eventBrige, sqs, log } = params

  const webhookHandler: WebhookHandler = async event => {
    log('Event:', JSON.stringify(event, null, 2))

    const { TARGET_EVENT_BUS_NAME, SOURCE_QUEUE_URL } = getEnv()

    const totalRecordsProcessed: number = await _H(event.Records)
      // Формируем список веб-хуков и пробрасываем receiptHandle для дальнейшего
      // удаления события из очереди после перепубликации веб-хуков.
      .map(record => {
        const webhookRequest = JSON.parse(record.body) as WebhookSqsRecordBody

        const webhook = webhookRequest.detail.body

        const originalEventsCount = webhook.events.length

        const flattenedWebhooks: MoyskladFlattenedWebhook[] =
          webhook.events.map(webhookEvent => {
            return {
              ...{ ...webhook, events: undefined },
              event: webhookEvent,
              originalEventsCount
            }
          })

        return {
          receiptHandle: record.receiptHandle,
          flattenedWebhooks
        }
      })

      // Публикуем веб-хуки в другой Event Bus
      .map(async recordFlattenedWebhooks => {
        await _H(recordFlattenedWebhooks.flattenedWebhooks)
          .batch(10)
          .map(async flattenedWebhooksBatch => {
            const params: EventBridge.PutEventsRequest = {
              Entries: flattenedWebhooksBatch.map(flattenedWebhook => ({
                Source: 'webhook',
                DetailType: 'MoyskladFlattenedWebhook',
                EventBusName: TARGET_EVENT_BUS_NAME,
                Detail: JSON.stringify(flattenedWebhook)
              }))
            }

            await eventBrige.putEvents(params).promise()
          })
          .map(it => _H(it))
          .parallel(10) // TODO Get from config and orderless parallel
          .collect()
          .toPromise(Promise)

        return recordFlattenedWebhooks.receiptHandle
      })

      .map(it => _H(it))
      .sequence()

      // Явно удаляем сообщения для опубликованных веб-хуков
      .batch(10)
      .map(async receiptHandles => {
        await sqs
          .deleteMessageBatch({
            QueueUrl: SOURCE_QUEUE_URL,
            Entries: receiptHandles.map((receiptHandle, index) => ({
              Id: String(index),
              ReceiptHandle: receiptHandle
            }))
          })
          .promise()

        return receiptHandles.length
      })
      .map(it => _H(it))
      .parallel(10)

      // Считаем общее кол-во обработанных сообщений из исходной очереди
      .reduce(0, (res, it) => res + it)
      .toPromise(Promise)

    log(JSON.stringify({ totalRecordsProcessed }))
  }

  webhookHandler.description =
    'Разбивает веб-хуки МойСклад на отдельные события'

  return webhookHandler
}

export const webhookHandler: WebhookHandler = getWebhookHandler({
  eventBrige: new EventBridge(),
  sqs: new SQS(),
  log: (message?: any, ...optionalParams: any[]) => {
    console.log(message, ...optionalParams)
  }
})
