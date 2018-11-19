
// const percentFunction = str => new Function('x', `return ${str.replace(/(\d+)%/g, (m,n) => `x * ${n} / 100`)}`)
const percentFunction = str => eval(`x => ${str.replace(/(\d+)%/g, (m,n) => `x * ${n} / 100`)}`)
const autoFunction = str => eval(`x => ${str.replace(/auto/g, 'x')}`)

class LayoutProperty {

    constructor() {

        this.reset()

    }

    reset() {

        this.value = null

        this.basis = 0
        this.relative = 0
        // this.weight = 0

        this.relativeCallback = null
        this.computeCallback = null

    }

    valueOf() {

        return this.value

    }

    parse(value) {

        this.reset()

        this.value = value

        if (typeof value === 'number' || /^-?\.?\d+[\.\d]*$/.test(value)) {

            this.basis = Number(value)

        } else if (/^-?\.?\d+[\.\d]*%$/.test(value)) {

            this.relative = Number(value.slice(0, -1)) / 100

        } else if (/%/.test(value)) {

            this.relativeCallback = percentFunction(value)

        }

    }

    compute(referenceWidth, division) {

        if (this.computeCallback) {

            return this.computeCallback(referenceWidth, division)

        } else if (this.relativeCallback) {

            return this.relativeCallback(referenceWidth)

        } else {

            return referenceWidth * this.relative + this.basis

        }

    }

}

class WidthProperty extends LayoutProperty {

    reset() {

        super.reset()

        this.auto = false

    }

    parse(value) {

        super.parse(value)

        if (/\bauto\b/.test(value)) {

            this.auto = true

            if (value === 'auto') {

                this.relative = 1

            } else {

                this.computeCallback = autoFunction(value)

            }

        }

    }

}

export {

    LayoutProperty,
    WidthProperty,

}
