
const percent = /%/
const spaces = /\s/

/**
 *
 * Double
 * 
 * Most of the lines are about parsing input values:
 * 
 * x 			> new Double(x, 1)
 * '100' 		> new Double(100, 0)
 * '100%' 		> new Double(0, 1)
 * '0 1' 		> new Double(0, 1)
 * '50 50%' 	> new Double(50, .5)
 * '50% 50%' 	> new Double(.5, .5)
 * [x, y] 		> new Double(x, y)
 * 
 */

export class Double {

	static isDouble(value) {

		return value.hasOwnProperty('absolute') && value.hasOwnProperty('relative')

	}

	static parsePercent(value) {

		return parseFloat(value) * (percent.test(value) ? .01 : 1)

	}

	static parse(value, relativeValue = null) {

		if (Double.isDouble(value))
			return value

		return new Double().parse(value, relativeValue)

	}

	constructor(absolute = 0, relative = 0) {

		this.absolute = absolute
		this.relative = relative

	}

	parse(value, relativeValue = null) {

		if (relativeValue)
			return this.set(Double.parsePercent(value), Double.parsePercent(relativeValue))

		if (value instanceof Array)
			return this.set(Double.parsePercent(value[0]), Double.parsePercent(value[1]))

		switch(typeof value) {

			case 'number':

				return this.set(value, 0)

			case 'string':
				
				if (spaces.test(value))
					return Double.parse(value.split(spaces))

				return percent.test(value)
					? this.set(0, parseFloat(value) / 100)
					: this.set(parseFloat(value), 0)

			default:

				return this.set(0, 0)

		}

	}

	set(absolute, relative) {

		if (typeof absolute === 'number' && typeof relative === 'number') {

			this.absolute = absolute
			this.relative = relative

			return this

		}

		return this.parse(absolute, relative)

	}

	solve(relativeReference) {

		return (relativeReference || 0) * this.relative + this.absolute

	}

	/**
	 * alignment is solved that way:
	 *
	 * relative === -1 		=> 		-relativeReference (+ absolute)
	 * relative === 0 		=> 		-relativeReference / 2 (+ absolute)
	 * relative === 1 		=> 		0 (+ absolute)
	 *
	 */
	solveAlign(relativeReference) {

		return (relativeReference || 0) * (this.relative - 1) / 2 + this.absolute 

	}

	toString() {

		return this.absolute === 0 && this.relative === 0
			? '0'
			: this.relative === 0
			? this.absolute.toFixed(1)
			: this.absolute === 0
			? (this.relative * 100).toFixed(1) + '%'
			: this.absolute.toFixed(1) + ' ' + (this.relative * 100).toFixed(1) + '%'

	}

}




/** Class representing an interval [min, max] */

export class Range {

	constructor(min = 0, max = 1) {

		this.set(min, max)

	}

	set(min, max) {

		this.min = min
		this.max = max

		return this

	}

	isVoid() {

		return isNaN(this.min) || isNaN(this.max)

	}

	copy(other) {

		this.min = other.min
		this.max = other.max

		return this

	}

	clone() {

		return new Range(this.min, this.max)

	}

	intersects(other) {

		return !(other.max < this.min || other.min > this.max)
		
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

	get width() { return this.max - this.min }
	set width(value) { this.max = this.min + value }

	toString(type = null) {

		if (type === 1)
			return this.min.toFixed(0) + '~' + this.max.toFixed(0)

		return '[' + this.min.toFixed(1) + ', ' + this.max.toFixed(1) + ']'

	}

}



