const http = require("http");
const Koa = require("koa");
const WS = require("ws");
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const Manager = require("./storageManager");

const app = new Koa();
app.use(
  cors({
    origin: "*",
    credentials: true,
    "Access-Control-Allow-Origin": true,
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(koaBody({ json: true, text: true, urlencoded: true }));

const port = process.env.PORT || 7777;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

const data = [
  {
    id: "a",
    text: "first message",
    timestamp: "21:21 11:11:1993",
    type: "text",
    index: 0,
  },
  {
    id: "c",
    text: "second message",
    timestamp: "21:21 11:11:1993",
    type: "text",
    index: 1,
  },
  {
    id: "b",
    text: "third message",
    timestamp: "21:21 11:11:1993",
    type: "text",
    index: 2,
  },
  {
    id: "d",
    text: "https://github.com/cherry-pynya/chat_front_ahj/blob/main/src/js/ws.js",
    timestamp: "21:21 11:11:1993",
    type: "link",
    index: 3,
  },
];

const clients = [];

wsServer.on("connection", (ws, req) => {
  clients.push(ws);
  const manager = new Manager(ws, data);
  manager.init();
  ws.on('close', () => {
    const wsIndex = clients.indexOf(ws);
    if (wsIndex !== -1) {
      clients.splice(wsIndex, 1);
    }
  });
});

server.listen(port, () => console.log("server started"));
