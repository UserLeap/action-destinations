export interface Sprig {
  (...args: unknown[]): unknown
  envId?: string
  debugMode?: boolean
  _queue?: unknown[]
  _segment?: number
  _API_URL?: string // for testing
}
