import { Double, Range } from './primitives.js'
import { now, readonlyProperties, clamp, Enum } from './timeline.utils.js'





const LayoutEnum = new Enum(
	'ABSOLUTE', 
	'STACK',
	// 'FLOAT',
)





let spaceUID = 0

export class Space {

	constructor({ position = 0, width = '100%', align = '100%', order = 0 } = {}) {

		readonlyProperties(this, {

			uid: spaceUID++,

			range: new Range(0, 1),
			bounds: new Range(0, 0),

			// design
			position: new Double().set(position),
			width: new Double().set(width),
			align: new Double().set(align), // 100% = align left, 0% = center, -100% = align right

		})

		Object.assign(this, {

			// design
			layout: LayoutEnum.STACK,
			order,

			// hierarchy
			parent: null,
			index: -1,
			children: [],
			floatChildren: [],

		})

	}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (child.parent)
			child.parent.removeChild(child)

		child.parent = this
		child.index = this.children.length
		this.children.push(child)

		return this

	}

	removeChild(child) {

		if (child.parent !== this)
			throw 'child argument is not a child of this'

		child.parent = null
		child.index = -1
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
	resolveSpace(offset = 0) {

		let { range, parent, position, width, align, children } = this

		let rangeWidth = !parent
			? width.relative + width.absolute
			: parent.range.width * width.relative + width.absolute

		let alignOffset = range.width * (align.relative - 1) / 2 + align.absolute

		range.min = !parent
			? offset + alignOffset + position.relative + position.absolute
			: offset + alignOffset + parent.range.min + parent.range.width * position.relative + position.absolute

		range.width = rangeWidth

		this.bounds.min = range.min
		this.bounds.max = range.max

		// children:

		children.sort((a, b) => a.order - b.order || a.index - b.index)

		let childOffset = 0
		this.floatChildren.length = 0

		for (let child of children) {
			
			child.resolveSpace(childOffset)

			if (child.layout === LayoutEnum.STACK)
				childOffset += child.range.width

			if (this.bounds.min > child.bounds.min)
				this.bounds.min = child.bounds.min

			if (this.bounds.max < child.bounds.max)
				this.bounds.max = child.bounds.max

		}

		return this

	}

	walk(callback) {

		callback(this)

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

		return `Space#${this.uid} {${this.layout} d:${this.depth}, p:${this.position.toString()}, w:${this.width.toString()} r:${this.range.toString(1)}, b:${this.bounds.toString(1)}}`

	}

}
