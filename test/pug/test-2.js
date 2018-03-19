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

timeline.division({ width: '50%' })
timeline.division({ width: '50%', position: 20, name: 'pink', widthMode: 'CONTENT' }).space.color = '#FEB0B4'
// timeline.division({ width: '50%' })

	timeline.division({ parent: 'name=pink', width: '50%' })
	timeline.division({ parent: 'name=pink', width: '50%' })
	// timeline.division({ parent: 'name=pink', positionMode: 'FREE', width: '100%' }).space.color = '#7365FF'
	timeline.division({ parent: 'name=pink', positionMode: 'FREE', width: '100', align: '-100%', name: 'hihi' }).space.color = '#93EBFF'
	TweenMax.fromTo(timeline.query('f:name=hihi').space.align, .25, { relative: -1 }, { relative: 1, yoyo: true, repeat: -1 })

timeline.division({ widthMode: 'CONTENT', name: 'foo' })

	timeline.division({ width: '100', parent: 'name=foo',  })
	timeline.division({ width: '50%', parent: 'name=foo',  })
	timeline.division({ widthMode: 'CONTENT', name:'bar', parent: 'name=foo',  })

		timeline.division({ width: '25', parent: 'name=bar',  })
		timeline.division({ width: '25', parent: 'name=bar',  })
		timeline.division({ width: '25', parent: 'name=bar',  })
		timeline.division({ width: '25%', parent: 'name=bar',  })

	timeline.division({
		width: '0%',
		name: 'tiny',
		parent: 'name=foo',
		position: '50%',
		positionMode: 'FREE',
		align: '0 0',
	}).space.color = '#93C2FF'

	timeline.division({ width: '240', name: 'yoyo', parent: 'name=foo', position: '50%', positionMode: 'FREE', align: '0 0' }).space.color = '#E57FFF'
	TweenMax.fromTo(timeline.query('f:name=yoyo').space.position, 1, { relative: 0 }, { relative: 1, yoyo: true, repeat: -1 })

timeline.division({ positionMode: 'FREE', width: '50%', align:'-75%', parent: 'f:root > *', name:'zorro' })
timeline.division({ positionMode: 'FREE', position: '50%', width: '50', align:'-0%', parent: 'name=zorro' })

	TweenMax.fromTo(timeline.query('f:isRoot > *').space.width, 1, { relative: .5 }, { relative: 1.5, yoyo: true, repeat: -1 })

timeline.on('update', event => timeline.rootDivision.space.setDirty())

export let timelineCanvas = new TimelineCanvas(timeline)

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)
