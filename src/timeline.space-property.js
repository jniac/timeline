const rePercent = /%/
const reSpaces = /\s/
const reMode = /^[^\d-]/

function parsePercent(value) {

	return parseFloat(value) * (rePercent.test(value) ? .01 : 1)

}

/**
 *
 * SpaceProperty
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
export class SpaceProperty {

	static ensure(value) {

		if (value instanceof SpaceProperty)
			return value

		return new SpaceProperty().parse(value)

	}

	constructor(space) {

		Object.assign(this, {

			space,
			absolute: 0,
			relative: 0,
			mode: null,
			
		})

	}

	set(absolute, relative = 0, mode = null) {

		if (this.space)
			this.space.setDirty()

		this.absolute = absolute
		this.relative = relative
		this.mode = mode

		return this

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

	parse(...args) {

		if (args.length === 0)
			return this.set(0, 1, null)

		if (args.length === 1 && typeof args[0] === 'function') {

			this.computeDelegate = args[0]
			return this

		}

		if (args.length === 2)
			return this.set(parsePercent(args[0]), parsePercent(args[1]))

		if (args.length === 3)
			return this.set(parsePercent(args[0]), parsePercent(args[1]), args[2])

		let [value] = args

		if (value instanceof Array)
			return this.set(parsePercent(value[0]), parsePercent(value[1]), value[2])

		switch(typeof value) {

			case 'number':

				return this.set(value, 0)

			case 'string':

				if (reMode.test(value))
					return this.set(0, 0, value)

				if (reSpaces.test(value))
					return this.set(...value.split(reSpaces).map(parsePercent))

				return rePercent.test(value)
					? this.set(0, parseFloat(value) / 100)
					: this.set(parseFloat(value), 0)

			default:

				return this.set(0, 0)

		}

	}

	toString() {

		return this.mode
			? this.mode
			: this.absolute === 0 && this.relative === 0 ? '0'
			: this.relative === 0 ? this.absolute.toFixed(1)
			: this.absolute === 0 ? (this.relative * 100).toFixed(1) + '%'
			: this.absolute.toFixed(1) + ' ' + (this.relative * 100).toFixed(1) + '%'

	}

}
