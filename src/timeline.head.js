
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

			hasMoved: false,
			positionOld: 0,
			velocityOld: 0,
			
			// target
			forcedPosition: NaN,
			// target: NaN,
			// computedFriction: .1,

		})

	}

	update(dt = 1 / 60) {

		let { position, position:positionOld, velocity, velocity:velocityOld, friction } = this

		// integral
		position += velocity * (friction ** dt - 1) / Math.log(friction)
		velocity *= friction ** dt

		let hasMoved = position !== positionOld

		if (!isNaN(this.forcedPosition)) {

			position = this.forcedPosition
			this.forcedPosition = NaN

		}

		Object.assign(this, { position, positionOld, velocity, velocityOld, hasMoved })

	}

	setFriction(value, dt = 1) {

		this.friction = value ** (1 / dt)

	}

	setPosition(value, { computeVelocity = true, dt = 1 / 60 } = {}) {

		let d = value - this.positionOld
		this.position = value
		this.velocity = d ** (1 / dt)

	}

	/**
	 * F*** powerful, i can't remind how it works, but it works!
	 */
	getDestination({ position, velocity, friction } = this) {

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










/**
 * Extends Mobile to add Timeline integration.
 */

export class Head extends Mobile {

	constructor(timeline) {

		super()

		this.color = 'red'
		this.timeline = timeline

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

	}

	update(force = false) {

		super.update()

		// if (force || this.forceUpdate || this.hasMoved) {

			this.forceUpdate = false

			let index = this.getIndex()
			
			this.timeline.rootDivision.walk(division => division.updateHead(index, this.position))

		// }

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}
