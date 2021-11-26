import { cleanEnv, str } from 'envalid'

export const env = cleanEnv(process.env, {
  CDK_DEFAULT_REGION: str(),
  CDK_DEFAULT_ACCOUNT: str()
})
