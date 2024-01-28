import { type Request } from 'express'
import { type IHttpRequest } from './IRequest'

export class ExpressHttpRequest implements IHttpRequest {
  constructor (private readonly expressRequest: Request) {}

  get body (): any {
    return this.expressRequest.body
  }

  get headers (): any {
    return this.expressRequest.headers
  }

  get params (): any {
    return this.expressRequest.params
  }

  get path (): string {
    return this.expressRequest.path
  }

  get url (): string {
    return this.expressRequest.url
  }

  get query (): any {
    return this.expressRequest.query
  }
}