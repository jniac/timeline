import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'
import { Range } from './primitives.js'

import { Head } from './timeline.head.js'
import { Division } from './timeline.division.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'




let timelines = []
let timelineUID = 0

class Variable {

	constructor(length = 30) {

		let array = []

		for (let i = 0; i < length; i++)
			array[i] = 0

		Object.assign(this, {
			array,
			length,
			sum: 0,
		})

		Object.defineProperties(this, {
			average: {
				enumerable: true,
				get: () => this.sum / this.length
			}
		})

	}

	add(value) {

		this.array.push(value)
		this.sum += -this.array.shift() + value

		return this

	}

}

export class Timeline extends eventjs.EventDispatcher {

	constructor(rootWidth = 1) {

		super()

		readonlyProperties(this, {

			uid: timelineUID++,
			rootDivision: this.createDivision(null, { width: rootWidth,
				widthMode: 'CONTENT',
			}),
			heads: [],
			updateCost: new Variable(30),

		})

		this.currentDivision = this.rootDivision

		Object.assign(this, {

			enabled: true,
			updateDuration: 2000,

		})

		this.newHead('main')

		timelines.push(this)

	}

	newHead(name = null) {

		this.heads.push(new Head(this, { name }))

	}

	get head() { return this.heads[0] }

	update(force = false) {

		let t = now()

		for (let head of this.heads)
			head.update()

		this.rootDivision.space.rootUpdate(force)

		for (let head of this.heads)
			head.updateDivision(force || this.rootDivision.space.hasBeenUpdated)

		let dt = now() - t

		this.updateCost.add(dt)

		let divisionsHaveBeenUpdated = this.rootDivision.children.some(division => division.space.hasBeenUpdated)
		let headsHaveBeenUpdated = this.heads.some(head => head.hasBeenUpdated)

		if (divisionsHaveBeenUpdated)
			this.dispatchEvent('division-update')

		if (headsHaveBeenUpdated)
			this.dispatchEvent('head-update')

		if (divisionsHaveBeenUpdated || headsHaveBeenUpdated)
			this.lastUpdateTime = t

		if (t - this.lastUpdateTime < this.updateDuration)
			this.dispatchEvent('update')

		this.dispatchEvent('frame')

	}

	createDivision(parent = this.rootDivision, spaceProps, props = null) {

		let division = new Division(this, parent, spaceProps, props)

		this.lastDivision = division

		return division

	}

	// shorthands

	get rootWidth() { return this.rootDivision.space.width.absolute }
	set rootWidth(value) {

		if (this.rootDivision.space.width.absolute !== value)
			this.rootDivision.space.setDirty().width.absolute = value

	}

	query(selector) { return this.rootDivision.query(selector) }

	nearest(...args) { return this.rootDivision.nearest(...args)}

	division({ parent = null, position = 0, width = '100%', align = '100%', order = 0, widthMode, positionMode }) {

		if (typeof arguments[0] === 'string') // it's a query!
			return this.query(arguments[0])

		let props = copy(arguments[0], { recursive: false, exclude: 'parent, position, width, align, order, positionMode, widthMode' })

		if (typeof parent === 'string')
			parent = this.query(parent)

		if (Array.isArray(parent))
			parent = parent[0]

		if (!parent)
			parent = this.currentDivision

		return this.createDivision(parent, { position, width, align, order, positionMode, widthMode }, props)

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
