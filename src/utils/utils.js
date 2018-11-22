
const safeArray = (object) => {

    if (object === null || object === undefined)
        return []

    if (typeof object !== 'object') {

        return [object]

    } else {

        return Symbol.iterator in object ? [...object] : [object]

    }

}

const groupEvery = (array, n) => {

    let result = []

    for (let length = array.length, i = 0; i < length; i++) {

        let index = i / n | 0

        result[index] ? result[index].push(array[i]) : result.push([array[i]])

    }

    return result

}

const readonly = (target, props, { enumerable = true, configurable = false } = {}) => {

    for (let [key, value] of Object.entries(props)) {

        Object.defineProperty(target, key, { value, enumerable, configurable })

    }

}

const biggest = (number, ...numbers) => {

    let max = Math.abs(number)
    let maxSign = number > 0 ? 1 : -1

    for (let number of numbers) {

        let abs = Math.abs(number)

        if (abs > max) {

            max = abs
            maxSign = number > 0 ? 1 : -1

        }

    }

    return max * maxSign

}

const makeSvg = (elementOrTypeOrArray, { parent, className, ...props } = {}) => {

    if (elementOrTypeOrArray instanceof Array) {

        return elementOrTypeOrArray.map(item => makeSvg(item, { parent, ...props }))

    }

    let element = typeof elementOrTypeOrArray === 'object'
        ? elementOrTypeOrArray
        : document.createElementNS('http://www.w3.org/2000/svg', elementOrTypeOrArray)

    if (className) {

        for (let name of className.split(' ')) {

            element.classList.add(name)

        }

    }

    for (let [key, value] of Object.entries(props)) {

        if (value === null) {

            element.removeAttributeNS(null, key)

        } else {

            element.setAttributeNS(null, key, value)

        }

    }

    if (parent) {

        parent.appendChild(element)

    }

    return element

}





export {

    safeArray,
    groupEvery,
    readonly,
    biggest,
    makeSvg,

}
