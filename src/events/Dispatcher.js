
let map = new WeakMap()

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

    let onceCallback = function(event) {

        off(target, eventType, onceCallback, props)

        callback.apply(target, event)

    }

    on(target, eventType, onceCallback, props)

}

const makeEvent = (type, cancelable = true) => {

    let canceled = false
    let cancel = cancelable ? () => canceled = true : () => {}

    return {
        type,
        cancel,
        get canceled() { return canceled },
    }

}

const fire = (target, event) => {

    let listener = map.get(target)

    if (!listener)
        return

    if (typeof event === 'string') {

        event = makeEvent(event)

    }

    for (let { eventType, callback } of [...listener.array]) {

        let match

        if (typeof eventType === 'string') {

            match = eventType === event.type

        } else if (eventType instanceof RegExp) {

            match = eventType.test(event.type)

        }

        if (match) {

            callback.call(target, event)

        }

    }

}

const makeDispatcher = (target) => {

    Object.assign(target, {

        on: on.bind(null, target),
        off: off.bind(null, target),
        once: once.bind(null, target),
        fire: fire.bind(null, target),

        debugGetListener: () => map.get(target),

    })

}

export {

    on,
    off,
    once,
    fire,
    makeDispatcher,

}
