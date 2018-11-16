
import { Node } from '../lib/tree.js'

import Range from '../math/Range.js'
import LayoutProperty from './LayoutProperty.js'

class Division extends Node {

    constructor(props) {

        super()

        this.position = new LayoutProperty()
        this.anchorPosition = new LayoutProperty()
        this.width = new LayoutProperty()

        this.range = new Range()
        this.bounds = new Range()
        this.props = { ...props }

    }

    fetchDivision() {

    }

    division() {

    }

}

export default Division
