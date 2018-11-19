
import Division from './core/Division.js'
import Head from './core/Head.js'
import * as helpers from './helpers/index.js'

class Timeline extends Division {

    constructor(rootWidth = 800) {

        super()

        this.width.basis = rootWidth
        this.range.width = rootWidth

        this.rootContainer = this.createDivision({ name:'rootContainer', width:'auto' })
        this.headContainer = this.createDivision({ name:'headContainer', width:'none' })
        this.headContainer.append(new Head({ name:'main', width:'100%' }))

    }

    toGraphString() {

        return super.toGraphString(node => `${node.props.name ? node.props.name + ' ' : ''}${node.range.position}:${node.range.width}`)

    }

}

export default Timeline

export {

    helpers,

}
