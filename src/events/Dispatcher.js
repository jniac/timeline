
// NOTE: map could be a WeakMap... when debugging will be done!
let map = new Map()

const ensure = (target) => {

    let listener = map.get(target)

    if (!listener) {

        listener = {

            target,
            array: [],

        }

        map.set(target, listener)

    }

    return listener

}

const on = (target, eventType, callback, props = null) => {

    let listener = ensure(target)

    listener.array.push({

        eventType,
        callback,
        ...props,

    })

}

const off = (target, eventType, callback, props = null) => {

    let listener = map.get(target)

    if (!listener)
        return

    let entries = props ? Object.entries(props) : []

    let { array } = listener

    for (let bundle, i = 0; bundle = array[i]; i++) {

        let match =
            (eventType === 'all' || String(eventType) === String(bundle.eventType))
            && (!callback || callback === bundle.callback)
            && entries.every(([key, value]) => bundle[key] === value)

        if (match) {

            array.splice(i, 1)
            i--

        }

    }

    if (array.length === 0) {

        map.delete(target)

    }

}

const once = (target, eventType, callback, props = null) => {

    let onceCallback = function(...args) {

        off(target, eventType, onceCallback, props)

        callback.call(target, ...args)

    }

    on(target, eventType, onceCallback, props)

}

const makeEvent = (target, type, cancelable = true) => {

    let canceled = false
    let cancel = cancelable ? () => canceled = true : () => {}

    return {
        target,
        type,
        cancel,
        get canceled() { return canceled },
    }

}

const fire = (target, event, ...args) => {

    let listener = map.get(target)

    if (!listener)
        return

    if (typeof event === 'string') {

        event = makeEvent(target, event)

    }

    for (let { eventType, callback } of [...listener.array]) {

        let match = false

        if (typeof eventType === 'string') {

            match = eventType === event.type

        } else if (eventType instanceof RegExp) {

            match = eventType.test(event.type)

        }

        if (match) {

            callback.call(target, event, ...args)

        }

        if (event.canceled) {

            break

        }

    }

}

const makeDispatcher = (target) => {

    Object.assign(target, {

        // NOTE: be carefull method signatures should match precisely global method signatures

        on: function(target, eventType, callback, props = null) {

            on(this, target, eventType, callback, props = null)

            return this

        },

        off: function(target, eventType, callback, props = null) {

            off(this, target, eventType, callback, props = null)

            return this

        },

        once: function(target, eventType, callback, props = null) {

            once(this, target, eventType, callback, props = null)

            return this

        },

        fire: function(event, ...args) {

            fire(this, event, ...args)

            return this

        },

        debugGetListener: function() {

            return map.get(target)

        },

    })

}

export {

    on,
    off,
    once,
    fire,
    makeDispatcher,

}
