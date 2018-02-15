import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'
import { Space } from './timeline.space.js'

let divisionMap = new WeakMap()
let divisionUID = 0

export class DivisionProps {

	constructor(division, props) {

		Object.assign(this, props)

		Object.defineProperties(this, {

			root: {

				enumerable: true,
				get() { return !division.space.parent } 

			},

		})

	}

}

export class Division extends eventjs.EventDispatcher {

	constructor(timeline, parent, spaceProps = null, props = null) {

		super()

		readonlyProperties(this, {

			uid: divisionUID++,
			space: new Space(spaceProps),
			// props: Object.assign({}, props),
			props: new DivisionProps(this, props),
			heads: [],

		})

		Object.assign(this, {

			timeline,

		})

		readonlyProperties(this.props, { uid: this.uid }, { enumerable: true })

		divisionMap.set(this.space, this)

		if (parent) {
			console.log(parent)
			parent.space.addChild(this.space)
		}

	}

	addTo(parent) {

		if (typeof parent === 'string')
			parent = this.timeline.query(parent)

		if (Array.isArray(parent))
			parent = parent[0]

		parent.space.addChild(this.space)

		return this

	}

	remove() {

		this.space.remove()

		return this

	}

	query(selector) {

		return query(this, selector)

	}

	// queryFirst(selector) {

	// 	return query(this, selector)[0] || null
	// }

	updateHead(index, headValue) {

		let relative = this.space.range.ratio(headValue)

		// handle the 0 / 0 case (0 / range.width)
		if (isNaN(relative))
			relative = 1

		let relativeClamp = relative < 0 ? 0 : relative > 1 ? 1 : relative

		let newValues = { index, global: headValue, absolute: headValue - this.space.range.min, relative, relativeClamp }
		let oldValues = this.heads[index] || { index: -1, global: NaN, absolute: NaN, relative: NaN, relativeClamp: NaN }

		this.heads[index] = newValues

		let old_r = 		oldValues.relative
		let new_r = 		newValues.relative
		let direction = 	old_r < new_r ? 1 : -1

		// flags:

		let wasInside = 	old_r >= 0 && old_r <= 1
		let isInside = 		new_r >= 0 && new_r <= 1

		let stayInside = 	wasInside && isInside
		let enter = 		!wasInside && isInside
		let exit = 			wasInside && !isInside

		let pass = 			old_r <= 1 && new_r > 1 ||
							old_r >= 0 && new_r < 0

		let eventData = { progress:relativeClamp, direction, values:newValues, oldValues, propagateTo: target => target instanceof Division && this.timeline }

		if (isNaN(oldValues.global))
			this.dispatchEvent(`init-head${index}`, eventData)

		if (enter)
			this.dispatchEvent(`enter-head${index}`, eventData)

		if (exit)
			this.dispatchEvent(`exit-head${index}`, eventData)

		if (isInside || pass)
			this.dispatchEvent(`progress-head${index}`, eventData)

		if (pass)
			this.dispatchEvent(`pass-head${index}`, eventData)

	}

	// traps:
	get parent() { return this.space.parent && divisionMap.get(this.space.parent) }
	get children() { return this.space.children && this.space.children.map(v => divisionMap.get(v)) }

	walk(callback) {

		this.space.walk(space => callback(divisionMap.get(space)))

		return this

	}

	toString() {

		let r = `[${this.space.range.min}, ${this.space.range.min + this.space.range.width}]`
		let b = `[${this.space.bounds.min}, ${this.space.bounds.max}]`
		let props = propsToString(copy(this.props, { exclude: 'uid' }))

		return `Division#${this.uid} {props: ${props}, r: ${r}, b: ${b}}`

	}

}
