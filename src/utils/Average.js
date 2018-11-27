/*

    https://github.com/jniac/js-average

*/

export const through = (threshold, value, old) => old < threshold && value >= threshold ? 1 : old > threshold && value <= threshold ? -1 : 0

export default class Average {

	constructor({ value = 0, length = 10, nDerivative = 1 } = {}) {

        let valueOld = value
        let average = value
        let averageOld = value

        let delta = 0
        let sum = value * length

        let values = new Array(length).fill(value)

        let derivative = nDerivative > 0 ? new Average({ value: 0, length, nDerivative: nDerivative - 1 }) : null

        Object.assign(this, {

            length,

            value,
            valueOld,
            average,
            averageOld,

            delta,
            sum,

            values,

            nDerivative,
            derivative,

        })

	}

	setNewValue(value) {

        value = value || 0

        let { value:valueOld, average:averageOld, length, sum, values, derivative } = this

        let delta = value - valueOld

        sum += -values.shift() + value

        let average = sum / length

        values.push(value)

        if (derivative)
            derivative.setNewValue(delta)

        Object.assign(this, {

            value,
            valueOld,
            average,
            averageOld,

            sum,
            delta,

        })

		return this

	}

    get newValue() { return this.value }

    set newValue(value) { this.setNewValue(value) }

	reset(value = 0) {

		let { length, array } = this

		array.fill(value)

        Object.assign(this, {

            value,
            valueOld: value,
            average: value,
            averageOld: value,

            sum: value * length,
            delta: 0,

        })

	}

	through(threshold) {

        let { value, valueOld:old } = this

		return through(threshold, value, old)

	}

	throughAbs(threshold) {

        let { value, valueOld:old } = this

		return through(threshold, Math.abs(value), Math.abs(old))

	}

	averageThrough(threshold) {

        let { average:value, averageOld:old } = this

		return through(threshold, value, old)

	}

	averageThroughAbs(threshold) {

        let { average:value, averageOld:old } = this

        return through(threshold, Math.abs(value), Math.abs(old))

	}

}
