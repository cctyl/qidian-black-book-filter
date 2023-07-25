var express = require('express');
const axios = require('axios');
var cookieParser = require('cookie-parser');
var path = require('path');
const QDBlackListService = require("./service/QDBlackListService")
const numberUtil = require("./utils/NumberUtil")
var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置跨域访问
app.all("*", function (req, res, next) {

    res.header("Access-Control-Allow-Origin", req.headers.origin || '*');
    //允许的header类型
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With") //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS")//可以带cookies
    res.header("Access-Control-Allow-Credentials", true)
    if (req.method == 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
})

let cookie = "hiijack=0; gender=male; _yep_uuid=edfab3d4-20e1-db98-c7f5-491ba43b9ddb; COOKIE_BOOKLIST_TIPS=1; _csrfToken=Z1FVPjd8s7eIazoO6l487xVMQK3vZMlQTKIsXOXc; newstatisticUUID=1656390966_236023429; fu=1043150769; e2=%7B%22pid%22%3A%22mqd_P_qidianm%22%2C%22eid%22%3A%22mqd_A66%22%2C%22l1%22%3A%22%22%7D; e1=%7B%22pid%22%3A%22mqd_P_qidianm%22%2C%22eid%22%3A%22mqd_A12%22%2C%22l1%22%3A3%7D";
let headers = {
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Cookie": cookie,
    "Host": "m.qidian.com",
    "Pragma": "no-cache",
    "Referer": "https://m.qidian.com/rank/yuepiao/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    "X-D": "-1",
    "X-Requested-With": "XMLHttpRequest",
    "X-Yuew-sign": "b9f33bf34f133e49bd5c6e59994ebbe7",
    "X-Yuew-time": "1656391019"
}

//黑名单列表
let blackList = []

//初始化黑名单
QDBlackListService.findAll().then(value => {
    blackList = value
    //过滤，只需要bid属性
    blackList = blackList.map((item) => {
        return item.bid;
    })
    console.log(blackList)
    console.log("黑名单长度为：" + blackList.length)
})


/**
 * 获取cookie
 */
app.get("/getCookie", async (req, res, next) => {

    res.json({cookie: cookie})
})

/**
 * 设置cookie
 */
app.post("/setCookie", async (req, res, next) => {
    console.log(req.body)
    let cookieTemp = req.body.cookie
    cookie = cookieTemp

    res.json({code: "200"})
})

/**
 * 获取动态数据
 */
app.get("/getRank", async (req, res, next) => {

    let {pageNum, yearmonth} = req.query
    if (!yearmonth) {
        let date = new Date();
        let month = date.getMonth() + 1
        month = month < 10 ? ('0' + month) : month
        yearmonth = date.getFullYear() + '' + month
    }
    let response = await axios({
        method: 'GET',
        url: `https://m.qidian.com/majax/rank/yuepiaolist?_csrfToken=Z1FVPjd8s7eIazoO6l487xVMQK3vZMlQTKIsXOXc&gender=male&pageNum=${pageNum}&catId=-1&yearmonth=${yearmonth}`,
        withCredentials: true,
        headers: headers
    })

    let bookList = response.data.data.records
    bookList = bookList.filter(item => {
        if (blackList.indexOf(item.bid) !== -1) {

            return false;
        } else {
            return true;
        }
    })


    res.json(bookList)
})


/**
 * 添加黑名单
 */
app.post("/addBlack", async (req, res, next) => {

    let body = req.body
    //存入数据库
    QDBlackListService.saveExample(body)
    //加入缓存中
    blackList.push(body.bid)

    res.json({message: "ok"})
})


let totalBooksNum = 10000;

//黑名单关键词过滤
let blackWord = [
    "开局",
    "斗破",
    "四合院",
    "诸天",
    "漫威",
    "洪荒",
    "文娱",
    "华娱",
    "综艺",
    "港综",
    "lol",
    "LOL",
    "霍格沃兹"

]

/**
 * 判断该书籍是否是黑名单数据
 * @param targetBook
 */
function isBlack(targetBook) {
    return blackList.indexOf(targetBook.bid) !== -1
        || containBlackWord(targetBook);
}

/**
 * 判断书名是否包含关键字
 * @param targetBook
 * @returns {boolean}
 */
