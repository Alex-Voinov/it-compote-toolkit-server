const googleSheetService = require("../services/googleSheetService");
const getMonthByDate = require("../utilities/getMonthByDate");

function isOneHourPassed(date) {
    const oneHourInMilliseconds = 3600000;
    return date === null || Math.abs(new Date() - date) >= oneHourInMilliseconds;
}

class Payments {
    payments = {}
    lastUpdate = null;

    async updatePayments() {
        this.lastUpdate = new Date();
        const paymentData = await googleSheetService.getPayments()
        const paymentsArray = paymentData.map(paymentRow => ({
            date: paymentRow.date,
            discipline: paymentRow.discipline,
            type: paymentRow.type,
            student: paymentRow.student,
            money: 90,//paymentRow.money, 
            isPass: paymentRow.isPass,
            id: paymentRow.id,
            monthName: getMonthByDate(paymentRow.date),
            lecruter: paymentRow.lecruter
        }))
        // У нас есть массив объектов, созданный по таблице, в котором мы оставили нужные нам поля
        // Нужно разделить его по учителям, ключ - ФИО
        const paymentDataByName = {}
        paymentsArray.forEach(paymentRow => {
            if (paymentRow.lecruter in paymentDataByName)
                paymentDataByName[paymentRow.lecruter].push(paymentRow)
            else paymentDataByName[paymentRow.lecruter] = [paymentRow,]
        })
        // Теперь нам нужно разделить все на данные по месяцам и избавиться от лишнего
        // Перебираем данные каждого учителя
        for (let lecruterName in paymentDataByName) {
            const lecruterPaymentData = paymentDataByName[lecruterName]
            const paymentsDataByMonth = []
            lecruterPaymentData.forEach(oneActivity => {
                const index = paymentsDataByMonth.findIndex(dataByMonth => dataByMonth.monthName === oneActivity.monthName);
                if (index > -1) {
                    // Она уже находится в массиве, добавляем данные
                    paymentsDataByMonth[index].AmounPayments += Number(oneActivity.money);
                    const formatedActivity = { ...oneActivity }
                    delete formatedActivity.monthName
                    paymentsDataByMonth[index].data.push(formatedActivity);
                }
                else {
                    // её в массиве нет, создаем
                    const formatedActivity = { ...oneActivity }
                    delete formatedActivity.monthName
                    const monthRow = {
                        monthName: oneActivity.monthName,
                        AmounPayments: Number(oneActivity.money),
                        data: [formatedActivity,]
                    }

                    paymentsDataByMonth.push(monthRow)
                }
            });
            paymentDataByName[lecruterName] = paymentsDataByMonth
        }
        this.payments = paymentDataByName;
    }

    async getPayments(teacherName) {
        // Проверяем, что данные о зп есть и они были обновлены не позднее, чем час назад
        if (this.lastUpdate === null || isOneHourPassed(this.lastUpdate)) {
            await this.updatePayments()
        }
        if (teacherName in this.payments) return this.payments[teacherName]
        else
            for (let name in this.payments) {
                if (name.includes(teacherName)) {
                    this.payments[teacherName] = this.payments[name]
                    return this.payments[teacherName]
                }
            }
        this.payments[teacherName] = null
        return null
    }

}

module.exports = new Payments();