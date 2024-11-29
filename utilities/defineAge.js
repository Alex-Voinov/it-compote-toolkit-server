const calculateAge = (birthDayString) => {
    const currentDate = new Date();
    const PresentDate = {
        Year: currentDate.getFullYear(),
        Month: currentDate.getMonth(),
        Day: currentDate.getDate()
    }


    const birthDay = new Date(birthDayString)
    const birthDate = {
        Year: birthDay.getFullYear(),
        Month: birthDay.getMonth(),
        Day: birthDay.getDate()
    }

    const age = [Math.abs(PresentDate.Year - birthDate.Year), Math.abs(PresentDate.Month - birthDate.Month), Math.abs(PresentDate.Day - birthDate.Day)]

    if (age[1] > 5 && age[2] >= 1) {
        return (age[0] + 1)
    }
    return (age[0])
}

module.exports = calculateAge