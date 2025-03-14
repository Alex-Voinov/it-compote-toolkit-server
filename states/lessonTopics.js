const googleSheetService = require("../googleSheetService");

function isOneHourPassed(date) {
    const oneHourInMilliseconds = 3600000;
    return date === null || Math.abs(new Date() - date) >= oneHourInMilliseconds;
}

class LessonTopics {
    topics = {}
    lastUpdate = null;

    async updateTopics() {
        this.lastUpdate = new Date();
        this.topics = await googleSheetService.getTopicsAcrossDisciplines()
    }

    async getTopics() {
        if (lastUpdate === null || isOneHourPassed(this.lastUpdate)) {
            await this.updateTopics()
        }
        return this.topics
    }

}

export default new LessonTopics();