import type { LambdaHandler } from '../types'

export const webhookHandler: LambdaHandler = async event => {
  console.log('Event:', JSON.stringify(event, null, 2))
}

webhookHandler.description = 'Разбивает веб-хуки МойСклад на отдельные события'
