export let now = typeof performance === 'object' 
	? performance.now.bind(performance)
	: Date.now.bind(Date)

export const readonlyProperties = (target, properties, options = {}) => {

	for (let [key, value] of Object.entries(properties))
		Object.defineProperty(target, key, Object.assign({ value }, options))

}

export const clamp = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x



/**
 * key can be compared via 'is':
 * 
 * let e = new Enum('FOO', 'BAR')
 * let key = e.FOO
 * key.is.FOO // true
 * key.is.BAR // false
 *
 */
class EnumKey {

	constructor(enumInstance, index, keys) { 

		Object.assign(this, {

			enum: enumInstance,
			name: keys[index],
			index,
			is: keys.reduce((r, v, i) => Object.defineProperty(r, v, {

				value: i === index,
				enumerable: true,

			}), {}),

		})

		Object.freeze(this)
	
	}

	toString() { return this.name }

}

export class Enum {

	constructor(...keys) {

		for (let [index, key] of keys.entries()) {

			Object.defineProperty(this, key, {

				value: new EnumKey(this, index, keys),
				enumerable: true,

			})

		}

		Object.freeze(this)

	}

	has(key) { return this[key] === key }

	*[Symbol.iterator]() {

		for (let key of Object.keys(this))
			yield this[key]

	}

	toString() { return [...this].join(', ') }

}
