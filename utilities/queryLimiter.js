class QueryLimiter {

    lastRequestTime = new Date();
    requestsSentPerSecond = 0
    requestLimitPerSecond = 7

    translateTimeStamp(date) {
        return date.toISOString().slice(0, 19); // Обрезаем строку до секунд (формат: YYYY-MM-DDTHH:mm:ss)
    }

    queryabilityCheck() {
        const currentTime = new Date();
        if (this.translateTimeStamp(currentTime) !== this.translateTimeStamp(this.lastRequestTime))
            this.requestsSentPerSecond = 0

        this.lastRequestTime = new Date();
        this.requestsSentPerSecond += 1
        if (this.requestsSentPerSecond > this.requestLimitPerSecond) return false
        return true;
    }

    getErrorStatus(serviceName) {
        console.log('выкинули ошибку')
        return ({
            status: 404,
            data: { error: `Колличество запросов к ${serviceName} превышает ${this.requestLimitPerSecond} в секунду.` }
        })
    }
}

module.exports = new QueryLimiter();

