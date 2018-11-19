
import Division from './core/Division.js'
import Head from './core/Head.js'
import Range from './math/Range.js'
import Mth from './math/Mth.js'
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

        let mainHead = new Head({ name:'main', width:'100%' })
        let mainEndHead = new Head({ name:'main-middle', position:'50%' })
        this.headContainer.append(mainHead)
        mainHead.append(mainEndHead)

        this.onUpdate = new Stack()

        instances.push(this)

    }

    updateHeads() {

        this.headContainer.forChildren(head => head.updateHead())

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

    Mth,

    Division,
    Head,
    Range,

    helpers,
    events,

})

export {

    Mth,

    Division,
    Head,
    Range,

    helpers,
    events,

}
