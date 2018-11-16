/** Class representing an interval [min, max] */

class Range {

	constructor(min = 0, max = 1) {

		this.set(min, max)

	}

	equals(other) {

		return this.min === other.min && this.max == other.max

	}

	set(min, max) {

		this.min = min
		this.max = max

		return this

	}

	secure() {

		if (this.min > this.max)
			this.min = this.max = (this.min + this.max) / 2

	}

	move(offset) {

		this.min += offset
		this.max += offset

	}

	expand(q) {

		this.min += -q
		this.max += q

		this.secure()

		return this

	}

	isVoid() {

		return isNaN(this.min) || isNaN(this.max)

	}

	setAsVoid() {

		this.min = NaN
		this.max = NaN

		return this

	}

	copy(other) {

		this.min = other.min
		this.max = other.max

		return this

	}

	clone() {

		return new Range(this.min, this.max)

	}

	intersects(other, epsilon = 0) {

		// return !(other.max < this.min || other.min > this.max)
		return other.max - this.min >= -epsilon && other.min - this.max <= epsilon

	}

	intersection(other, clone = false) {

		let target = clone ? this.clone() : this

		if (!target.intersects(other))
			return target.set(NaN, NaN)

		return target.set(Math.max(this.min, other.min), Math.min(this.max, other.max))

	}

	union(other, clone = false) {

		let target = clone ? this.clone() : this

		if (this.isVoid())
			return target.copy(other)

		return target.set(Math.min(this.min, other.min), Math.max(this.max, other.max))

	}

	contains(x) {

		return x >= this.min && x <= this.max

	}

	clamp(x, tolerance = 0) {

		return x < this.min - tolerance ? this.min - tolerance : x > this.max + tolerance ? this.max + tolerance : x

	}

	/**
	 * interpolate a value to local bound
	 * @param {number} x the ratio, if x = 0: interpolate(x) = min, if x = 1: interpolate(x) = max
	 * @param {boolean} clamp should the result be clamp to [min, max]?
	 */
	interpolate(x, clamp = false) {

		if (clamp)
			x = x < 0 ? 0 : x > 1 ? 1 : x

		return this.min + (this.max - this.min) * x

	}

	/**
	 * return the ratio of x inside the range
	 * @param {number} x the value, if x = min: interpolate(x) = 0, if x = max: interpolate(x) = 1
	 * @param {boolean} clamp should the result be clamp to [0, 1]?
	 */
	ratio(x, clamp = false) {

		if (clamp) {

			if (x < this.min)
				return 0

			if (x > this.max)
				return 1

		}

		return (x - this.min) / (this.max - this.min)

	}

	get position() { return this.min }
	set position(value) { this.move(value - this.min) }

	get width() { return this.max - this.min }
	set width(value) { this.max = this.min + value }

	toString(type = null) {

		if (type === 1)
			return this.min.toFixed(0) + '~' + this.max.toFixed(0)

		return '[' + this.min.toFixed(1) + ', ' + this.max.toFixed(1) + ']'

	}

}

export default Range
