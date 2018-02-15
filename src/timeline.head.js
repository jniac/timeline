
class Mobile {

	constructor() {

		Object.assign(this, {

			// classic physic properties
			position: 0,
			velocity: 0,
			friction: .1, 	// WARN: inversed expression, friction represent the remaining part of velocity after 1 second

			hasMoved: false,
			positionOld: 0,
			velocityOld: 0,
			
			// target
			forcedPosition: NaN,
			target: NaN,
			computedFriction: .1,

		})

	}

	update(dt = 1 / 60) {

		let { position, position:positionOld, velocity, velocity:velocityOld, friction } = this

		velocity *= friction ** dt
		position += (velocity + velocityOld) / 2 * dt

		let hasMoved = position !== positionOld

		if (!isNaN(this.forcedPosition)) {

			position = this.forcedPosition
			this.forcedPosition = NaN

		}

		Object.assign(this, { position, positionOld, velocity, velocityOld, hasMoved })

	}

}

export class Head {

	constructor(timeline) {

		this.color = 'red'
		this.timeline = timeline

		this.mobile = new Mobile()

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

		this.mobile.forcedPosition = value
		this.forceUpdate = true

	}

	update(force = false) {

		this.mobile.update()

		if (force || this.forceUpdate || this.mobile.hasMoved) {

			this.forceUpdate = false

			let index = this.getIndex()
			
			this.timeline.rootSection.walk(section => section.updateHead(index, this.mobile.position))

		}

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}
