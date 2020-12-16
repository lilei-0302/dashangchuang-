//cnpm  install jsonwebtoken  --save

const jwt = require('jsonwebtoken');
const str = "skdfhjkaldljfdskffjbdsjkhfhjdsakn"

//创建token的方法
function createToken(obj) {
    obj.time = Date.now()
    console.log(obj); //{ login: true, user_name: 'admin', time: 1607348794757 }
    return jwt.sign(obj, str, { expiresIn: 60 * 60 });

}
//验证token
function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, str, (err, decoded) => {
            if (err) {
                reject("token失效")
            }
            resolve(data)
        });
    })
}

module.exports = {
    createToken,
    verifyToken
}