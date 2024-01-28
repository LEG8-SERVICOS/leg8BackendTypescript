import express, { type Request, type Response, type NextFunction, type RequestHandler } from 'express'
// import { errorHandlerMiddleware } from '../middlewares/ErrorHandlerMiddleware'
import { type IHttpServer } from './IHttpServer'
import cors from 'cors'

export default class ExpressAdapter implements IHttpServer {
  app: any

  constructor () {
    this.app = express()
    this.app.use(express.json())
    this.app.use(cors())
  }

  on (method: string, url: string, callback: (...args: any) => any): void {
    this.app[method](url, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const output = await callback(req, res, next)
        res.json(output)
      } catch (error: any) {
        next(error)
      }
    })
  }

  listen (port: number): void {
    // this.app.use(errorHandlerMiddleware)
    this.app.listen(port)
    console.info('Listen: ', port)
  }

  close (): void {
    const server = this.app.listen()
    server.close()
  }
}