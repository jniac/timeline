
let ctx, timeline

function lineH(x, y, width, { color, off = 0, thickness = 1 } = {}) {

	if (color)
		ctx.strokeStyle = color

	ctx.moveTo(x - width * off, y)
	ctx.lineTo(x + width * (1 - off), y)
	ctx.lineWidth = thickness
	ctx.stroke()
	ctx.beginPath()

}

function lineV(x, y, height, { color, off = .5, thickness = 1 } = {}) {

	if (color)
		ctx.strokeStyle = color

	ctx.moveTo(x, y - height * off)
	ctx.lineTo(x, y + height * (1 - off))
	ctx.lineWidth = thickness
	ctx.stroke()
	ctx.beginPath()

}

function segment(x, y, length, thickness, { color, off = .5 } = {}) {

	if (color)
		ctx.fillStyle = color

	ctx.rect(x, y - thickness * off, length, thickness)
	ctx.fill()
	ctx.beginPath()

}

function arrowUp(x, y, { color, size = 10, thickness = 1 } = {}) {

	if (color)
		ctx.strokeStyle = color

	ctx.moveTo(x - size, y + size / 2)
	ctx.lineTo(x, y - size / 2)
	ctx.lineTo(x + size, y + size / 2)
	ctx.lineWidth = thickness
	ctx.stroke()
	ctx.beginPath()

}


function drawSpace(space, dx, dy, scale, color) {

	let x, w

	color = color || space.color || 'black'

	ctx.strokeStyle = color

	x = dx + scale * space.range.min
	w = scale * space.range.width
	lineH(x, dy, w, { thickness: 3, color })
	lineV(x, dy, 6)
	lineV(x + w, dy, 6)

	ctx.lineWidth = 1
	ctx.moveTo(dx + scale * space.bounds.min, dy)
	ctx.lineTo(dx + scale * space.bounds.max, dy)
	ctx.stroke()
	ctx.beginPath()

	ctx.fillStyle = color
	ctx.arc(dx + scale * space.globalPosition, dy + 5, 2, 0, 2 * Math.PI)
	ctx.fill()
	ctx.beginPath()

	if (space.widthMode.is.CONTENT) {
		arrowUp(dx + scale * space.range.interpolate(.5), dy + 17, { size: 5 })
		lineV(dx + scale * space.range.interpolate(.5), dy + 15, 26)
		// arrowUp(dx + scale * space.range.interpolate(.5) - 17, dy + 10, { size: 7 })
		// arrowUp(dx + scale * space.range.interpolate(.5) + 17, dy + 10, { size: 7 })
	}

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

	highlight(highlighted = null, { activeColor = 'red', greyedColor = '#ddd', branch = true } = {}) {

		if (typeof highlighted === 'string')
			highlighted = this.timeline.query(highlighted)

		Object.assign(this, {

			highlighted,
			activeColor,
			greyedColor,
			highlightBranch: branch,

		})

	}

	testHighlight(division, { highlighted } = this) {

		if (!highlighted)
			return false

		if (Array.isArray(highlighted))
			return highlighted.some(highlighted => this.testHighlight(division, { highlighted }))

		if (division === highlighted)
			return true

		return this.highlightBranch && (division.isParentOf(highlighted) || division.isChildOf(highlighted))

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

		// HEAD
		timeline.rootDivision.walk(division => {

			let y = 20 + 30 * division.space.depth + (division.space.positionMode.is.FREE ? 10 : 0)

			for (let localHead of division.localHeads) {

				if (localHead.overlap || division.isRoot) {

					ctx.globalCompositeOperation = 'destination-over'
					let range = localHead.head.space.range
					segment(x + range.min * scale, y, range.width * scale, 30, { color: '#D9CEEE' })

					ctx.globalCompositeOperation = 'source-over'
					lineV(x + localHead.global * scale, y, 30, { color: '#CAA5EE', thickness: 1 })

				}

			}

		})

		// DIVISION
		timeline.rootDivision.walk(division => {

			let y = 20 + 30 * division.space.depth + (division.space.positionMode.is.FREE ? 10 : 0)
			let color

			if (this.highlighted)
				color = this.testHighlight(division)
					? this.activeColor
					: this.greyedColor

			drawSpace(division.space, x, y, scale, color)

		})

	}

}
