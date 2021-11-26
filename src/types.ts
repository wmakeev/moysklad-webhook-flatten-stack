import type { Handler } from 'aws-lambda'

export type LambdaHandler = Handler & { description?: string }
