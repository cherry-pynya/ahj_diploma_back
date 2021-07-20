const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const checkLink = require("./checkLink");
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
    this.ws.send(this.categories());
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
          this.sendMessage(this.categories());
          return;
        case 'findMessage':
            this.findMessage(message);
            return;
        case 'refreshFeed':
            this.counter = this.data.length;
            this.lazyLoad();
            this.ws.send(this.categories());
            return;
        case 'showCategory':
          this.showCategory(message);
            return;
        case 'botComand':
          this.botComand(message);
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
    let type;
    if (checkLink(message.text)) {
        type = 'link';
    } else {
        type = 'text';
    }
    const item = {
      id: uuidv4(),
      text: message.text,
      timestamp: `${moment().format("L")} ${moment().format("LTS")}`,
      type: type,
      index: this.data.length,
    };
    this.data.push(item);
    message.data = item;
    this.sendMessage(JSON.stringify(message));
    this.sendMessage(this.categories());
    return;
  }

  findMessage(message) {
    const key = message.text;
    const arr = this.data.filter((el) => {
        if (el.text.indexOf(key) !== -1) {
            return el;
        }
    })
    message.data = arr;
    this.ws.send(JSON.stringify(message));
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
          fileType: file.type.split("/")[0],
          fileFormat: file.type.split("/")[1],
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

  categories() {
      const categories ={};
      const common = this.data.length;
      const textIndex = this.data.filter((el) => {
          if (el.type === 'text') return el;
      }).length;
      const linkIndex = this.data.filter((el) => {
        if (el.type === 'link') return el;
      }).length;
      const files = this.data.filter((el) => {
        if (el.type === 'file') return el;
      });
      const fileIndex = files.length;
      if (fileIndex > 0) {
          const audio = files.filter((el) => {
            if (el.fileType === 'audio') return el;
          });
          if (audio.length > 0) {
            categories.Audio = audio.length;
          }
          const image = files.filter((el) => {
            if (el.fileType === 'image') return el;
          });
          if (image.length > 0) {
            categories.Images = image.length;
          };
          const application = files.filter((el) => {
            if (el.fileType === 'application') return el;
          });
          if (application.length > 0) {
            categories.Files = application.length;
          };
          const tetx = files.filter((el) => {
            if (el.fileType === 'tetx') return el;
          });
          if (tetx.length > 0) {
            categories.txtFiles = tetx.length;
          };
      }
      if (textIndex > 0) {
        categories.TextMessages = textIndex;
      };
      if (linkIndex > 0) {
        categories.Links = linkIndex;
      };
      categories.Messages = common;
      return JSON.stringify({
        comand: 'categories',
        data: categories,
      });
  }

  showCategory(message) {
    if (message.data === 'Links') {
      message.data = this.data.filter((el) => {
        if (el.type === 'link') return el;
      });
      this.ws.send(JSON.stringify(message)); 
    };
    if (message.data === 'Messages') {
      this.counter = this.data.length;
      this.lazyLoad();
    };
    if (message.data === 'TextMessages') {
      message.data = this.data.filter((el) => {
        if (el.type === 'text') return el;
      });
      this.ws.send(JSON.stringify(message)); 
    };
    if (message.data === 'Audio') {
      message.data = this.data.filter((el) => {
        if (el.fileType === 'audio') return el;
      });
      this.ws.send(JSON.stringify(message)); 
    };
    if (message.data === 'Images') {
      message.data = this.data.filter((el) => {
        if (el.fileType === 'image') return el;
      });
      this.ws.send(JSON.stringify(message)); 
    };
    if (message.data === 'Files') {
      message.data = this.data.filter((el) => {
        if (el.fileType === 'application') return el;
      });
      this.ws.send(JSON.stringify(message)); 
    };
    if (message.data === 'txtFiles') {
      message.data = this.data.filter((el) => {
        if (el.fileType === 'tetx') return el;
      });
      this.ws.send(JSON.stringify(message)); 
    };
  }

  botComand(message) {
    const dog = message.request.indexOf('@');
    const dash = message.request.indexOf('-');
    const comand = message.request.slice(dog + 1, dash);
    const str = message.request.slice(dash + 1, message.request.length);
    if (comand === 'currency') {
      this.newMessage({
        comand: 'newMessage',
        text: `Курс ${str} к рублю: 73,33`,
      });
    } else if (comand === 'weather') {
      this.newMessage({
        comand: 'newMessage',
        text: `В ${str} +30 градусов в тени, СПАСАЙТЕСЬ!`,
      });
    } else if (comand === 'english') {
      this.newMessage({
        comand: 'newMessage',
        text: `${str} переводится как: что-то на английском`,
      });
    } else if (comand === 'ticker') {
      this.newMessage({
        comand: 'newMessage',
        text: `Стоимость ${str} на московской бирже - 666 денег`,
      });
    } else if (comand === 'time') {
      this.newMessage({
        comand: 'newMessage',
        text: `Время в ${str} 00:00`,
      });
    } else {
      return;
    }
  }
};
