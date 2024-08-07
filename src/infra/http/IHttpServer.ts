export interface IHttpServer {
  on: (method: string, url: string, callback: (...args: any) => any) => void
  listen: (port: number) => void
  close: () => void
  use: (path: string | any, ...handlers: any[]) => void
}