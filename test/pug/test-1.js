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

export let timeline = new Timeline(800)

for (let section of document.querySelectorAll('.wrapper section')) {

	timeline.division({ width: '100%', section, page: true })

		.on(/init|progress/, event => {

			event.target.props.section.style.transform = `translateX(${(1 - event.progress) * 100}%)`

		})

}

timeline.division({ position: '50%', width: 0, align: 0, })
	.addTo('uid=3')
	.on(/pass/, event => {

		document.querySelector('section:nth-child(3)').style.color = event.direction === 1 ? 'white' : null

	})

timeline.division({ width: 200, positionMode: 'FREE', position:'0%', align: '-100%', order: -Infinity })
timeline.division({ width: 200, positionMode: 'FREE', position:'100%', align: '100%', order: Infinity })

timeline.division({ name: 'exp', widthMode: 'ELASTIC' })
timeline.division({ parent: 'first:name=exp' })
// timeline.division({ parent: 'first:name=exp', name:'foo', width: '200%' })

// timeline.division({ parent: 'first:name=foo', name:'foo', align: '0%', width: '100' })


timeline.rootDivision.space.resolveSpace()
timeline.head.value = 0

export let handler = new UIEventHandler(document.body)

// handler.on(/^((?!-x).)*$/, event => console.log(event.type))
// handler.on(/swipe/, event => console.log(event.type))

handler.on('wheel', event => {

	// console.log(event.type, event.dx)
	timeline.head.value += event.dx

	timelineCanvas.draw()

})






export let timelineCanvas = new TimelineCanvas(timeline)
timelineCanvas.draw()

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)

timeline.update()

console.log('test-1 ::: init')


