import * as eventjs from './event.js'
import { Variable } from './variable.js'

const wheelDiscreteInterval = 120

function onWheel(handler, event) {

	event.preventDefault()

	let wheelX = handler.vars.wheelX
	let wheelY = handler.vars.wheelY
	let swipeX = handler.vars.swipeX
	let swipeY = handler.vars.swipeY
	let wheelSpeedX = handler.vars.wheelSpeedX
	let wheelSpeedY = handler.vars.wheelSpeedY
	let wheelSpeedSmoothX = handler.vars.wheelSpeedSmoothX
	let wheelSpeedSmoothY = handler.vars.wheelSpeedSmoothY

	// https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
	let unit = event.deltaMode === 0x00 ? 1 : 16
	let dx = event.deltaX * unit
	let dy = event.deltaY * unit

	if (!handler.wheelID) {

		wheelX.reset(dx)
		wheelY.reset(dy)

		wheelSpeedX.reset(dx)
		wheelSpeedY.reset(dy)

		wheelSpeedSmoothX.reset(0)
		wheelSpeedSmoothY.reset(0)

		handler.dispatchEvent('wheel-start')

		swipeX.reset(0)
		swipeY.reset(0)

		handler.wheelID = setTimeout(() => wheelStop(handler), wheelDiscreteInterval)
		handler.wheeling = true

	} else {

		wheelX.newValueIncrement(dx)
		wheelY.newValueIncrement(dy)

		wheelSpeedX.newValue(dx)
		wheelSpeedY.newValue(dy)

		wheelSpeedSmoothX.newValue(wheelSpeedX.average.value)
		wheelSpeedSmoothY.newValue(wheelSpeedY.average.value)

		if (wheelSpeedSmoothX.growth.value > 1) {

			swipeX.newValueIncrement(dx)

			if (swipeX.through(-handler.options.swipeThreshold))
				handler.dispatchEvent('swipe-left')

			if (swipeX.through(handler.options.swipeThreshold))
				handler.dispatchEvent('swipe-right')

			handler.dispatchEvent('wheel-increase-speed-x')

		} else {
			
			swipeX.reset(0)

		}

		if (wheelSpeedSmoothY.growth.value > 1) {

			swipeY.newValueIncrement(dy)
			
			if (swipeY.through(-handler.options.swipeThreshold))
				handler.dispatchEvent('swipe-up')

			if (swipeY.through(handler.options.swipeThreshold))
				handler.dispatchEvent('swipe-down')

			handler.dispatchEvent('wheel-increase-speed-y', { speed: wheelSpeedSmoothY.value })

		} else {

			swipeY.reset(0)

		}

		let through

		if (through = wheelSpeedSmoothX.growth.through(1))
			handler.dispatchEvent(through === -1 ? 'wheel-max-speed-x' : 'wheel-min-speed-x')

		if (through = wheelSpeedSmoothY.growth.through(1))
			handler.dispatchEvent(through === -1 ? 'wheel-max-speed-y' : 'wheel-min-speed-y')

		clearTimeout(handler.wheelID)
		handler.wheelID = setTimeout(() => wheelStop(handler), wheelDiscreteInterval)

	}

}

function wheelStop(handler) {

	handler.wheelID = null
	handler.wheeling = false
	handler.dispatchEvent('wheel-stop')

}

function mouseMove(handler, event) {

}

function mouseDown(handler, event) {



}

export class EventHandler extends eventjs.EventDispatcher {

	constructor(element, options) {

		super()

		if (typeof element === 'string')
			element = document.querySelector(element)

		this.vars = {

			wheelX: new Variable(0, 0, 10),
			wheelY: new Variable(0, 0, 10),

			swipeX: new Variable(0, 0, 1),
			swipeY: new Variable(0, 0, 1),

			wheelSpeedX: new Variable(0, 0, 10),
			wheelSpeedY: new Variable(0, 0, 10),

			wheelSpeedSmoothX: new Variable(0, 2, 10),
			wheelSpeedSmoothY: new Variable(0, 2, 10),

		}

		this.options = Object.assign({

			swipeThreshold: 100, //px

		}, options)



		element.addEventListener('wheel', event => onWheel(this, event))
		element.addEventListener('mousemove', event => mouseMove(this, event))

	}

}

