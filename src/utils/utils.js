
const groupEvery = (array, n) => {

    let result = []

    for (let length = array.length, i = 0; i < length; i++) {

        let index = i / n | 0

        result[index] ? result[index].push(array[i]) : result.push([array[i]])

    }

    return result

}

export {

    groupEvery,
    
}
