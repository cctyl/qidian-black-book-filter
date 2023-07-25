module.exports = {
    randomNum(minNum, maxNum) {
        switch (arguments.length) {
            case 1:
                return parseInt(Math.random() * minNum + 1, 10);
                break;
            case 2:
                return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                break;
            default:
                return 0;
                break;
        }
    },

    getYearMonth(){
        let date = new Date();
        let month = date.getMonth() + 1
        month = month < 10 ? ('0' + month) : month
        let yearmonth = date.getFullYear() + '' + month

        return yearmonth
    }
}
