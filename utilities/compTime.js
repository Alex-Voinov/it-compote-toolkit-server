// Используется для сравнения дат занятий с игнорировнием часов и минут

function compareDatesOnly(date) {
    const date1 = new Date(date)
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const date2 = new Date();
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return d1 <= d2;
}

module.exports = compareDatesOnly;