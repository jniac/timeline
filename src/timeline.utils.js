export let now = typeof performance === 'object' 
	? performance.now.bind(performance)
	: Date.now.bind(Date)

export const readonlyProperties = (target, properties, options = {}) => {

	for (let [key, value] of Object.entries(properties))
		Object.defineProperty(target, key, { value, ...options })

}

export const clamp = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x