function containBlackWord(targetBook) {
    let bName = targetBook.bName;
    for (let i = 0; i < blackWord.length; i++) {
        let word = blackWord[i];
        if (bName.indexOf(word) !== -1) {
            return true;
        }
    }
    return false;
}

/**
 * 更新当前月份的book总数
 */
app.get("/refreshTotalNum", async (req, res, next) => {
    let yearmonth = numberUtil.getYearMonth()
    let response = await axios({
        method: 'GET',
        url: `https://m.qidian.com/majax/rank/yuepiaolist?_csrfToken=Z1FVPjd8s7eIazoO6l487xVMQK3vZMlQTKIsXOXc&gender=male&pageNum=1&catId=-1&yearmonth=${yearmonth}`,
        withCredentials: true,
        headers: headers
    })

    totalBooksNum = response.data.data.total

    res.json(totalBooksNum)
})

/**
 * 调用起点接口获得数据
 * @param pageNum
 * @param yearMonth
 * @returns {Promise<unknown>}
 */
function getBookList(pageNum, yearMonth) {


    return new Promise((resolve, reject) => {
        axios({
            method: 'GET',
            url: `https://m.qidian.com/majax/rank/yuepiaolist?_csrfToken=Z1FVPjd8s7eIazoO6l487xVMQK3vZMlQTKIsXOXc&gender=male&pageNum=${pageNum}&catId=-1&yearmonth=${yearMonth}`,
            withCredentials: true,
            headers: headers
        }).then(response => {

            resolve(response);
        }).catch(reason => {
            console.log("请求错误，原因为：")
            console.log(reason)
            reject({})
        })
    })


}

/**
 * 获取一本，随机的，不在黑名单中的book
 */
app.get("/getRandom", async (req, res, next) => {

    let yearmonth = numberUtil.getYearMonth();


    //生成一个随机数
    let number = numberUtil.randomNum(1, totalBooksNum);
    console.log("随机数为：" + number);

    // 根据随机数获得页码 一页有20条记录
    let pageNum = Math.trunc(number / 20);
    console.log("目标页码为：" + pageNum);

    // 根据随机数获得页码中的具体的某一本书的索引
    let index = number % 20;


    let response = await getBookList(pageNum, yearmonth)

    //获取book记录
    let bookList = response.data.data.records;
    if (bookList.length < 1) {
        console.log("该页没有数据，重新请求")
        response = await getBookList(pageNum, yearmonth)
        bookList = response.data.data.records;
        if (bookList.length < 1) {
            res.json("起点始终返回空数据，没有找到合适的数据，请重试")
        }
    }


    //更新总数
    totalBooksNum = response.data.data.total;
    console.log("总数更新为：" + totalBooksNum);


    //防止角标越界
    if (index >= bookList.length) {
        index = bookList.length - 1;
    }
    //取出目标书籍
    let targetBook = bookList[index];


    //==========================
    targetBook = {
        bName: '舌尖上的霍格沃茨',
        bid: 1013293257
    };

    console.log(isBlack(targetBook))
    //判断目标书籍是否在黑名单内
    if (isBlack(targetBook)) {
        //说明此书刚好再黑名单
        console.log("该书籍" + targetBook.bName + "在黑名单内，换一本");

        //那就直接重置下标为0，然后从0开始找，找到一个不再黑名单内的书籍
        for (let i = 0; i < bookList.length; i++) {
            console.log("开始找第" + (i + 1) + "本书");
            let bid = bookList[i].bid;
            if (isBlack(bookList[i])) {
                console.log("此书" + bookList[i].bName + "仍在黑名单内")
                continue;
            } else {
                console.log("找到目标书籍！")
                targetBook = bookList[i];
                break;
            }
        }
    }

    console.log("最终目标书籍为：" + targetBook.bName);

    if (!targetBook) {
        res.json("失败了，没有找到合适的数据，请重试")
    } else {

        //将该书籍加入黑名单中
        QDBlackListService.saveExample({
            bid: targetBook.bid,
            bName: targetBook.bName,
            desc: targetBook.desc
        })
        blackList.push(targetBook.bid)

        console.log("重定向到起点书籍页面")
        res.redirect(`https://m.qidian.com/book/${targetBook.bid}/0.html`);
    }

})


app.listen(7094);
