export let now = typeof performance === 'object' 
	? performance.now.bind(performance)
	: Date.now.bind(Date)

export const readonlyProperties = (target, properties, options = {}) => {

	for (let [key, value] of Object.entries(properties))
		Object.defineProperty(target, key, { value, ...options })

}

export const clamp = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x

class EnumKey {

	constructor(props) { readonlyProperties(this, props) }

	toString() { return this.name }

}

export class Enum {

	constructor(...keys) {
		
		for (let [index, key] of keys.entries()) {

			Object.defineProperty(this, key, {

				value: new EnumKey({ name:key, index, enum:this }),
				enumerable: true,

			})

		}

		Object.freeze(this)

	}

	*[Symbol.iterator]() {

		for (let key of Object.keys(this))
			yield this[key]

	}

}
