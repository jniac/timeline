import * as eventjs from './event.js'
import query, { copy, propsToString } from './query.js'
import { Double, Range } from './primitives.js'

import { Head } from './timeline.head.js'
import { Section } from './timeline.section.js'

import { now, readonlyProperties, clamp } from './timeline.utils.js'




let timelines = []
let timelineUID = 0

export class Timeline {

	constructor(rootWidth = 1) {

		readonlyProperties(this, {

			uid: timelineUID++,
			rootSection: this.createSection(null, { width: rootWidth }),
			heads: [],

		})

		this.currentSection = this.rootSection

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

		this.updateCost = dt

		

	}

	createSection(parent = this.rootSection, spaceProps, props = null) {

		let section = new Section(this, parent, spaceProps, props)

		this.lastSection = section

		return section

	}

	// shorthands (returning previous methods result)

	query(selector) { return this.rootSection.query(selector) }

	section({ parent = null, position = 0, width = '100%', align = '100%', order = 0, expand }) {

		let props = copy(arguments[0], { recursive: false, exclude: 'parent, position, width, align, order, expand' })

		if (typeof parent === 'string')
			parent = this.query(parent)

		if (Array.isArray(parent))
			parent = parent[0]

		if (!parent)
			parent = this.currentSection

		return this.createSection(parent, { position, width, align, order, expand }, props)

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



