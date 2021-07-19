module.exports = function checkLink(str) {
    const reg = new RegExp(/(http|https|ftp|ftps):\/\/[a-zA-Z0-9\-\\.]+\.[a-zA-Z]{2,3}(\/\S*)?/);
    return reg.test(str);
};
