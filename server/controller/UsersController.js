//引入db模块
const { requestQuery, connection } = require("../database/db")
    //cnpm install moment --save 格式化时间模块
const moment = require("moment")

//加密模块
//cnpm install bcryptjs --save
const stringRandom = require("string-random"); //cnpm install string-random --save   
const bcrypt = require('bcryptjs'); //cnpm install bcryptjs --save
const salt = bcrypt.genSaltSync(10);
//随机数
const random = require('string-random');

const JWT = require("./token");
console.log(JWT);
//短信
const { iHuyi } = require("./HUQIAN")

//验证码图片
var svgCaptcha = require('svg-captcha'); //下载  cnpm  install   --save   svg-captcha 

//定义一个变量临时存储手机号
var tempPhone = null;
//定义一盒变量来存储临时验证码
var tempCode = null;

//定义一个变量存储随机验证码
var tempCaptcha = null;

//用户列表
exports.UserList = async(req, res) => {
        const userSql = "SELECT * FROM dsc_users";
        const userList = await requestQuery(userSql);
        res.json({
            data: userList
        })
    }
    // 用户注册
exports.UserRegister = (req, res) => {
        //需要post发送数据
        console.log(req.body); //{user_name:"admin"}
        let user_name = req.body.user_name;
        let login_password = req.body.login_password;
        let phone = req.body.phone;
        let sql_name = "SELECT user_name FROM dsc_users WHERE user_name=? AND is_show=1"
            //获取当前时间
        let nowDate = moment().format("YYYY-MM-DD HH:mm:ss");
        console.log(nowDate);
        connection.query(sql_name, user_name, (err, result_name) => {
            if (err) {
                return res.json({
                    msg: "用户注册失败",
                    status: 1001,
                    data: err
                })
            }
            //需求如果用户名存在不能，用户名不存在，但是手机号存在也不能注册
            //如果result_name为空，说明该用户不存在，说明用户名可以使用
            if (result_name == "") { //条件成立说明用户名不存在
                //验证一下手机号是否存在
                let sql_phone = "SELECT phone FROM dsc_users WHERE phone=? AND is_show=1"
                connection.query(sql_phone, phone, (err, result_phone) => {
                    if (err) {
                        return res.json({
                            msg: "用户注册失败",
                            status: 1002,
                            data: err
                        })
                    }
                    //result_phone为空，说明手机号可用
                    if (result_phone == "") { //条件成立说明手机号可用
                        //INSERT IINTO dsc_users SET user_name="李四"
                        let sql_register = `INSERT INTO dsc_users SET user_name=?,login_password=?,phone=?,is_show=1,create_time="${nowDate}"`
                            //给密码设置加密
                        const hashpassword = bcrypt.hashSync(login_password, salt);
                        connection.query(sql_register, [user_name, hashpassword, phone], (err, result) => {
                            if (err) {
                                return res.json({
                                    msg: "用户注册失败",
                                    status: 1002,
                                    data: err
                                })
                            }
                            // OkPacket {
                            //     fieldCount: 0,
                            //     affectedRows: 1,
                            //     insertId: 4,
                            //     serverStatus: 2,
                            //     warningCount: 1,
                            //     message: '',
                            //     protocol41: true,
                            //     changedRows: 0
                            //   }
                            console.log(result);
                            if (result.affectedRows == 1) {
                                return res.json({
                                    msg: "恭喜你注册成功，可以去登录了",
                                    status: 200,
                                    data: result
                                })
                            } else {
                                return res.json({
                                    msg: "用户注册失败",
                                    status: 1003,
                                    data: err
                                })
                            }
                        })
                    } else {
                        return res.json({
                            msg: "该手机号已经存在，请更换手机号注册",
                            status: 500
                        })
                    }
                })
            } else {
                return res.json({
                    msg: "该用户名已存在，请更换用户名注册",
                    status: 500
                })
            }
        })
    }
    //用户登录
