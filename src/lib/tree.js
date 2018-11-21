
let nodeIdCount = 0

class Node {

	constructor(props) {

		Object.defineProperty(this, 'nodeId', { enumerable: true, value: nodeIdCount++ })

		this.root = this
		this.depth = 0

		Object.assign(this, props)

	}

	append(...children) {

		for (let child of children) {

			if (child.parent)
				child.parent.remove(child)

			child.parent = this
			child.depth = this.depth + 1
			child.root = this.root

			child.forDescendants(node => node.depth = node.parent.depth + 1)

			if (this.lastChild) {

				this.lastChild.next = child
				child.previous = this.lastChild

				this.lastChild = child

			} else {

				this.firstChild =
				this.lastChild = child

			}

		}

		return this

	}

	remove(...children) {

		for (let child of children) {

			if (this.lastChild === child)
				this.lastChild = child.previous

			if (this.firstChild === child)
				this.firstChild = child.next

			let { previous, next } = child

			if (previous)
				previous.next = next

			if (next)
				next.previous = previous

			child.parent = null
			child.root = child
			child.previous = null
			child.next = null

		}

		return this

	}

	removeAll() {

		let child = this.firstChild

		while (child) {

			child.parent = null
			child.root = child
			child.previous = null
			child.next = null

			child = child.next

		}

		this.firstChild = null
		this.lastChild = null

		return this

	}

	appendTo(parent) {

		parent.append(this)

		return this

	}

	detach() {

		if (this.parent) {

			this.parent.remove(this)

		}

		return this

	}

	walk(callback) {

		callback(this)

		let child = this.firstChild

		while(child) {

			child.walk(callback)

			child = child.next

		}

		return this

	}

	// hierarchy test:

	get isRoot() {

		return this.root === this

	}

	get isDetached() {

		return this.root === this && !this.parent && !this.next && !this.previous

	}

	// https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
	contains(node) {

		while (node) {

			if (node.parent === this)
				return true

			node = node.parent

		}

		return false

	}

	isContainedBy(node) {

		return node.contains(this)

	}



	// iterators:

	*iChildren() {

		let child = this.firstChild

		while(child) {

			yield child

			child = child.next

		}

	}

	*[Symbol.iterator]() {

		yield* this.iChildren()

	}

	*iAllChildren() {

		let child = this.firstChild

		while(child) {

			yield child

			yield* child.iAllChildren()

			child = child.next

		}

	}

	*iAncestors() {

		let node = this.parent

		while(node) {

			yield node

			node = node.parent

		}

	}



	// array like tests

	someDescendant(test) {

		let child = this.firstChild

		while(child) {

			if (test(child) || child.someDescendant(test))
				return true

			child = child.next

		}

		return false

	}

	findDescendant(test) {

		let child = this.firstChild

		while(child) {

			let result = test(child) ? child : child.findDescendant(test)

			if (result)
				return result

			child = child.next

		}

		return undefined

	}

	// callback

	forChildren(callback) {

		let child = this.firstChild

		while(child) {

			callback(child)

			child = child.next

		}

	}

	forDescendants(callback) {

		let child = this.firstChild

		while(child) {

			callback(child)

			child.forDescendants(callback)

			child = child.next

		}

	}



	// useful arrays

	get ancestors() {

		return [...this.iAncestors()]

	}

	get children() {

		return [...this.iChildren()]

	}

	get allChildren() {

		return [...this.iAllChildren()]

	}



	// toGraphString:

	toGraphStringLine() {

		let intro = []

		for (let parent of this.iAncestors())
			intro.unshift(parent.next ? '│ ' : '  ')

		return intro.join('') + (!this.parent ? (this.next ? '┌' : '─') : (this.next ? '├' : '└')) + '─' + (this.firstChild ? '┬' : '─') + '─ Node#' + this.nodeId

	}

	toGraphString(callback) {

		return [this, ...this.iAllChildren()].map(node => node.toGraphStringLine() + (callback ? ` ${callback(node)}` : '')).join('\n')

	}

}

export { Node }
