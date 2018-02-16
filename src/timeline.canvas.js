
let ctx, timeline

function lineH(thickness, x, y, width, off = 0) {

	ctx.lineWidth = thickness
	ctx.moveTo(x - width * off, y)
	ctx.lineTo(x + width * (1 - off), y)
	ctx.stroke()
	ctx.beginPath()

}

function lineV(thickness, x, y, height, off = .5) {

	ctx.lineWidth = thickness
	ctx.moveTo(x, y - height * off)
	ctx.lineTo(x, y + height * (1 - off))
	ctx.stroke()
	ctx.beginPath()

}

function drawSpace(space, dx, dy, scale,) {

	let x, w

	let color = space.color || 'black'

	ctx.strokeStyle = color

	x = dx + scale * space.range.min
	w = scale * space.range.width
	lineH(3, x, dy, w)
	lineV(1, x, dy, 10)
	lineV(1, x + w, dy, 10)

	ctx.lineWidth = 1
	ctx.moveTo(dx + scale * space.bounds.min, dy)
	ctx.lineTo(dx + scale * space.bounds.max, dy)
	ctx.stroke()
	ctx.beginPath()

	ctx.fillStyle = color
	ctx.arc(dx + scale * space.globalPosition, dy + 9, 2, 0, 2 * Math.PI)
	ctx.fill()
	ctx.beginPath()

}

function drawBounds() {

}

export class TimelineCanvas {

	constructor(timeline, { canvas = null, ratio = 2 } = {}) {

		if (!canvas) {

			let w = 800, h = 200

			canvas = document.createElement('canvas')
			canvas.width = w * ratio
			canvas.height = h * ratio
			canvas.style.width = w + 'px'
			canvas.style.height = h + 'px'

		}

		Object.assign(this, {

			timeline, 
			ratio,
			canvas,
			ctx: canvas.getContext('2d')

		})

		timeline.on('update', event => this.draw())

	}

	draw() {

		({ ctx, timeline } = this)

		let { ratio, canvas, canvas: { width, height } } = this

		ctx.setTransform(1, 0, 0, 1, 0, 0)
		ctx.clearRect(0, 0, width, height)

		// ctx.fillStyle = 'red'
		// ctx.fillRect(0, 0, width, height)

		// hdpi
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

		let margin = 10
		let space = timeline.rootDivision.space
		let scale = (width / ratio - 2 * margin) / space.bounds.width
		let x = margin + -space.bounds.min * scale

		timeline.rootDivision.walk(division => {

			let space = division.space
			let y = 20 + 20 * space.depth
			drawSpace(space, x, y, scale)

			for (let head of division.heads)
				lineV(1, x + head.global * scale, y, 10)

		})

	}

}
