import { Double, Range } from './primitives.js'
import { now, readonlyProperties, clamp } from './timeline.utils.js'





let spaceUID = 0

export class Space {

	constructor(parent = null) {

		readonlyProperties(this, {

			uid: spaceUID++,
			position: new Double(0, 0),
			width: new Double(0, 1),
			align: new Double(0, 1), // 100% = align left, 0% = center, -100% = align right

			range: new Range(0, 1),
			bounds: new Range(0, 0),

		})

		Object.assign(this, {

			parent,
			
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

	getRelative(value) {

		return (value - this.range.min) / this.range.width

	}

	resolve(value) { return this.range.min + this.range.width * value.relative + value.absolute }

	resolveValue(absoluteValue, relativeValue = 0) { return this.range.min + this.range.width * relativeValue + absoluteValue }

	/**
	 * recursive
	 */
	resolveSpace() {

		let { range, parent, position, width, align, children } = this

		let rangeWidth = !parent
			? width.relative + width.absolute
			: parent.range.width * width.relative + width.absolute

		let alignOffset = range.width * (align.relative - 1) / 2 + align.absolute

		range.min = !parent
			? alignOffset + position.relative + position.absolute
			: alignOffset + parent.range.min + parent.range.width * position.relative + position.absolute

		range.width = rangeWidth

		this.bounds.min = range.min
		this.bounds.max = range.max

		if (children)
			
			for (let space of children) {
				
				space.resolveSpace()

				if (this.bounds.min > space.bounds.min)
					this.bounds.min = space.bounds.min

				if (this.bounds.max < space.bounds.max)
					this.bounds.max = space.bounds.max

			}

		return this

	}

	walk(callback) {

		callback(this)

		if (this.children)
			for (let child of this.children)
				child.walk(callback)

		return this

	}

	contains(value) {

		return value >= this.range.min && value <= this.range.min + this.range.width

	}

	getSpaces(value) {

	}

	toString() {

		return `Space#${this.uid} { d:${this.depth}, p:${this.position.toString()}, w:${this.width.toString()} r:${this.range.toString(1)}, b:${this.bounds.toString(1)} }`

	}

}
