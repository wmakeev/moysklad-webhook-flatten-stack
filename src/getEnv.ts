import once from 'lodash.once'
import { cleanEnv, str } from 'envalid'

/** Common environment variables for every handler */
export const HandlersEnvironment = {
  SOURCE_QUEUE_URL: str(),
  TARGET_EVENT_BUS_NAME: str()
}

export const getEnv = once(() => {
  const env = cleanEnv(process.env, HandlersEnvironment)
  return env
})
