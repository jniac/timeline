
class Stack {

    constructor() {

        this.array = []

    }

    add(callbackOrBundle, thisArg = null, args = null) {

        let bundle

        if (typeof callbackOrBundle === 'object') {

            bundle = callbackOrBundle

        } else {

            bundle = { callback:callbackOrBundle, thisArg, args }

        }

        this.array.push(bundle)

    }

    remove(props) {

        let entries = Object.entries(props)

        for (let bundle, i = 0; bundle = this.array[i]; i++) {

            if (entries.every(([key, value]) => bundle[key] === value)) {

                this.array.splice(i, 1)
                i--

            }

        }

    }

    execute() {

        for (let { callback, thisArg, args } of [...this.array]) {

            callback.apply(thisArg, args)

        }

    }

}

export default Stack
