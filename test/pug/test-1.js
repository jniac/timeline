import { Timeline } from '../../../src/timeline.js'
export { Timeline }
import { query, copy } from '../../../src/query.js'
export { query, copy } 
import { UIEventHandler } from '../../../src/UIEventHandler.js'

import { TimelineCanvas } from '../../../src/timeline.canvas.js'
import { bench } from '../../../src/bench.js'
export { bench }

export let timeline = new Timeline(800)

/*

	timeline.section({ })

	create a div as a child of timeline.currentSection, 

	also,

	timeline.section({ })
	timeline.section({ })
	timeline.section({ })
	
	will create 3 nested sections

*/

for (let section of document.querySelectorAll('.wrapper section')) {

	timeline.section({ width: '100%', section })

		.on(/init|progress/, event => {

			event.target.props.section.style.transform = `translateX(${(1 - event.progress) * 100}%)`

		})

}

timeline.section({ position: '50%', width: 0, align: 0, })
	.addTo('uid=3')
	.on(/pass/, event => {

		document.querySelector('section:nth-child(3)').style.color = event.direction === 1 ? 'white' : null

	})

timeline.section({ width: 200, order: -Infinity })
timeline.section({ width: 200, order: Infinity })

timeline.section({ name: 'exp', expand: 'EXPAND' })
timeline.section({ parent: 'first:name=exp' })
timeline.section({ parent: 'first:name=exp', name:'foo', width: '200%' })

timeline.section({ parent: 'first:name=foo', name:'foo', align: '0%', width: '100' })


timeline.rootSection.space.resolveSpace()
timeline.head.value = 0

timeline.rootSection.walk(section => console.log(section.space + ''))
console.log(timeline.head)

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


