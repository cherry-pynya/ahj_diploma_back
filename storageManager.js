const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const path = require("path");
const fs = require("fs");

moment.locale("ru");

module.exports = class Manager {
  constructor(ws, data, dir, clients) {
    this.ws = ws;
    this.data = data;
    this.counter = this.data.length;
    this.dir = dir;
    this.clients = clients;

    this.saveFile = this.saveFile.bind(this);
  }

  init() {
    this.ws.on("message", (msg) => {
      const message = JSON.parse(msg);
      switch (message.comand) {
        case "lazyLoad":
          this.lazyLoad();
          return;
        case "newMessage":
          this.newMessage(message);
          return;
        case "geo":
          this.newGeo(message);
          return;
      }
    });
  }

  lazyLoad() {
    if (this.counter === 0) return false;
    if (this.counter <= 10) {
      const result = this.data.slice(0, this.counter);
      this.counter = 0;
      this.ws.send(
        JSON.stringify({
          comand: "lazyLoad",
          data: result.reverse(),
        })
      );
      return;
    } else {
      const result = this.data.slice(this.counter - 10, this.counter);
      this.counter -= 10;
      this.ws.send(
        JSON.stringify({
          comand: "lazyLoad",
          data: result.reverse(),
        })
      );
      return;
    }
  }

  newMessage(message) {
    const item = {
      id: uuidv4(),
      text: message.text,
      timestamp: `${moment().format("L")} ${moment().format("LTS")}`,
      type: "text",
      index: this.data.length,
    };
    this.data.push(item);
    message.data = item;
    this.sendMessage(JSON.stringify(message));
    return;
  }

  newGeo(message) {
    const item = {
      id: uuidv4(),
      text: message.text,
      timestamp: `${moment().format("L")} ${moment().format("LTS")}`,
      type: "geo",
      index: this.data.length,
    };
    this.data.push(item);
    message.data = item;
    this.sendMessage(JSON.stringify(message));
    return;
  }

  saveFile(file) {
    return new Promise((res, rej) => {
      const fileName = file.name;
      const filyType = file.type.split("/")[0];
      const oldPath = file.path;
      const newPath = path.join(this.dir, fileName);
      const readStream = fs.createReadStream(oldPath);
      const writeStream = fs.createWriteStream(newPath);
      readStream.on("error", (e) => {
        rej(e);
      });
      writeStream.on("error", (e) => {
        rej(e);
      });
      readStream.on("close", () => {
        fs.unlink(oldPath, (e) => {
          rej(e);
        });
        const item = {
          id: uuidv4(),
          text: fileName,
          timestamp: `${moment().format("L")} ${moment().format("LTS")}`,
          type: "file",
          index: this.data.length,
        };
        this.data.push(item);
        res(
          JSON.stringify({
            comand: "newMessage",
            data: item,
          })
        );
      });
      readStream.pipe(writeStream);
    });
  }

  sendMessage(msg) {
    this.clients.forEach((el) => {
      el.send(msg);
    });
    return;
  }
};
