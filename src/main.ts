import setupRoutes from './infra/controllers/Routes';
import ExpressAdapter from './infra/http/ExpressAdapter';
               
export class App {
  private readonly expressServer: ExpressAdapter

  constructor() {
    this.expressServer = new ExpressAdapter();
  }

  async start() {
    const router = setupRoutes();
    this.expressServer.listen(8080);
    this.expressServer.use(router);
  }

  async stop() {
    this.expressServer.close();
  }
  
}
const app = new App();

app.start().catch((error) => {
  console.error({'Um ou mais serviços não foram iniciados corretamente': error});
});