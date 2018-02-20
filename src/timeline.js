import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'
import { Double, Range } from './primitives.js'

import { Head } from './timeline.head.js'
import { Division } from './timeline.division.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'




let timelines = []
let timelineUID = 0

export class Timeline extends eventjs.EventDispatcher {

	constructor(rootWidth = 1) {

		super()

		readonlyProperties(this, {

			uid: timelineUID++,
			rootDivision: this.createDivision(null, { width: rootWidth, 
				widthMode: 'CONTENT',
			}),
			heads: [],

		})

		this.currentDivision = this.rootDivision

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

		this.rootDivision.space.resolveSpace()

		for (let head of this.heads)
			head.update()

		let dt = now() - t

		this.updateCost = dt

		this.dispatchEvent('update')

	}

	createDivision(parent = this.rootDivision, spaceProps, props = null) {

		let division = new Division(this, parent, spaceProps, props)

		this.lastDivision = division

		return division

	}

	// shorthands

	query(selector) { return this.rootDivision.query(selector) }

	nearest(...args) { return this.rootDivision.nearest(...args)}

	division({ parent = null, position = 0, width = '100%', align = '100%', order = 0, widthMode, positionMode }) {

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



