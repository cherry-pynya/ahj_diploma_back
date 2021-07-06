const http = require('http');
const Koa = require('koa');
const WS = require('ws');
const koaBody = require("koa-body");
const cors = require("@koa/cors");

const app = new Koa();
app.use(
  cors({
    origin: "*",
    credentials: true,
    "Access-Control-Allow-Origin": true,
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(koaBody({ json: true, text: true, urlencoded: true }))

const port = process.env.PORT || 7777;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

const data = [
  {
    id: 'a',
    data: 'first message',
  },
  {
    id: 'b',
    data: 'second message',
  },
  {
    id: 'c',
    data: 'https://github.com/cherry-pynya/chat_front_ahj/blob/main/src/js/ws.js',
  },
]

wsServer.on('connection', (ws, req) => {
  ws.send('hello there');
  ws.send(JSON.stringify(data));
  ws.on('message', (msg) => {
    console.log(msg)
  });
});

server.listen(port, () => console.log('server started'));
