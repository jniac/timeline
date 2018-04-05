import { Space } from './timeline.space.js'
import { Mobile } from './timeline.mobile.js'







const round = (x, precision) => Math.round(x / precision) * precision
const clamp = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x

let HeadUID = 0

export class Head {

	constructor(timeline, { name = null } = {}) {

		Object.assign(this, {

			uid: HeadUID++,
			name: name || `head-${HeadUID}`,
			color: 'red',
			timeline,
			roundPosition: 0,
			positionRounding: 1 / 4,
			mobile: new Mobile(),

		})

		this.space = new Space({ positionMode: 'FREE', width: '100%' })
		this.space.updateApart = true // important! head move should not trigger division update cycle
		this.timeline.rootDivision.space.addChild(this.space)

	}

	getIndex() {

		return this.timeline
			? this.timeline.heads.indexOf(this)
			: -1

	}

	get index() { return this.getIndex() }

	get position() { return this.mobile.position }
	set position(value) { this.mobile.position = value }

	get destination() { return this.mobile.destination }
	set destination(value) { this.mobile.destination = value }

	get forcedPosition() { return this.mobile.position }
	set forcedPosition(value) { this.mobile.forcedPosition = value }

	update(force = false) {

		// super.update()
		this.mobile.update()

		this.hasBeenUpdated = false

		let newRoundPosition = round(this.mobile.position, this.positionRounding)
		let roundPositionHasChanged = this.roundPosition !== newRoundPosition
		this.roundPosition = newRoundPosition

		if (force || roundPositionHasChanged) {

			this.hasBeenUpdated = true

			this.spaceBoundsOld = this.space.bounds.clone()
			this.space.position.set(this.roundPosition, 0)
			this.space.rootUpdate()

		}

	}

	updateDivision(force = false) {

		if (force || this.hasBeenUpdated) {

			this.timeline.rootDivision.walk(division => {

				// NOTE optimization (done): only division whose bounds contain head position are updated
				if (force || division.space.bounds.intersects(this.space.bounds) || division.space.bounds.intersects(this.spaceBoundsOld))
					division.updateHead(this)

			})

		}

	}

	getDestinationApproximation(velocityBoostRatio = 1) {

		return this.mobile.getDestination({ velocity: this.mobile.velocityVar.average * velocityBoostRatio })

	}

	velocityCorrectionForNearest(selector = '*') {

		let mobileVelocityBefore = this.mobile.velocity

		let position = this.getDestinationApproximation()

		let nearest = this.timeline.nearest({ position, selector })

		if (nearest)
			this.mobile.shoot(nearest.space.globalPosition, { log: false })

		this.velocityCorrection = this.mobile.velocity / mobileVelocityBefore

	}

	clampVelocity(division, maxOverflow) {

		let min = division.space.range.min - maxOverflow
		let max = division.space.range.max + maxOverflow

		this.mobile.position = clamp(this.mobile.position, min, max)

		let destination = this.getDestinationApproximation()

		if (destination < min)
			this.mobile.shoot(min, { log: true })

		if (destination > max)
			this.mobile.shoot(max, { log: true })

	}

	reset(position = 0) {

		this.mobile.position = position
		this.mobile.velocity = 0

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}
