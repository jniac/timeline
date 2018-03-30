import { Timeline } from '../../src/timeline.js'
export { Timeline }
import { query, copy } from '../../src/query.js'
export { query, copy }
import { UIEventHandler } from '../../src/UIEventHandler.js'

import { TimelineCanvas } from '../../src/timeline.canvas.js'
import { bench } from '../../src/bench.js'
export { bench }

import { Mth } from '../../src/Mth.js'
export { Mth }

let width = 800

export let timeline = new Timeline(width)

let images = [...'abc']


// timeline = new Timeline(width)

timeline.division({ positionMode: 'FREE', width: width * images.length, color: 'red' })
	.on(/overlap|refresh/, event => {

		// this.refs.DotMenu.index = images.length * event.values.relative

	})

for (let [index, name] of images.entries()) {

	timeline

		.division({ name, page: true, index })
		.on(/overlap/, event => {

			// let { name } = event.target.props
			// let { [name]:scrollImage } = this.refs
			// let { sprite, blackSprite } = scrollImage.refs
			//
			// let { relative:x } = event.values
			// let { contentWidth } = this
			//
			// if (x > 0)
			// 	x = Mth.limit(x, .75)
			//
			// sprite.transformation.x = contentWidth * -x
			//
			// let { relativeClamp:opacity } = event.values
			// opacity = Mth.mix(0, .75, opacity)
			// blackSprite.transformation.set({ opacity })

		})

		.division({ name:'debug', width: '20%', color: 'blue', align: 0, positionMode: 'FREE' })
		.on(/enter/, event => {

			console.log('hey!!', timeline.updateCount, event.type, event.target.uid, event.target.space.range)

		})

}


// NOTE: setTimeout because of a
timeline.dispatchHeadEvent({ forcedEvent: 'overlap' })
// setTimeout(() => timeline.dispatchHeadEvent({ forcedEvent: 'overlap' }), 0)














export let timelineCanvas = new TimelineCanvas(timeline)

// // this line is important !
// timeline.rootDivision.space.width.computeDelegate = (space, width) => width - space.width.absolute
//
// timeline.division({ bound:true, name:'min', width: 300, positionMode: 'FREE', position:'0%', align: '-100%', order: -Infinity, color:'#FC4193' })
// timeline.division({ bound:true, name:'max', width: 300, positionMode: 'FREE', position:'100%', align: '100%', order: Infinity, color:'#FC4193' })
//
// for (let section of document.querySelectorAll('section')) {
//
// 	timeline.division({ section })
// 		.on(/overlap|init/, event => {
//
// 			let x = Mth.clamp(event.values.relative, -1, 1)
//
// 			event.target.props.section.style.transform = `translateX(${(- x * 100).toFixed(1)}%)`
//
// 		})
// }

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)



export let handler = new UIEventHandler(document.querySelector('.wrapper'))









// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                             //
//                            BOUNDS - BEGIN                                   //
//                                                                             //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //

timeline.head.friction = .2

let headPosition, headIsDragged = false, headLimit = 300

timeline.rootDivision.on('pass-main', event => {

	 timeline.head.clampVelocity(timeline.rootDivision, headLimit)

})

handler.on('drag-start', event => {

	headPosition = timeline.head.position
	headIsDragged = true
	// console.log('drag-start', headPosition)

})

handler.on('drag-end', event => {

	headIsDragged = false
	// console.log('drag-end', headPosition)

})

handler.on('drag', event => {

	headPosition += -event.dx

	timeline.head.forcedPosition = timeline.rootDivision.getLimitedValue(headPosition, headLimit)
	// console.log('drag', headPosition)

})

timeline.on('update', event => {

	if (!headIsDragged)
		timeline.rootDivision.bringBackHeadInside({ head: timeline.head })

	timeline.head.position = timeline.rootDivision.space.range.clamp(timeline.head.position, headLimit)

	console.line('position', timeline.head.mobile.position.toFixed(3))
	console.line('velocity', timeline.head.mobile.velocity.toFixed(3))

})

// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                             //
//                             BOUNDS - END                                    //
//                                                                             //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //












document.querySelector('input[type=range]').oninput = event => {

	headLimit = parseFloat(event.target.value)

	timeline.division('bound').forEach(division => division.width = headLimit)
	document.querySelector('input[type=range] + label').innerHTML = `overflow limit (${headLimit})`


}
