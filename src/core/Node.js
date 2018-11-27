
let nodeIdCount = 0

class Node {

	constructor(props) {

		Object.defineProperty(this, 'nodeId', { enumerable: true, value: nodeIdCount++ })

		this.root = this
		this.depth = 0

		Object.assign(this, props)

	}

	/**
	 * [Fondamental]
	 * Action of inserting a child into the current node.
	 * append(), appendTo() will invoke insert()
	 * Note: A 'dirty' design will have to override this method.
	 */
	insert(child, before = null) {

		if (child.parent)
			child.parent.remove(child)

		child.parent = this
		child.depth = this.depth + 1
		child.root = this.root

		child.forDescendants(node => node.depth = node.parent.depth + 1)

		if (this.lastChild) {

			if (before && before.parent === this) {

				child.next = before
				child.previous = before.previous

				before.previous = child

				if (child.previous) {

					child.previous.next = child

				} else {

					this.firstChild = child

				}

			} else {

				child.previous = this.lastChild
				this.lastChild.next = child

				this.lastChild = child

			}

		} else {

			this.firstChild =
			this.lastChild = child

		}

		return this

	}

	/**
	 * [Fondamental]
	 * Action of removing children from the current node.
	 * detach() will invoke remove()
	 * Note: A 'dirty' design will have to override this method.
	 */
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

	/**
	 * [Fondamental]
	 * Action of removing ALL children from the current node.
	 * Note: A 'dirty' design will have to override this method.
	 */
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



	// utils

	append(...children) {

		for (let child of children) {

			this.insert(child)

		}

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

	*iDescendants() {

		let child = this.firstChild

		while(child) {

			yield child

			yield* child.iDescendants()

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

	forDescendants(callback, { bottomUp = false } = {}) {

		if (bottomUp === false) {

			let child = this.firstChild

			while(child) {

				callback(child)

				child.forDescendants(callback, { bottomUp })

				child = child.next

			}

		} else {

			let child = this.lastChild

			while(child) {

				child.forDescendants(callback, { bottomUp })

				callback(child)

				child = child.previous

			}

		}

	}

	forSomeDescendants(test, callback) {

		let child = this.firstChild

		while(child) {

			if (test(child)) {

				callback(child)

			}

			child.forSomeDescendants(test, callback)

			child = child.next

		}

	}



	// useful arrays

	get ancestors() {

		return Array.from(this.iAncestors())

	}

	get children() {

		return Array.from(this.iChildren())

	}

	get descendants() {

		return Array.from(this.iDescendants())

	}



	// toGraphString:

	toGraphStringLine({ bottomUp = false } = {}) {

		let intro = []

		for (let parent of this.ancestors)
			intro.unshift(parent.next ? '│ ' : '  ')

		return (
			bottomUp === false
			? intro.join('') + (!this.parent ? (this.next ? '┌' : '─') : (this.next ? '├' : '└')) + '─' + (this.firstChild ? '┬' : '─') + '─ Node#' + this.nodeId
			: intro.join('') + (!this.parent ? (this.next ? '└' : '─') : (this.next ? '├' : '┌')) + '─' + (this.firstChild ? '┴' : '─') + '─ Node#' + this.nodeId
		)

	}

	toGraphString({ callback = null, bottomUp = false }) {

		let array = []

		if (bottomUp === false)
			array.push(this)

		this.forDescendants(division => array.push(division), { bottomUp })

		if (bottomUp === true)
			array.push(this)

		return array.map(node => node.toGraphStringLine({ bottomUp }) + (callback ? ` ${callback(node)}` : '')).join('\n')

	}

}

export default Node
