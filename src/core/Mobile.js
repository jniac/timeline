
class Mobile {

    constructor() {

        this.position = 0
        this.velocity = 0
        this.friction = .99

        this.min = -Infinity
        this.max = Infinity
        this.outOfRangeFriction = .9999

    }

    update(dt = 1/60) {

        let { position, velocity, friction, min, max, outOfRangeFriction } = this

        // bounds
        if (position < min) {

            position += (min - position) / 2
            friction = outOfRangeFriction

        } else if (position > max) {

            position += (max - position) / 2
            friction = outOfRangeFriction

        }

        let f = 1 - friction

        position += velocity * (f === 1 ? dt : (f ** dt - 1) / Math.log(f))
        velocity *= f ** dt

        Object.assign(this, {

            position,
            velocity,

        })

    }

}

export default Mobile
