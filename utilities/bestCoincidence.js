// Утилита для подсчета колличества совпадений полей запроса менеджера в данных ученика
const countArrayElementsInObject = (array, obj) => {
    let count = 0;

    // Преобразуем значения объекта в массив
    const objectValues = Object.values(obj).flat(); // flat помогает объединить массивы

    // Проходим по каждому элементу массива
    array.forEach(item => {
        // Увеличиваем счетчик, если элемент найден в значениях объекта
        if (objectValues.includes(item)) {
            count++;
        }
    });

    return count;
}

module.exports = countArrayElementsInObject;