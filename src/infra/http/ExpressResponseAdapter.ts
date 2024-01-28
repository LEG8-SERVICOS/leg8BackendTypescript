import { type Response } from 'express'
import { type IHttpResponse } from './IResponse'

export class ExpressHttpResponse implements IHttpResponse {
  constructor (private readonly response: Response) {}

  json (data: any): void {
    this.response.json(data)
  }

  send (data: any): void {
    this.response.send(data)
  }

  end (data: any): void {
    this.response.end(data)
  }

  writeHead (code: number, headers: any): void {
    this.response.writeHead(code, headers)
  }

  status (code: number): Response {
    return this.response.status(code)
  }
}