import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'
import { Double, Range } from './primitives.js'
import { Space } from './timeline.space.js'
import { now, readonlyProperties, clamp } from './timeline.utils.js'




























let sectionMap = new WeakMap()
let sectionUID = 0

class Section extends eventjs.EventDispatcher {

	constructor(parent, props = null) {

		super()

		readonlyProperties(this, {

			uid: sectionUID++,
			space: new Space(),
			props: { ...props },
			heads: [],

		})

		readonlyProperties(this.props, { uid: this.uid }, { enumerable: true })

		sectionMap.set(this.space, this)

		if (parent)
			parent.space.addChild(this.space)

	}

	query(selector) {

		return query(this, selector)

	}

	queryFirst(selector) {

		return query(this, selector)[0] || null
	}

	updateHead(index, newValues) {

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

		return `Section#${this.uid}{ props: ${props}, r: ${r}, b: ${b} }`

	}

}

class Head {

	constructor(timeline) {

		this.color = 'red'
		this.timeline = timeline
		this._value = NaN
		this._valueOld = NaN

	}

	getIndex() {

		return this.timeline
			? this.timeline.heads.indexOf(this)
			: -1

	}

	get index() { return this.getIndex() }
	get value() { return this._value }
	set value(value) { this.setValue(value) }

	setValue(value) {

		if (this._value === value)
			return this

		this._value = value

	}

	check(force = false) {

		if (force || this._valueOld !== this._value) {

			let index = this.getIndex()
			let value = this._value
			
			this.timeline.rootSection.walk(section => {

				let relative = section.space.getRelative(value)
				let values = { index, global: value, absolute: value - section.space.range.min, relative, relativeClamp: clamp(relative) }
				section.updateHead(index, values)

			})

		}

	}

	update() {

		this.check()

		this._valueOld = this._value

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}








let timelines = []
let timelineUID = 0

export class Timeline {

	constructor(rootWidth = 1) {

		readonlyProperties(this, {

			uid: timelineUID++,
			rootSection: this.createSection(0, rootWidth),
			heads: [],

		})

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

	createSection(position, width, parent = this.rootSection, props = null) {

		let section = new Section(parent, props)
		section.space.position.set(position)
		section.space.width.set(width)
		section.space.resolveSpace()

		this.currentSection = section

		return section

	}

	appendSection(width, props = null) {

		let space = this.currentSection === this.rootSection
			? 0
			: '100%'

		let section = this.createSection(space, width, this.currentSection, props)

		return section

	}

	// shorthands (returning previous methods result)

	query(selector) { return this.rootSection.query(selector) }
	queryFirst(selector) { return this.rootSection.queryFirst(selector) }

	section({ position, min, max, width }) {

		let props = copy(arguments[0], { recursive: false, exclude: 'position, min, max, width' })

		if (position && width !== undefined)
			return this.createSection(position, width, this.currentSection, props)

		if (width)
			return this.appendSection(width, props)

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



