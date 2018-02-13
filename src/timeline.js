import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Utils

const readonlyProperties = (target, properties, options = {}) => {

	for (let [key, value] of Object.entries(properties))
		Object.defineProperty(target, key, { value, ...options })

}

const clamp = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x















// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                                         //
//                                                                                         //
//                                       Primitives                                        //
//                                                                                         //
//                                                                                         //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //

/*
	
	Double

		to hold 2 dimensions position (absolute/relative)

	Space

		to define Spaces... as well as positions (spaces with 0 width)

*/

const percent = /%/

const spaces = /\s/

export class Double {

	static isDouble(value) {

		return value.hasOwnProperty('absolute') && value.hasOwnProperty('relative')

	}

	static parsePercent(value) {

		return parseFloat(value) * (percent.test(value) ? .01 : 1)

	}

	/**
	 * 
	 * x 			> new Double(x, 1)
	 * '100' 		> new Double(100, 0)
	 * '100%' 		> new Double(0, 1)
	 * '50 50%' 	> new Double(50, .5)
	 * '50% 50%' 	> new Double(.5, .5)
	 * [x, y] 		> new Double(x, y)
	 * 
	 */
	static parse(value, relativeValue = null) {

		if (Double.isDouble(value))
			return value

		return new Double().parse(value, relativeValue)

	}

	constructor(absolute = 0, relative = 0) {

		this.absolute = absolute
		this.relative = relative

	}

	parse(value, relativeValue = null) {

		if (relativeValue)
			return this.set(Double.parsePercent(value), Double.parsePercent(relativeValue))

		if (value instanceof Array)
			return this.set(Double.parsePercent(value[0]), Double.parsePercent(value[1]))

		switch(typeof value) {

			case 'number':

				return this.set(value, 0)

			case 'string':
				
				if (spaces.test(value))
					return Double.parse(value.split(spaces))

				return percent.test(value)
					? this.set(0, parseFloat(value) / 100)
					: this.set(parseFloat(value), 0)

			default:

				return this.set(0, 0)

		}

	}

	set(absolute, relative) {

		if (typeof absolute === 'number' && typeof relative === 'number') {

			this.absolute = absolute
			this.relative = relative

			return this

		}

		return this.parse(absolute, relative)

	}

	toString() {

		return this.absolute === 0 && this.relative === 0
			? '0'
			: this.relative === 0
			? this.absolute.toFixed(1)
			: this.absolute === 0
			? (this.relative * 100).toFixed(1) + '%'
			: this.absolute.toFixed(1) + ' ' + (this.relative * 100).toFixed(1) + '%'

	}

}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

let spaceUID = 0

class Space {

	constructor(parent = null) {

		readonlyProperties(this, {

			uid: spaceUID++,
			localPosition: new Double(0, 0),
			localWidth: new Double(0, 1),

		})

		Object.assign(this, {

			parent,
			
			globalValue: 0,
			globalWidth: 1,

			globalBoundsMin: 0,
			globalBoundsMax: 0,
			
			children: null,

		})

	}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (!this.children)
			this.children = []

		child.parent = this
		this.children.push(child)

		return this

	}

	removeChild(child) {

		if (child.parent !== this)
			throw 'child argument is not a child of this'

		child.parent = null
		this.children.splice(this.children.indexOf(child), 1)

		return this

	}

	getRelative(globalValue) {

		return (globalValue - this.globalValue) / this.globalWidth

	}

	resolve(value) { return this.globalValue + this.globalWidth * value.relative + value.absolute }

	resolveValue(absoluteValue, relativeValue = 0) { return this.globalValue + this.globalWidth * relativeValue + absoluteValue }

	// R stands for recursive
	resolveR() {

		let { parent, localPosition, localWidth, children } = this

		let globalValue = !parent
			? localPosition.relative + localPosition.absolute
			: parent.globalValue + parent.globalWidth * localPosition.relative + localPosition.absolute

		let globalWidth = !parent
			? localWidth.relative + localWidth.absolute
			: parent.globalWidth * localWidth.relative + localWidth.absolute

		Object.assign(this, {

			globalValue,
			globalWidth,

		})

		this.globalBoundsMin = this.globalValue
		this.globalBoundsMax = this.globalValue + this.globalWidth

		if (children)
			
			for (let space of children) {
				
				space.resolveR()

				if (this.globalBoundsMin > space.globalBoundsMin)
					this.globalBoundsMin = space.globalBoundsMin

				if (this.globalBoundsMax < space.globalBoundsMax)
					this.globalBoundsMax = space.globalBoundsMax

			}

		return this

	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

	walk(callback) {

		callback(this)

		if (this.children)
			for (let child of this.children)
				child.walk(callback)

		return this

	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

	contains(value) {

		return value >= this.globalValue && value <= this.globalValue + this.globalWidth

	}

	getSpaces(value) {

	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

	toString() {

		return `Space{#${this.uid}, d:${this.depth}, p:${this.globalValue.toFixed(1)} (${this.localPosition.toString()}), w:${this.globalWidth.toFixed(1)} (${this.localWidth.toString()}), b:[${this.globalBoundsMin.toFixed(0)},${this.globalBoundsMax.toFixed(0)}]}`

	}

}


















// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                                         //
//                                                                                         //
//                                       High-Level                                        //
//                                                                                         //
//                                                                                         //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //

/*

Section:
	
	Section is built on top of Space


*/

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

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

	updateHead(index, values) {

		let oldValues = this.heads[index] || { index: -1, global: NaN, absolute: NaN, relative: NaN, relativeClamp: NaN }

		this.heads[index] = values

		let wasInside = oldValues.relative >= 0 && oldValues.relative <= 1
		let isInside = values.relative >= 0 && values.relative <= 1

		let stayInside = wasInside && isInside
		let enter = !wasInside && isInside
		let exit = wasInside && !isInside

		if (isNaN(oldValues.global))
			this.dispatchEvent(`init-head${index}`, { values, oldValues })

		if (enter)
			this.dispatchEvent(`enter-head${index}`, { values, oldValues })

		if (exit)
			this.dispatchEvent(`exit-head${index}`, { values, oldValues })

		if (isInside)
			this.dispatchEvent(`inside-head${index}`, { values, oldValues })

	}

	// traps:
	get parent() { return this.space.parent && sectionMap.get(this.space.parent) }
	get children() { return this.space.children && this.space.children.map(v => sectionMap.get(v)) }

	walk(callback) {

		this.space.walk(space => callback(sectionMap.get(space)))

		return this

	}

	toString() {

		let r = `[${this.space.globalValue}, ${this.space.globalValue + this.space.globalWidth}]`
		let b = `[${this.space.globalBoundsMin}, ${this.space.globalBoundsMax}]`
		let props = propsToString(copy(this.props, { exclude: 'uid' }))

		return `Section#${this.uid}{ props: ${props}, r: ${r}, b: ${b} }`

	}

}

class Head {

	constructor(timeline) {

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
				let values = { index, global: value, absolute: value - section.space.globalValue, relative, relativeClamp: clamp(relative) }
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

		this.rootSection.space.resolveR()

		for (let head of this.heads)
			head.update()

	}

	createSection(space, width, parent = this.rootSection, props = null) {

		let section = new Section(parent, props)
		section.space.localPosition.set(space)
		section.space.localWidth.set(width)
		section.space.resolveR()

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

	section({ min, max, width }) {

		let props = copy(arguments[0], { recursive: false, exclude: 'min, max, width' })

		if (min === undefined && width)
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



