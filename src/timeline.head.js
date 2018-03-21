import { Space } from './timeline.space.js'
import { Mobile } from './timeline.mobile.js'







const round = (x, precision) => Math.round(x / precision) * precision

/**
 * Extends Mobile to add Timeline integration.
 */

let HeadUID = 0

export class Head {

	constructor(timeline) {

		// super()

		Object.assign(this, {

			uid: HeadUID++,
			name: `head-${HeadUID}`,
			color: 'red',
			timeline,
			position: 0,
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

	// value interface for easier handling
	get value() { return this.mobile.position }
	set value(value) {

		// this.forcedPosition = value
		this.mobile.forcedPosition = value
		// this.forceUpdate = true
		// this.setPosition(value)

	}

	update(force = false) {

		// super.update()
		this.mobile.update()

		this.hasBeenUpdated = false

		let newRoundPosition = round(this.mobile.position, this.positionRounding)
		let roundPositionHasChanged = this.roundPosition !== newRoundPosition
		this.roundPosition = newRoundPosition

		if (force || roundPositionHasChanged /*|| this.forceUpdate*/) {

			// this.forceUpdate = false

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

	velocityCorrectionForNearest(selector) {

		let mobileVelocityBefore = this.mobile.velocity

		let destination = this.mobile.getDestination({ velocity: this.mobile.velocityVar.average })

		let nearest = this.timeline.nearest(destination, selector)

		if (nearest)
			this.mobile.shoot(nearest.space.globalPosition)

		this.velocityCorrection = this.mobile.velocity / mobileVelocityBefore

		console.log('velocity shift:', (100 * this.velocityCorrection).toFixed(1) + '%')

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}
