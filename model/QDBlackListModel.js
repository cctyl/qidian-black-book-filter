const mongoose = require("./db")

/*
黑名单列表
凡是出现在此库的，均为黑名单
 */
var QDBlackListSchema = mongoose.Schema({
    desc:String,
    bName:String,
    bid:String
},{
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
})

// 第三个参数是数据库中集合的真实名字
var QDBlackListModel =  mongoose.model("qidian_blacklist",QDBlackListSchema,"qidian_blacklist")



//向外暴露模型，因为实际只需要模型来操作数据库
module.exports = QDBlackListModel
