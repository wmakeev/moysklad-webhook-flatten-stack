import { env } from './env'

const APP_STACK_ACCOUNT_NUMBER = env.CDK_DEFAULT_ACCOUNT
const APP_STACK_REGION = env.CDK_DEFAULT_REGION

const ORG = 'vensi'
const APP_NAME = 'moysklad-webhook-flatten'

const getEventBusArn = (busName: string) =>
  `arn:aws:events:${APP_STACK_REGION}:${APP_STACK_ACCOUNT_NUMBER}:event-bus/${busName}`

const getCodeCommitArn = (repoName: string) =>
  `arn:aws:codecommit:${APP_STACK_REGION}:${APP_STACK_ACCOUNT_NUMBER}:${repoName}`

// const getSecretArn = (secretId: string, postfix: string) =>
//   `arn:aws:secretsmanager:${APP_STACK_REGION}:${APP_STACK_ACCOUNT_NUMBER}:secret:${secretId}-${postfix}`

/** Stack config */
export const config = {
  ORG,

  /** Application name */
  APP_NAME,

  SOURCE_CODECOMMIT_REPO_ARN: getCodeCommitArn(`${APP_NAME}-stack`),

  /** AWS account number */
  APP_STACK_ACCOUNT_NUMBER,

  /** AWS account region */
  APP_STACK_REGION,

  WEBHOOK_EVENT_BUS: getEventBusArn('webhook'),

  WEBHOOK_FLATTEN_EVENT_BUS: getEventBusArn('webhook-flatten'),

  NPM_TOKEN_SECRET_NAME: `${ORG}/npm-token`,
  // NPM_TOKEN_SECRET_ARN: getSecretArn(NPM_TOKEN_SECRET_ID, 'ptZCPw'),

  // NPM_TOKEN_PARAM_NAME: `/${ORG}/npm_token`,
  // NPM_TOKEN_PARAM_VERSION: 1,

  LAMBDA_PROCESS_TIMEOUT_SECONDS: 60
}
