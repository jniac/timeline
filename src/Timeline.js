
import Division from './core/Division.js'
import Head from './core/Head.js'
import Range from './math/Range.js'
import Mth from './math/Mth.js'
import Stack from './utils/Stack.js'
import Average from './utils/Average.js'
import now from './utils/now.js'
import events from './events.js'
import * as helpers from './helpers/index.js'
import * as utils from './utils/utils.js'
import requestAnimationFrame from './utils/requestAnimationFrame.js'

let instances = []

const removeFromInstances = (timeline) => {

    let index = instances.indexOf(timeline)

    if (index !== -1)
        instances.splice(index, 1)

}

class Timeline extends Division {

    constructor(rootWidth = 800) {

        super({ width:rootWidth })

        this.range.width = this.width = rootWidth

        this.onBeforeUpdate = new Stack()
        this.onUpdate = new Stack()

        this.rootContainer = this.createDivision({ parent:this, name:'rootContainer', width:'auto' })
        this.headContainer = this.createDivision({ parent:this, name:'headContainer', width:'none', layout:'absolute' })

        let mainHead = new Head({ name:'main', width:'100%' })
        this.headContainer.append(mainHead)
        mainHead.initPhysics()

        instances.push(this)

    }

    createDivision({ parent = 'rootContainer', ...props }) {

        return super.createDivision({ parent, ...props })

    }

    forceUpdateHeads() {

        this.headContainer.update()
        this.headContainer.forChildren(head => head.updateHead())

    }

    get head() {

        return this.headContainer.firstChild

    }

    // override
    toGraphString({ bottomUp = false } = {}) {

        let callback = node => `${node.props.name ? node.props.name + ' ' : ''}${node.range.position}:${node.range.width}`

        return 'timeline:\n' + super.toGraphString({ bottomUp, callback })

    }

    // override
    destroy() {

        super.destroy()

        onBeforeUpdate.add(() => removeFromInstances(this))

    }

}

let onBeforeUpdate = new Stack()
let onUpdate = new Stack()
let updateAverage = new Average({ length:30 })

const update = () => {

    onBeforeUpdate.execute()

    let t = now()

    for (let timeline of instances) {

        if (timeline.destroyed)
            continue

        timeline.onBeforeUpdate.execute()

        if (timeline.dirty || timeline.dirtyChildren) {

            if (timeline.rootContainer.dirty || timeline.rootContainer.someDescendant(node => node.dirty))
                timeline.rootContainer.update()

            if (timeline.headContainer.dirty || timeline.headContainer.someDescendant(node => node.dirty))
                timeline.headContainer.update()

            // NOTE: 'updateHead' should ALWAYS be called when timeline.dirty === true
            // (division or head layout changes require both to compute again head's [localValues])
            timeline.headContainer.forSomeDescendants(head => head instanceof Head, head => head.updateHead())

            timeline.dirty = timeline.dirtyChildren = false

        }

        timeline.onUpdate.execute()

    }

    updateAverage.setNewValue(now() - t)

    onUpdate.execute()

    requestAnimationFrame(update)

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

    onUpdate,
    now,
    updateAverage,

    // DEBUG: should be removed
    instances,

})

export {

    Mth,

    Division,
    Head,
    Range,

    helpers,
    events,
    utils,

    onUpdate,
    now,
    updateAverage,

    // DEBUG: should be removed
    instances,

}
