import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'
import { Space } from './timeline.space.js'

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

let divisionMap = new WeakMap()
let divisionUID = 0

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
			localHeads: [],

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

			for (let child2 of child) {

				if (!(child2 instanceof Division))
					child2 = this.timeline.division(child2)

				this.space.addChild(child2.space)

			}

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

	removeAll(filter = null) {

		for (let division of this.children) {

			if (!filter || filter(division))
				division.remove()

		}

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

	nearest({ position, selector = '*', distanceMax = Infinity } = {}) {

		let array = this.query(selector)

		if (!array.length)
			return null

		let division = null
		let distance = distanceMax
		let best = { division, distance }

		for (let i = 0; division = array[i]; i++) {

			distance = Math.abs(division.space.globalPosition - position)

			if (distance <= best.distance)
				best = { division, distance }

		}

		return best.division

	}

	updateHead(head, extraEvent = null, forcedEvent = null) {

		let headValue = head.roundPosition
		let headIndex = head.getIndex()
		let relative = this.space.range.ratio(headValue)

		// handle the 0 / 0 case (0 / range.width)
		if (isNaN(relative))
			relative = 1

		let contained = this.space.range.contains(headValue)
		let overlap = head.space.range.intersects(this.space.range)

		let globalClamp = this.space.range.clamp(headValue)
		let relativeClamp = relative < 0 ? 0 : relative > 1 ? 1 : relative

		let newValues = {

			head,
			headIndex,
			contained,
			overlap,
			global: headValue,
			globalClamp,
			absolute: headValue - this.space.range.min,
			absoluteClamp: globalClamp - this.space.range.min,
			relative,
			relativeClamp,

		}

		let oldValues = this.localHeads[headIndex] || {

			head: null,
			headIndex: -1,
			contained: false,
			overlap: false,
			global: NaN,
			globalClamp: NaN,
			absolute: NaN,
			absoluteClamp: NaN,
			relative: NaN,
			relativeClamp: NaN,

		}

		this.localHeads[headIndex] = newValues

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

		let progress = 		isInside || pass

		if (forcedEvent) {

			forcedEvent = Array.isArray(forcedEvent) ? forcedEvent : forcedEvent.split(/\s/)

			for (let event of forcedEvent) {

				init = init || event === 'init'
				enter = enter || event === 'enter'
				exit = exit || event === 'exit'
				pass = pass || event === 'pass'
				progress = progress || event === 'progress'
				overlap = overlap || event === 'overlap'

			}

		}

		let eventData = { progress:relativeClamp, direction, values:newValues, oldValues, range:this.space.range }

		if (isNaN(oldValues.global))
			this.dispatchEvent(`init-${head.name}`, eventData)

		if (enter)
			this.dispatchEvent(`enter-${head.name}`, eventData)

		if (exit)
			this.dispatchEvent(`exit-${head.name}`, eventData)

		if (progress)
			this.dispatchEvent(`progress-${head.name}`, eventData)

		if (pass)
			this.dispatchEvent(`pass-${head.name}`, eventData)

		if (overlap || oldValues.overlap)
			this.dispatchEvent(`overlap-${head.name}`, eventData)

		if (extraEvent)
			this.dispatchEvent(`${extraEvent}-${head.name}`, eventData)

		return this

	}

	// traps:

	get root() { return this.space.root && divisionMap.get(this.space.root) }
	get isRoot() { return this.space.isRoot }
	get parent() { return this.space.parent && divisionMap.get(this.space.parent) }

	get children() {

		// OPTIMIZE : the result could be cached, since the children array does not change frequently,
		// kind of a mess: it's quite complicated to use the dirty flag outside Space

		let array = []

		for (let child of this.space.children) {

			let division = divisionMap.get(child)

			if (division)
				array.push(division)

		}

		return array

	}

	isParentOf(division) { return this.space.isParentOf(division.space) }
	isChildOf(division) { return this.space.isChildOf(division.space) }

	contains(value) { return this.space.contains(value) }

	get position() { return this.space.globalPosition }
	get min() { return this.space.range.min }
	get max() { return this.space.range.max }
	get width() { return this.space.range.width }

	get boundsMin() { return this.space.bounds.min }
	get boundsMax() { return this.space.bounds.max }
	get boundsWidth() { return this.space.bounds.width }

	//

	set width(value) { this.space.width.parse(value) }

	walk(callback) {

		this.space.walk(space => {

			let division = divisionMap.get(space)

			if (division)
				callback(division)

		})

		return this

	}

	// utils

	/**
	 * Very useful function to smoothly clamp head inside a division (allowing some controlled overflow).
	 */
	getLimitedValue(value, maxOverflow = 300) {

		if (value < this.space.range.min)
			return this.space.range.min - Mth.limit(this.space.range.min - value, maxOverflow)

		if (value > this.space.range.max)
			return this.space.range.max + Mth.limit(value - this.space.range.max, maxOverflow)

		return value

	}

	/**
	 * Very useful function to smoothly bring back head instance into the division bounds.
	 * This function should be called in runtime loop.
	 */
	bringBackHeadInside({ head = this.timeline.head, ease = .25, friction = .001 } = {}) {

		let { range } = this.space
		let { mobile } = head

		if (!range.contains(mobile.position)) {

			mobile.velocity *= friction ** (1 / 60)

			if (mobile.position < range.min)
				mobile.position += (range.min - mobile.position) * ease

			if (mobile.position > range.max)
				mobile.position += (range.max - mobile.position) * ease

		}

	}





	toString() {

		let r = `[${this.space.range.min.toFixed(1)}, ${this.space.range.max.toFixed(1)}]`
		let b = `[${this.space.bounds.min.toFixed(1)}, ${this.space.bounds.max.toFixed(1)}]`
		let props = propsToString(copy(this.props, { exclude: 'uid' }))

		return `Division#${this.uid} { props: ${props}, r: ${r}, b: ${b} }`

	}

}
