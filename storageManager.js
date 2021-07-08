const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

moment.locale("ru");

module.exports = class Manager {
    constructor(ws, data) {
        this.ws = ws;
        this.data = data;
        this.counter = 0;
    }

    init() {
        this.ws.on('message', (msg) => {
            const message = JSON.parse(msg);
            switch (message.comand) {
                case 'lazyLoad':
                    this.lazyLoad();
                    return;
                case 'newMessage':
                    this.newMessage(message);
                    return;
            }
        });
    }

    lazyLoad() {
        if (this.counter > this.data.length) return false;
        const result = this.data.slice(this.counter, this.counter + 10);
        this.counter += 10;
        this.ws.send(JSON.stringify({
            comand: 'lazyLoad',
            data: result,
        }));
        return;
    }

    newMessage(message) {
        const item = {
            id: uuidv4(),
            text: message.text,
            timestamp: `${moment().format("L")} ${moment().format("LTS")}`,
            type: "text",
            index: data.length,
          };
          this.data.push(item);
          message.data = item;
          this.ws.send(JSON.stringify(message));
          return;
    }
}