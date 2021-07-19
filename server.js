const http = require("http");
const Koa = require("koa");
const Router = require("@koa/router");
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const WS = require("ws");
const serve = require('koa-static');
const Manager = require("./storageManager");
const data = require('./data');
const path = require('path');

const app = new Koa();


app.use(
  cors({
    origin: "*",
    credentials: true,
    "Access-Control-Allow-Origin": true,
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(koaBody({
  json: true, text: true, urlencoded: true, multipart: true,
}));
app.use(serve('./public'));

const router = new Router();
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7777;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

const clients = [];

wsServer.on("connection", (ws, req) => {
  clients.push(ws);
  const manager = new Manager(ws, data, path.join(__dirname, '/public'), clients);
  manager.init();

  router.post("/upload", async (ctx) => {
    manager.saveFile(ctx.request.files.file)
      .then((response) => {
        ws.send(response)
      });
    ctx.response.status = 204;
  });

  ws.on('close', () => {
    const wsIndex = clients.indexOf(ws);
    if (wsIndex !== -1) {
      clients.splice(wsIndex, 1);
    }
  });
});

server.listen(port, () => console.log("server started"));