exports.UserLogin = async(req, res) => {
    //需要post发送数据
    const user_name = req.body.login_name
    const captcha = req.body.captcha.toLowerCase()


    if (captcha != tempCaptcha) {
        return res.json({
            msg: "验证码输入错误",
            status: 4004
        })
    }
    //先判断用户名是否存在
    const sql = `SELECT user_name,login_password FROM dsc_users WHERE user_name=?AND is_show=1`
    connection.query(sql, [user_name], (err, result) => {
        if (err) {
            return {
                msg: "数据库查询失败",
                status: 500
            }
        }
        if (result == "") {
            return res.json({
                msg: "该用户不存在，快去注册一个吧",
                status: 1004
            })
        } else {
            const login_password = bcrypt.compareSync(req.body.login_password, result[0].login_password)
            console.log(login_password); //是一个布尔值 true or false
            if (login_password !== true) {
                return res.status(500).json({
                    msg: "密码错误，请从新输入"
                })
            } else {
                let token = JWT.createToken({
                    login: true,
                    user_name: user_name
                })
                return res.json({
                    status: 200,
                    msg: "登录成功",
                    data: result,
                    token: token
                })
            }
        }
    })
}

//获取验证码的接口
exports.GetverificationCode = async(req, res) => {
    //第一步：输入正确的手机号
    //第二步：点击获取验证码，发送请求
    //第三步：短信的内容+随机验证码
    console.log(req.body);
    for (var phoneattr in req.body) {
        var phone = phoneattr;
        tempPhone = phoneattr //临时手机号变量赋值
    }

    // Math.random() 0-1
    //随机六位数
    var identCode = ("000000" + Math.floor(Math.random() * 999999)).slice(-6)
    console.log(identCode);
    tempCode = identCode
    let MessageContent = "您的验证码是：" + identCode + "。请不要把验证码泄露给其他人。"
    iHuyi.send(phone, MessageContent, (err, smsId) => {
        if (err) {
            console.log(err.message);
        } else {
            res.json({
                msg: "验证码发送成功",
                status: 200,
                data: identCode
            })
            console.log("SMS sent, and smsId is " + smsId);
        }
    });
    // res.json({
    //     msg: "验证码发送成功",
    //     status: 200,
    //     data: identCode
    // })
}

//短信登录
exports.PhoneLogin = async(req, res) => {
    console.log(req.body.phone); //手机号
    console.log(req.body.code); //验证码
    var phone = req.body.phone
    var code = req.body.code
    var captcha = req.body.captcha.toLowerCase()
    if (code != tempCode) {
        return res.json({
            msg: "验证码输入错误",
            status: 4002
        })
    } else if (phone != tempPhone) {
        return res.json({
            status: 4003,
            msg: "手机号不正确"
        })
    } else if (captcha != tempCaptcha) {
        return res.json({
            status: 4004,
            msg: "验证码不正确"
        })

    } else {
        //判断手机号是否存在
        //1、如果手机号不存在，将该手机号注册成用户
        const sql_phone = "SELECT * FROM dsc_users WHERE phone=? AND is_show=1"
        const phone_result = await requestQuery(sql_phone, phone)
        console.log(phone_result); //如果手机号存在得到一个数组
        if (phone_result.length == 0) { //如果条件成立说明手机号不存在
            //手机号不存在要注册一个账号
            //1、需要随机生成一个用户名
            const user_name = "dsc_" + stringRandom(10)
            console.log(user_name);
            let nowDate = moment().format("YYYY-MM-DD HH:mm:ss"); //获取当前时间
            let sql_register = `INSERT INTO dsc_users (user_name,phone,is_show,create_time) VALUES("${user_name}","${phone}","1","${nowDate}")`
            let phoneRegister = await requestQuery(sql_register)
            let result = await requestQuery(sql_phone, phone)
            console.log(phoneRegister);
            console.log(result);

            if (phoneRegister.affectedRows == 1) { //注册成功
                let token = JWT.createToken({
                    login: true,
                    phone: result[0].phone
                })
                return res.json({
                    status: 200,
                    msg: "登录成功",
                    data: result,
                    token: token
                })
            } else {
                return res.json({
                    status: 500,
                    msg: "服务器错误"
                })
            }
        } else {
            //2,、如果手机号存在，直接登录
            let token = JWT.createToken({
                login: true,
                phone: phone_result[0].phone
            })
            return res.json({
                status: 200,
                msg: "登录成功",
                data: phone_result,
                token: token
            })
        }

    }
}


//生成验证码图片
exports.SvgCaptcha = async(req, res) => {
    var captcha = svgCaptcha.create({
        size: 4,
        ignoreChars: '0o1i',
        noise: 5,
        color: true,
        background: '#fff'
    });

    tempCaptcha = captcha.text.toLowerCase(); //临时存储验证码
    console.log(captcha.text); //验证码文字
    // console.log(captcha);
    res.type('svg');
    res.status(200).send(captcha.data);

}