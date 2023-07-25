let QDBlackListModel = require("../model/QDBlackListModel")

module.exports = {

    //编写service方法时注意，需要用promise包裹住

    /**
     * 保存自己
     * @param exampleData
     * @returns {Promise<unknown>}
     */
    saveExample(exampleData) {
        return new Promise((resolve, reject) => {
            let e = new QDBlackListModel(exampleData)

            e.save(function (err, doc) {
                if (err)
                    resolve(false)
                else
                    resolve(doc)
            })

        })
    },


    /**
     * 根据时间范围查找
     * @param startTime
     * @param endTime
     * @returns {Promise<unknown>}
     */
    findGpsByTime(startTime, endTime) {
        return new Promise((resolve, reject) => {

            QDBlackListModel.find(
                {

                    "created": {
                        $gt: new Date(startTime * 1),
                        $lt: new Date(endTime * 1)
                    }
                },
                (error, result) => {

                    if (error) {

                        console.log(error)
                        resolve(false)
                    } else {
                        resolve(result)
                    }
                }
            )
        })
    },


    /**
     * 查询全部
     * @returns {Promise<unknown>}
     */
    findAll() {
        return new Promise((resolve, reject) => {
            QDBlackListModel.find({}, function (err, doc) {
                if (err)
                    resolve(false)
                else
                    resolve(doc)
            })
        })
    },


}
