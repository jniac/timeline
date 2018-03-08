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

			isRoot: {

				enumerable: true,
				get() { return division.space.isRoot },

			},

		})

	}

	set(props) {

		Object.assign(this, props)

	}

}

export class Division extends eventjs.EventDispatcher {

	constructor(timeline, parent, spaceProps = null, props = null) {

		super()

		if (props && props.color)
			spaceProps.color = props.color

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

		this.space.onUpdate.push(() => this.dispatchEvent('change'))

		readonlyProperties(this.props, { uid: this.uid }, { enumerable: true })

		divisionMap.set(this.space, this)

		if (parent)
			parent.space.addChild(this.space)

	}





	// props:

	setProps(props) {

		this.props.set(props)

		return this

	}

	// convenient methods:

	add(child) {

		if (Array.isArray(child)) {

			for (let child2 of child)
				this.space.addChild(child2.space)

		} else {

			if (!(child instanceof Division))
				child = this.timeline.division(child)

			this.space.addChild(child.space)

		}

		return this

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

	division(propsOrQuery) {

		if (typeof propsOrQuery === 'string')
			return this.query(propsOrQuery)

		// propsOrQuery are props:

		let division = this.timeline.division(propsOrQuery)

		this.space.addChild(division.space)

		return division

	}

	nearest(position, selector = '*') {

		let array = this.query(selector)

		if (!array.length)
			return null

		let distance = Math.abs(array[0].space.globalPosition - position)
		let best = { division: array[0], distance }

		for (let i = 1, division; division = array[i]; i++) {

			distance = Math.abs(division.space.globalPosition - position)

			if (distance < best.distance)
				best = { division, distance }

		}

		return best.division

	}

	// updateSpace(force = false) {

	// 	this.space.update()

	// }

	updateHead(index, headValue) {

		let relative = this.space.range.ratio(headValue)

		// handle the 0 / 0 case (0 / range.width)
		if (isNaN(relative))
			relative = 1

		let contained = this.space.range.contains(headValue)
		let globalClamp = this.space.range.clamp(headValue)
		let relativeClamp = relative < 0 ? 0 : relative > 1 ? 1 : relative

		let newValues = { index, contained, global: headValue, globalClamp, absolute: headValue - this.space.range.min, absoluteClamp: globalClamp - this.space.range.min, relative, relativeClamp }
		let oldValues = this.heads[index] || { index: -1, contained: false, global: NaN, globalClamp: NaN, absolute: NaN, absoluteClamp: NaN, relative: NaN, relativeClamp: NaN }

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
	
	get root() { return this.space.root && divisionMap.get(this.space.root) }
	get isRoot() { return this.space.isRoot }
	get parent() { return this.space.parent && divisionMap.get(this.space.parent) }
	get children() { return this.space.children && this.space.children.map(v => divisionMap.get(v)) }
	isParentOf(division) { return this.space.isParentOf(division.space) }
	isChildOf(division) { return this.space.isChildOf(division.space) }

	contains(value) { return this.space.contains(value) }
	
	get min() { return this.space.range.min }
	get max() { return this.space.range.max }
	get width() { return this.space.range.width }

	get boundsMin() { return this.space.bounds.min }
	get boundsMax() { return this.space.bounds.max }
	get boundsWidth() { return this.space.bounds.width }

	//

	set width(value) { this.space.width.parse(value) }

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
