import { Range } from './primitives.js'
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

	constructor({ position = 0, width = '100%', align = '100%', order = 0, positionMode, widthMode, color = null } = {}) {

		readonlyProperties(this, {

			uid: spaceUID++,

		})

		Object.assign(this, {

			// dirty pattern:

			isDirty: true,
			rootUpdateCount: 0,
			onUpdate: [],
			updateApart: false,

			// design:

			positionMode: PositionMode[positionMode] || PositionMode.STACK,
			position: new SpaceProperty(this).parse(position),
			globalPosition: NaN,

			widthMode: WidthMode[widthMode] || WidthMode.FIXED,
			width: new SpaceProperty(this).parse(width),
			globalWidth: 0,

			order,
			align: new SpaceProperty(this).parse(align), // 100% = align left, 0% = center, -100% = align right

			// maths:

			range: new Range(0, 1),
			bounds: new Range(0, 0),

			// hierarchy:

			root: this,
			parent: null,
			children: [],

			// TODO: remove this
			// sortedChildren: [],

			childrenUniqueIdentifierCount: 0,
			childUniqueIdentifier: -1,

			// debug:

			color,

		})

	}

		destroy({ recursive = false } = {}) {

			if (recursive)
				for (let child of this.children)
					child.destroy({ recursive })

			this.bounds.setAsVoid()
			this.range.setAsVoid()
			this.position.destroy()
			this.width.destroy()
			this.align.destroy()
			this.onUpdate.length = 0
			this.children.length = 0
			this.root = null
			this.parent = null

		}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (child.parent)
			child.parent.removeChild(child)

		child.root = this.root
		child.parent = this
		child.childUniqueIdentifier = this.childrenUniqueIdentifierCount++
		this.children.push(child)

		// NOTE should we avoid sorting? and prefer splice() to push() && sort()
		this.children.sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)

		this.setDirty()

		return this

	}

	removeChild(child) {

		if (child.parent !== this)
			throw 'child argument is not a child of this'

		child.root = child
		child.parent = null
		child.childUniqueIdentifier = -1
		this.children.splice(this.children.indexOf(child), 1)

		this.setDirty()

		return this

	}

	removeAll({ recursive = false } = {}) {

		for (let child of this.children) {

			if (recursive)
				child.removeAll({ recursive })

			child.root = child
			child.parent = null
			child.childUniqueIdentifier = -1

		}

		this.children.length = 0

		this.setDirty()

		return this

	}

	remove() {

		if (this.parent)
			this.parent.removeChild(this)

		return this

	}

	get isRoot() {

		return this.root === this

	}

	isParentOf(node) {

		while (node) {

			if (node.parent === this)
				return true

			node = node.parent

		}

		return false

	}

	isChildOf(node) {

		return node.isParentOf(this)

	}





	// update:

	/**
	 * setDirty is lazy, parent recursive:
	 * parent recursive: when a space is set dirty, all his parent will become dirty too
	 * lazy: if the parent is already dirty, the parent recursive call is skipped
	 */
	setDirty() {

		this.isDirty = true

		if (!this.updateApart && this.parent && !this.parent.isDirty)
			this.parent.setDirty()

		return this

	}

	get hasBeenUpdated() {

		return this.updatedAt === this.root.rootUpdateCount

	}

	rootUpdate(force = false) {

		this.rootUpdateCount++

		if (force || this.isDirty) {

			// OPTIMIZE only dirty divisions should be updated
			this.updateWidth()
			this.updatePosition()

		}

	}

	getParentGlobalWidth() {

		let space = this.parent

		while(space && space.widthMode.is.CONTENT)
			space = space.parent

		// important if no fixed parent is found:
		// globalWidth is computed from root.width
		return space ? space.globalWidth : this.root.width.solve(0)

	}

	updateWidth() {

		// this.sortedChildren = this.children.concat().sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)

		if (this.widthMode.is.CONTENT) {

			// globalWidth is inherited from children (stacked ones only)
			this.globalWidth = 0

			for (let child of this.children) {

				child.updateWidth()

				if (child.positionMode.is.STACK)
					this.globalWidth += child.globalWidth

			}

			if (this.width.computeDelegate)
				this.globalWidth = this.width.computeDelegate(this, this.globalWidth)

		} else {

			// globalWidth is computed from parent
			this.globalWidth = this.width.solve(this.getParentGlobalWidth())

			if (this.width.computeDelegate)
				this.globalWidth = this.width.computeDelegate(this, this.globalWidth)

			for (let child of this.children)
				child.updateWidth()

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

	updatePosition(stackOffset = 0) {

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

			child.updatePosition(childStackOffset)

			if (child.positionMode.is.STACK)
				childStackOffset += child.globalWidth

			this.bounds.union(child.bounds)

		}

		this.isDirty = false
		this.updatedAt = this.root.rootUpdateCount

		for (let callback of this.onUpdate)
			callback()

	}

	walk(callback) {

		callback(this)

		for (let child of this.children)
			child.walk(callback)

		return this

	}

	contains(value) {

		return this.range.contains(value)

	}

	toString() {

		return `Space#${this.uid} {${this.positionMode} d:${this.depth}, p:${this.position.toString()}, w:${this.width.toString()} r:${this.range.toString(1)}, b:${this.bounds.toString(1)}}`

	}

}
