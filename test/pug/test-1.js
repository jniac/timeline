import { Timeline } from '../../../src/timeline.js'
export { Timeline }
import { query, copy } from '../../../src/query.js'
export { query, copy } 
import { UIEventHandler } from '../../../src/UIEventHandler.js'

import { TimelineCanvas } from '../../../src/timeline.canvas.js'

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

		.on(/init|inside|exit/, event => {

			let x = 1 - event.values.relativeClamp
			event.target.props.section.style.transform = `translateX(${x * 100}%)`

		})

}

timeline.rootSection.space.resolveR()
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


