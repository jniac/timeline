import { Double, Range } from './primitives.js'
import { now, readonlyProperties, clamp, Enum } from './timeline.utils.js'





const LayoutEnum = new Enum(

	'ABSOLUTE', 		// only position define space global position
	'STACKED',			// position is affected by index in children array
)

const ExpandEnum = new Enum(

	'FIXED',			// width is fixed (from 'width' property)
	'EXPAND',			// width is computed from content

)




let spaceUID = 0

export class Space {

	constructor({ position = 0, width = '100%', align = '100%', order = 0, layout, expand } = {}) {

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
			layout: LayoutEnum[layout] || LayoutEnum.STACKED,
			expand: ExpandEnum[expand] || ExpandEnum.FIXED,
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

	remove() {

		if (this.parent)
			this.parent.removeChild(this)

		return this

	}

	getFixedParent() {

		let parent = this.parent

		while(parent && parent.expand !== ExpandEnum.FIXED)
			parent = parent.parent

		return parent

	}

	resolve(value) { return this.range.min + this.range.width * value.relative + value.absolute }

	resolveValue(absoluteValue, relativeValue = 0) { return this.range.min + this.range.width * relativeValue + absoluteValue }

	/**
	 * recursive
	 */
	resolveSpace(offset = 0) {

		let { parent, range, position, width, align, children } = this

		// self layout:

		let fixedParent = this.getFixedParent()

		let rangeWidth = !fixedParent
			? width.relative + width.absolute
			: fixedParent.range.width * width.relative + width.absolute

		let alignOffset = rangeWidth * (align.relative - 1) / 2 + align.absolute

		this.globalPosition = offset + (parent ? parent.range.interpolate(position.relative) : position.relative) + position.absolute

		range.min = !parent
			? offset + alignOffset + position.relative + position.absolute
			: offset + alignOffset + parent.range.min + parent.range.width * position.relative + position.absolute

		range.width = rangeWidth

		if (this.expand === ExpandEnum.EXPAND)
			this.range.copy(this.bounds)

		this.bounds.copy(this.range)

		// children:

		children.sort((a, b) => a.order - b.order || a.index - b.index)

		let childOffset = 0
		this.floatChildren.length = 0

		for (let child of children) {
			
			child.resolveSpace(childOffset)

			if (child.layout === LayoutEnum.STACKED) {

				childOffset += child.range.width

				if (this.expand === ExpandEnum.EXPAND)
					this.range.union(child.range)

			}

			this.bounds.union(child.bounds)

		}

		// if (this.expand === ExpandEnum.EXPAND)
		// 	this.range.copy(this.bounds)

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
