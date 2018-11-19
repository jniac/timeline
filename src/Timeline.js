
import Division from './core/Division.js'
import Head from './core/Head.js'
import Stack from './utils/Stack.js'
import * as events from './events/Dispatcher.js'
import * as helpers from './helpers/index.js'

let instances = []

class Timeline extends Division {

    constructor(rootWidth = 800) {

        super()

        this.width.basis = rootWidth
        this.range.width = rootWidth

        this.rootContainer = this.createDivision({ name:'rootContainer', width:'auto' })
        this.headContainer = this.createDivision({ name:'headContainer', width:'none' })
        this.headContainer.append(new Head({ name:'main', width:'100%' }))

        this.onUpdate = new Stack()

        instances.push(this)

    }

    get head() {

        return this.headContainer.firstChild

    }

    toGraphString() {

        return super.toGraphString(node => `${node.props.name ? node.props.name + ' ' : ''}${node.range.position}:${node.range.width}`)

    }

}

const update = () => {

    requestAnimationFrame(update)

    for (let timeline of instances) {

        timeline.onUpdate.execute()

    }

}

update()



export default Timeline

Object.assign(Timeline, {

    helpers,
    events,

})

export {

    helpers,
    events,

}
