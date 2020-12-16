var IHuyi = require("ihuyi106");
var account = "C84190598"; //账号
var password = "7f3aecb54849f5e4ae1be06b4b1bf63f"; //密码
var apiKey = "7f3aecb54849f5e4ae1be06b4b1bf63f"; //密钥匙

var iHuyi = new IHuyi(account, password, apiKey);

module.exports = {
    iHuyi
}