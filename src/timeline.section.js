import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'
import { Space } from './timeline.space.js'

let sectionMap = new WeakMap()
let sectionUID = 0

export class Section extends eventjs.EventDispatcher {

	constructor(timeline, parent, spaceProps = null, props = null) {

		super()

		readonlyProperties(this, {

			uid: sectionUID++,
			space: new Space(spaceProps),
			props: { ...props },
			heads: [],

		})

		Object.assign(this, {

			timeline,

		})

		readonlyProperties(this.props, { uid: this.uid }, { enumerable: true })

		sectionMap.set(this.space, this)

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

		let eventData = { progress:relativeClamp, direction, values:newValues, oldValues }

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
	get parent() { return this.space.parent && sectionMap.get(this.space.parent) }
	get children() { return this.space.children && this.space.children.map(v => sectionMap.get(v)) }

	walk(callback) {

		this.space.walk(space => callback(sectionMap.get(space)))

		return this

	}

	toString() {

		let r = `[${this.space.range.min}, ${this.space.range.min + this.space.range.width}]`
		let b = `[${this.space.bounds.min}, ${this.space.bounds.max}]`
		let props = propsToString(copy(this.props, { exclude: 'uid' }))

		return `Section#${this.uid} {props: ${props}, r: ${r}, b: ${b}}`

	}

}
