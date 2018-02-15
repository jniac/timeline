export class Head {

	constructor(timeline) {

		this.color = 'red'
		this.timeline = timeline
		this._value = NaN
		this._valueOld = NaN

	}

	getIndex() {

		return this.timeline
			? this.timeline.heads.indexOf(this)
			: -1

	}

	get index() { return this.getIndex() }
	get value() { return this._value }
	set value(value) { this.setValue(value) }

	setValue(value) {

		if (this._value === value)
			return this

		this._value = value

	}

	check(force = false) {

		if (force || this._valueOld !== this._value) {

			let index = this.getIndex()
			let value = this._value
			
			this.timeline.rootSection.walk(section => {

				// let relative = section.space.getRelative(value)
				// let values = { index, global: value, absolute: value - section.space.range.min, relative, relativeClamp: clamp(relative) }
				// section.updateHead(index, values)
				section.updateHead(index, value)

			})

		}

	}

	update() {

		this.check()

		this._valueOld = this._value

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}
