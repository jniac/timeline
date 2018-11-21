
import Division from './core/Division.js'
import Head from './core/Head.js'
import Range from './math/Range.js'
import Mth from './math/Mth.js'
import Stack from './utils/Stack.js'
import * as events from './events/Dispatcher.js'
import * as helpers from './helpers/index.js'
import * as utils from './utils/utils.js'

let instances = []

class Timeline extends Division {

    constructor(rootWidth = 800) {

        super({ width:rootWidth })

        this.range.width = this.width = rootWidth

        this.rootContainer = this.createDivision({ parent:this, name:'rootContainer', width:'auto' })
        this.headContainer = this.createDivision({ parent:this, name:'headContainer', width:'none', layout:'absolute' })

        let mainHead = new Head({ name:'main', width:'100%' })
        this.headContainer.append(mainHead)

        this.onUpdate = new Stack()

        instances.push(this)

    }

    createDivision({ parent = 'rootContainer', ...props }) {

        return super.createDivision({ parent, ...props })

    }

    updateHeads() {

        this.headContainer.update()
        this.headContainer.forChildren(head => head.updateHead())

    }

    get head() {

        return this.headContainer.firstChild

    }

    toGraphString() {

        return 'timeline:\n' + super.toGraphString(node => `${node.props.name ? node.props.name + ' ' : ''}${node.range.position}:${node.range.width}`)

    }

}

const update = () => {

    requestAnimationFrame(update)

    for (let timeline of instances) {

        if (timeline.dirty) {

            timeline.rootContainer.update()
            timeline.headContainer.update()
            timeline.headContainer.forChildren(head => head.updateHead())
            timeline.dirty = false

        }

        timeline.onUpdate.execute()

    }

}

update()



export default Timeline

utils.readonly(Timeline, {

    Mth,

    Division,
    Head,
    Range,

    helpers,
    events,
    utils,

})

export {

    Mth,

    Division,
    Head,
    Range,

    helpers,
    events,
    utils,

}
