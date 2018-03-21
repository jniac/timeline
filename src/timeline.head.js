import { Space } from './timeline.space.js'

class Variable {

	constructor({ length, value = 0 }) {

		this.length = length
		this.sum = value * length

		this.array = []

		for (let i = 0; i < length; i++)
			this.array[i] = value

		this.value = value

	}

	setNewValue(value) {

		this.value = value

		this.sum += -this.array.shift() + value

		this.array.push(value)

	}

	get average() { return this.sum / this.length }

}

/**
 * Class to simulate the movement of a Mobile from 2 variables:
 * • velocity
 * • friction
 *
 * key function: destination = position - velocity / log(friction)
 */
class Mobile {

	constructor() {

		Object.assign(this, {

			// classic physic properties
			position: 0,
			velocity: 0,	// px / s
			friction: .01, 	// ratio / s^2 WARN: inversed expression, friction represent the remaining part of velocity after 1 second

			deltaPosition: 0,
			hasMoved: false,
			positionOld: 0,
			velocityOld: 0,

			// target
			forcedPosition: NaN,
			// target: NaN,
			// computedFriction: .1,

			velocityVar: new Variable({ length: 5 }),

		})

	}

	update(dt = 1 / 60) {

		let { position, position:positionOld, velocity, velocity:velocityOld, friction } = this

		if (!isNaN(this.forcedPosition)) {

			this.setPosition(this.forcedPosition)
			this.forcedPosition = NaN

			position = this.position
			velocity = this.velocity

		} else {

			// integral
			position += velocity * (friction ** dt - 1) / Math.log(friction)
			velocity *= friction ** dt

		}

		let deltaPosition = position - positionOld
		let hasMoved = deltaPosition !== 0

		Object.assign(this, { position, positionOld, velocity, velocityOld, deltaPosition, hasMoved })

		this.velocityVar.setNewValue(velocity)

	}

	setFriction(value, dt = 1) {

		this.friction = value ** (1 / dt)

	}

	setPosition(value, { computeVelocity = true, dt = 1 / 60 } = {}) {

		let d = value - this.positionOld
		this.position = value
		this.velocity = d / dt

	}

	/**
	 * F*** powerful, i can't remind how it works, but it works!
	 */
	getDestination({ position = this.position, velocity = this.velocity, friction = this.friction } = {}) {

		return position + -velocity / Math.log(friction)

	}

	getVelocityForDestination(destination, { position, friction } = this) {

		return (position - destination) * Math.log(friction)

	}

	getFrictionForDestination(destination, { position, velocity } = this) {

		return Math.exp(velocity / (position - destination))

	}

	get destination() { return this.getDestination() }

	shoot(destination) {

		this.velocity = this.getVelocityForDestination(destination)

		return this

	}

}








const round = (x, precision) => Math.round(x / precision) * precision

/**
 * Extends Mobile to add Timeline integration.
 */

let HeadUID = 0

export class Head extends Mobile {

	constructor(timeline) {

		super()

		Object.assign(this, {

			uid: HeadUID++,
			name: `head-${HeadUID}`,
			color: 'red',
			timeline,
			position: 0,
			roundPosition: 0,
			positionRounding: 1 / 4,

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
	get value() { return this.position }
	set value(value) {

		this.forcedPosition = value
		this.forceUpdate = true
		// this.setPosition(value)

	}

	update(force = false) {

		super.update()

		this.hasBeenUpdated = false

		let newRoundPosition = round(this.position, this.positionRounding)
		let roundPositionHasChanged = this.roundPosition !== newRoundPosition
		this.roundPosition = newRoundPosition

		if (roundPositionHasChanged || force || this.forceUpdate) {

			this.forceUpdate = false

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

		this.forcedPosition = NaN

		let velocityBefore = this.velocity

		let destination = this.getDestination({ velocity: this.velocityVar.average })

		let nearest = this.timeline.nearest(destination, selector)

		if (nearest)
			this.shoot(nearest.space.globalPosition)

		this.velocityCorrection = this.velocity / velocityBefore

		// console.log('velocity shift:', (100 * this.velocityCorrection).toFixed(1) + '%')

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}
