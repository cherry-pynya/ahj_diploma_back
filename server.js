const http = require('http');
const Koa = require('koa');
const WS = require('ws');
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

moment.locale('ru')

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
    text: 'first message',
    timestamp: '21:21 11:11:1993',
    type: 'text',
    index: 0,
  },
  {
    id: 'c',
    text: 'second message',
    timestamp: '21:21 11:11:1993',
    type: 'text',
    index: 1,
  },
  {
    id: 'b',
    text: 'third message',
    timestamp: '21:21 11:11:1993',
    type: 'text',
    index: 2,
  },{
    id: 'd',
    text: 'https://github.com/cherry-pynya/chat_front_ahj/blob/main/src/js/ws.js',
    timestamp: '21:21 11:11:1993',
    type: 'link',
    index: 3,
  },
]

wsServer.on('connection', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg);
    const message = JSON.parse(msg);
    console.log(message);
    switch(message.comand) {
      case 'sentInitailData':
        message.data = data;
        message.fullfilled = true;
        ws.send(JSON.stringify(message));
        return;
      case 'newMessage':
        const item = ({
          id: uuidv4(),
          text: message.text,
          timestamp: `${moment().format('L')} ${moment().format('LTS')}`,
          type: 'text',
          index: data.length,
        })
        data.push(item);
        message.data = item;
        message.fullfilled = true;
        ws.send(JSON.stringify(message));
    }
  });
});

server.listen(port, () => console.log('server started'));
