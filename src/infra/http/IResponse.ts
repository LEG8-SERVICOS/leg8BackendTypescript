export interface IHttpResponse {
  json: (data: any) => void
  send: (data: any) => void
  end: (data: any) => void
  writeHead: (code: number, headers: any) => void
  status: (code: number) => any
}