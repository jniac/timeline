import * as eventjs from './event.js'
import query, { copy } from './query.js'
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

		Object.assign(this, {

			enabled: true,
			updateDuration: 2000,

		})

		this.newHead('main')

		timelines.push(this)

	}

	destroy() {

		if (this.shouldNotChange) {

			onNextUpdate.add(this.destroy, { thisArg: this })

			return this

		}

		this.rootDivision.destroy({ recursive: true })
		this.enabled = false
		this.destroyed = true

		let index = timelines.indexOf(this)
		timelines.splice(index, 1)

		this.dispatchEvent('destroy')

		return this

	}

	newHead(name = null) {

		this.heads.push(new Head(this, { name }))

	}

	get head() { return this.heads[0] }

	update(force = false) {

		let t = now()

		this.shouldNotChange = true

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

		this.shouldNotChange = false

	}

	dispatchHeadEvent({ extraEvent = null, forcedEvent = null } = {}) {

		this.rootDivision.walk(division => {

			for (let head of this.heads)
				division.updateHead(head, extraEvent, forcedEvent)

		})

		return this

	}

	createDivision(parent = this.rootDivision, spaceProps, props = null) {

		let division = new Division(this, parent, spaceProps, props)

		// this.lastDivision = division

		return division

	}

	// shorthands

	get rootWidth() { return this.rootDivision.space.width.absolute }
	set rootWidth(value) {

		if (this.rootDivision.space.width.absolute !== value)
			this.rootDivision.space.setDirty().width.absolute = value

	}

	query(selector) { return this.rootDivision.query(selector) }

	nearest({ position, selector = '*', distanceMax = Infinity } = {}) {

		if (position === undefined)
			position = this.head.position

		return this.rootDivision.nearest({ position, selector, distanceMax })

	}

	division({ parent = null, position = 0, width = '100%', align = '100%', order = 0, widthMode, positionMode }) {

		if (typeof arguments[0] === 'string') // it's a query!
			return this.query(arguments[0])

		if (Array.isArray(arguments[0])) // it's multiple
			return [...arguments[0]].map(props => this.division(props))

		let props = copy(arguments[0], { recursive: false, exclude: 'parent, position, width, align, order, positionMode, widthMode' })

		if (typeof parent === 'string')
			parent = this.query(parent)

		if (Array.isArray(parent))
			parent = parent[0]

		// if (!parent)
		// 	parent = this.currentDivision

		if (!parent)
			parent = this.rootDivision

		return this.createDivision(parent, { position, width, align, order, positionMode, widthMode }, props)

		return null

	}

	add(params = {}) {

		params.parent = this.rootDivision

		this.division(params)

		return this

	}

}

class Stack {

	constructor() {

		this.array = []
		this.next = []

	}

	add(callback, { thisArg = null, args = null  } = {}) {

		this.next.push({ callback, thisArg, args })

	}

	execute() {

		let { array, next } = this

		array.push(...next)
		next.length = 0

		for (let i = 0, n = array.length; i < n; i++) {

			let { callback, thisArg, args } = array[i]

			if (callback.apply(thisArg, args) === false) {

				array.splice(i, 1)
				i--
				n--

			}

		}

	}

	dump() {

		let { array, next } = this

		array.push(...next)
		next.length = 0

		for (let { callback, thisArg, args } of array)
			callback.apply(thisArg, args)

		array.length = 0

	}

}

export let onUpdate = new Stack()
export let onNextUpdate = new Stack()

function update() {

	if (typeof requestAnimationFrame === 'undefined')
		throw 'requestAnimationFrame is not available, cannot run'

	requestAnimationFrame(update)

	onUpdate.execute()
	onNextUpdate.dump()

	for (let timeline of timelines)
		if (timeline.enabled)
			timeline.update()

}

update()
