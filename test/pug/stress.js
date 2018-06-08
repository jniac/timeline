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

for (let index of Mth.range(5000))
	timeline.division({ index, color: index % 10 === 0 ? 'red' : 'black' })

timeline.head.mobile.friction = 1
timeline.head.mobile.velocity = 1000

timeline.on('update', event => console.line('timeline', 'update: ' + timeline.updateCost.average.toFixed(2) + 'ms'))
