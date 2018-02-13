import { Timeline } from '../../../src/timeline.js'
export { Timeline }
import { query, copy } from '../../../src/query.js'
export { query, copy } 

export let timeline 

timeline = new Timeline(800)

// timeline.section({ width: '100%' })
// 	.on(/enter/, event => {
// 		document.querySelector('')
// 	})

// timeline.section({ width: '100%' })
// timeline.section({ width: '100%', name: 'foo' })

for (let section of document.querySelectorAll('.wrapper section')) {

	timeline.section({ width: '100%', section })

		.on(/init|inside|exit/, event => {

			let x = 1 - event.values.relativeClamp
			event.target.props.section.style.transform = `translateX(${x * 100}%)`

		})

}

timeline.rootSection.space.resolveR()
timeline.head.value = 0

console.log(timeline.rootSection)
console.log(timeline.currentSection)
console.log(timeline.head)

