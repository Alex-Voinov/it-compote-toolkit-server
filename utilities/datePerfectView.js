function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'long', // 'short' для сокращенного названия месяца
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };

    return new Intl.DateTimeFormat('ru-RU', options).format(date);
}

module.exports = formatDate;