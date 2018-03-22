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
export class Mobile {

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
	set destination(value) { this.velocity = this.getVelocityForDestination(value) }

	shoot(destination, { friction = this.friction, log = false } = {}) {

		this.forcedPosition = NaN

		let velocityBefore = this.velocity

		this.friction = friction
		this.velocity = this.getVelocityForDestination(destination)

		if (log)
			console.log(`Mobile.shoot: destination: ${destination.toFixed(1)}, velocity shift: ${(100 * this.velocity / velocityBefore).toFixed(1)}%`)

		return this

	}

}
