import { Double, Range } from './primitives.js'
import { now, readonlyProperties, clamp, Enum } from './timeline.utils.js'

import { SpaceProperty } from './timeline.space-property.js'



const PositionMode = new Enum(

	'STACK',			// position depends on previous spaces
	'FREE', 			// position depends on [this.position] and [this.parent.range]
)

const WidthMode = new Enum(

	'FIXED',			// width is fixed (by 'width' property)
	'CONTENT',			// width is computed from content

	// TODO, implement:
	'FLEX',				// width is fixed (by 'width' property), but children width is computed from their contribution among the available width

)




let spaceUID = 0

export class Space {

	constructor({ position = 0, width = '100%', align = '100%', order = 0, positionMode, widthMode } = {}) {

		readonlyProperties(this, {

			uid: spaceUID++,

		})

		Object.assign(this, {

			// design:
			
			positionMode: PositionMode[positionMode] || PositionMode.STACK,
			position: new Double().set(position),
			globalPosition: NaN,

			widthMode: WidthMode[widthMode] || WidthMode.FIXED,
			width: new Double().set(width),
			globalWidth: 0,
			
			order,
			align: new Double().set(align), // 100% = align left, 0% = center, -100% = align right

			// maths:

			range: new Range(0, 1),
			bounds: new Range(0, 0),

			// hierarchy:

			root: this,
			parent: null,
			children: [],
			sortedChildren: [],

			childrenUniqueIdentifierCount: 0,
			childUniqueIdentifier: -1,

			// debug:

			color: null,

		})

	}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (child.parent)
			child.parent.removeChild(child)

		child.root = this.root
		child.parent = this
		child.childUniqueIdentifier = this.childrenUniqueIdentifierCount++
		this.children.push(child)

		this.children.sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)

		return this

	}

	removeChild(child) {

		if (child.parent !== this)
			throw 'child argument is not a child of this'

		child.root = this
		child.parent = null
		child.childUniqueIdentifier = -1
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

		while(parent && parent.widthMode !== WidthMode.FIXED)
			parent = parent.parent

		return parent

	}

	resolveSpace() {

		this.resolveWidth()
		this.resolvePosition()

	}

	getParentGlobalWidth() {

		let space = this.parent

		while(space && space.widthMode.is.CONTENT)
			space = space.parent

		// important if no fixed parent is found: 
		// globalWidth is computed from root.width
		return space ? space.globalWidth : this.root.width.solve(0)

	}

	resolveWidth() {

		// this.sortedChildren = this.children.concat().sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)

		if (this.widthMode.is.CONTENT) {

			this.globalWidth = 0

			for (let child of this.children) {

				child.resolveWidth()

				if (child.positionMode.is.STACK)
					this.globalWidth += child.globalWidth

			}

		} else {

			this.globalWidth = this.width.solve(this.getParentGlobalWidth())

			for (let child of this.children)
				child.resolveWidth()

		}

	}

	computePosition() {

		/*
			Global position must be relative to parent.range (and not parent.globalPosition) 
			since range can be modified by align.
		*/

		return this.parent

			? this.parent.range.min + this.position.solve(this.parent.globalWidth)

			: this.position.solve(0)

	}

	resolvePosition(stackOffset = 0) {

		if (this.positionMode.is.FREE) {

			this.globalPosition = this.computePosition()

			let alignOffset = this.align.solveAlign(this.globalWidth)
			this.range.min = this.globalPosition + alignOffset
			this.range.max = this.globalPosition + alignOffset + this.globalWidth

		} else {

			this.globalPosition = this.computePosition() + stackOffset
			this.range.min = this.globalPosition
			this.range.max = this.globalPosition + this.globalWidth

		}

		this.bounds.copy(this.range)

		let childStackOffset = 0

		for (let child of this.children) {

			child.resolvePosition(childStackOffset)

			if (child.positionMode.is.STACK)
				childStackOffset += child.globalWidth

			this.bounds.union(child.bounds)

		}

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

		return `Space#${this.uid} {${this.positionMode} d:${this.depth}, p:${this.position.toString()}, w:${this.width.toString()} r:${this.range.toString(1)}, b:${this.bounds.toString(1)}}`

	}

}
