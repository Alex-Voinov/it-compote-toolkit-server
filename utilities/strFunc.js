const capitalize = (str) => {
    if (typeof str !== 'string') return ''; // Handle non-string input
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = { capitalize }