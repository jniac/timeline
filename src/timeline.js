import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'
import { Double, Range } from './primitives.js'
import { Space } from './timeline.space.js'
import { Head } from './timeline.head.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'




























let sectionMap = new WeakMap()
let sectionUID = 0

class Section extends eventjs.EventDispatcher {

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

		let leave = 		old_r <= 1 && new_r > 1 ||
							old_r >= 0 && new_r < 0

		if (isNaN(oldValues.global))
			this.dispatchEvent(`init-head${index}`, { values:newValues, oldValues, direction })

		if (enter)
			this.dispatchEvent(`enter-head${index}`, { values:newValues, oldValues, direction })

		if (exit)
			this.dispatchEvent(`exit-head${index}`, { values:newValues, oldValues, direction })

		if (isInside)
			this.dispatchEvent(`inside-head${index}`, { values:newValues, oldValues, direction })

		if (leave)
			this.dispatchEvent(`leave-head${index}`, { values:newValues, oldValues, direction })

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









let timelines = []
let timelineUID = 0

export class Timeline {

	constructor(rootWidth = 1) {

		readonlyProperties(this, {

			uid: timelineUID++,
			rootSection: this.createSection(null, { width: rootWidth }),
			heads: [],

		})

		this.currentSection = this.rootSection

		Object.assign(this, {

			enabled: true,

		})

		this.newHead()

		timelines.push(this)

	}

	newHead() {

		this.heads.push(new Head(this))

	}

	get head() { return this.heads[0] }

	update() {

		let t = now()

		this.rootSection.space.resolveSpace()

		for (let head of this.heads)
			head.update()

		let dt = now() - t

	}

	createSection(parent = this.rootSection, spaceProps, props = null) {

		let section = new Section(this, parent, spaceProps, props)

		this.lastSection = section

		return section

	}

	// appendSection(width, props = null) {

	// 	let position = this.currentSection === this.rootSection
	// 		? 0
	// 		: '100%'

	// 	let section = this.createSection(position, width, this.currentSection, props)

	// 	return section

	// }

	// shorthands (returning previous methods result)

	query(selector) { return this.rootSection.query(selector) }
	// queryFirst(selector) { return this.rootSection.queryFirst(selector) }

	section({ parent = null, position = 0, width = '100%', align = '100%', order = 0, expand }) {

		let props = copy(arguments[0], { recursive: false, exclude: 'parent, position, width, align, order, expand' })

		if (typeof parent === 'string')
			parent = this.query(parent)

		if (Array.isArray(parent))
			parent = parent[0]

		if (!parent)
			parent = this.currentSection

		return this.createSection(parent, { position, width, align, order, expand }, props)

		return null

	}

}

function udpateTimelines() {

	if (typeof requestAnimationFrame === 'undefined')
		throw 'requestAnimationFrame is not available, cannot run'

	requestAnimationFrame(udpateTimelines)

	for (let timeline of timelines)
		if (timeline.enabled)
			timeline.update()

}

udpateTimelines()



