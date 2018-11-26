
// const percentFunction = str => new Function('x', `return ${str.replace(/(\d+)%/g, (m,n) => `x * ${n} / 100`)}`)
// const percentFunction = str => eval(`x => ${str.replace(/(\d+)%/g, (m,n) => `x * ${n} / 100`)}`)
// const autoFunction = str => eval(`x => ${str.replace(/auto/g, 'x')}`)
const percentFunction = str => new Function(`return x => ${str.replace(/(-?\.?\d+[\.\d]*)%/g, (m,n) => `x * ${n} / 100`)}`)()
const autoFunction = str => new Function(`return x => ${str.replace(/auto/g, 'x')}`)()



const re = {

    pureNumber:     /^-?\.?\d+[\.\d]*$/,
    purePercent:    /^-?\.?\d+[\.\d]*%$/,
    percent:        /%/,
    auto:           /\bauto\b/,

}

/**
 * auto-registration:
 * to avoid new computations for same properties (eg: '50% - 30'),
 * when the property is NOT a 'number' property, the property is kept in a map
 */

let map = new Map()

class LayoutProperty {

    static get(value) {

        return map.get(value) || new LayoutProperty(value)

    }

    constructor(value) {

        this.value = value

        // meta
        this.number = false
        this.function = false
        this.auto = false
        this.none = false

        this.basis = 0
        this.relative = 0
        // this.weight = 0 // todo ?

        this.relativeCallback = null
        this.computeCallback = null



        // computation

        if (value === 'none') {

            this.none = true

        } else if (typeof value === 'function') {

            this.function = true
            this.computeCallback = value

        } else if (typeof value === 'number' || re.pureNumber.test(value)) {

            this.number = true
            this.basis = Number(value)

        } else if (re.purePercent.test(value)) {

            this.relative = Number(value.slice(0, -1)) / 100

        } else if (re.percent.test(value)) {

            try {
                this.relativeCallback = percentFunction(value)

            } catch(e){
                console.log(value)
            }

        } else if (re.auto.test(value)) {

            this.auto = true

            if (value === 'auto') {

                this.relative = 1

            } else {

                this.computeCallback = autoFunction(value)

            }

        }

        // keep reference (computation savings) when property is NOT a number prop
        // NOTE: when property is NOT a function too?
        if (this.number === false) {

            map.set(value, this)

        }

    }

    compute(referenceDimension, division) {

        if (this.number) {

            return this.basis

        } else if (this.computeCallback) {

            return this.computeCallback(referenceDimension, division)

        } else if (this.relativeCallback) {

            return this.relativeCallback(referenceDimension)

        } else {

            return this.basis + referenceDimension * this.relative

        }

    }

}

export default LayoutProperty
