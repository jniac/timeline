
import { utils } from '../../src/Timeline.js'

const { makeSvg } = utils

const makeCircle = ({ parent, size = 100 }) => {

    let svg = makeSvg('svg', { parent, className:'circle', width:size, height:size })

    let circle = makeSvg('polyline', { parent:svg, fill:'none', stroke:'white', 'stroke-width':10 })

    const update = (ratio) => {

        let points = []
        let n = ratio * 72 | 0
        let r = 40

        for (let i = 0; i <= n; i++) {

            let a = Math.PI * 2 * (-.25 + ratio * i / n || 0)
            let x = size/2 + r * Math.cos(a)
            let y = size/2 + r * Math.sin(a)

            points.push({ x, y })

        }

        makeSvg(circle, { points:points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ') })

    }

    update(0)

    return {

        svg,
        update,

    }

}

export default makeCircle
