const isCopyExistInArray = (array, newObject) => {
    // Function to compare objects by value
    function isEqual(obj1, obj2) {
        // Convert both objects to JSON strings and compare
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    // Check each item in the array
    return array.some(item => isEqual(item, newObject));
}

module.exports = isCopyExistInArray;