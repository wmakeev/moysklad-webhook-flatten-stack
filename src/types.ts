import type { SQSHandler, EventBridgeEvent, APIGatewayEvent } from 'aws-lambda'

export type WebhookHandler = SQSHandler & { description?: string }

export interface MoyskladWebhookEvent {
  meta: {
    type: string
    href: `https://online.moysklad.ru/api/remap/1.2/entity/${string}/${string}`
  }

  updatedFields: string[]

  action: 'CREATE' | 'UPDATE' | 'DELETE'

  accountId: string
}

export interface MoyskladWebhook {
  auditContext: {
    meta: {
      type: 'audit'
      href: `https://online.moysklad.ru/api/remap/1.2/audit/${string}`
    }

    uid: `${string}@${string}`

    /** `2021-11-29 14:41:21` */
    moment: string
  }
  events: MoyskladWebhookEvent[]
}

export type MoyskladFlattenedWebhook = Omit<MoyskladWebhook, 'events'> & {
  event: MoyskladWebhookEvent
  originalEventsCount: number
}

export type ApiEvent = Omit<APIGatewayEvent, 'body'> & {
  body: MoyskladWebhook
}

export interface WebhookSqsRecord
  extends EventBridgeEvent<'moysklad', ApiEvent> {
  'detail-type': 'moysklad'
}
