/**
 * event.js module
 * a very permissive event module, with great options
 * second version built on WeakMap
 * inspired by jQuery (chaining, iterations), express (flexibility) etc.
 *
 *
 *
 * WARNINGS & VULNERABILITIES:
 *
 * • For some unknow reasons a killed Listener is sometimes called or killed (a second time!)
 *       " if (this.killed)
 *            return "
 *       is a good patch, but the bug is not fixed
 *
 * • When removing a listener, if the listener has been added with a "thisArg" 
 *       it could currently be removed without specifying a value for "thisArg" (since off/removeEventListener() could be used with nothing more than a type parameters)
 *       this is dangerous since differents listeners could match the same criteria (two instance of a same class / prototype have striclty equal members 
 *       (because actually belonging to that class / prototype)).
 *       When specifying a callback to removeEventListener AND NOT a thisArg, should be considered as not matching listeners that HAVE a thisArg ?
 * 
 */

const isIterable = obj => obj ? (typeof obj[Symbol.iterator] === 'function') : false;

const whitespace = obj => typeof obj === 'string' && /\s/.test(obj);

let weakmap = new WeakMap();



function createListenersArray(target) {

	let listeners = [];

	weakmap.set(target, listeners);

	return listeners

}

function deleteListenersArray(target) {

	weakmap.delete(target);

	

}

function getAllListeners(target, createMode = false) {

	return weakmap.get(target) || (createMode ? createListenersArray(target) : null)

}

function getListenersMatching(target, type, callback = null, options = null) {

	let listeners = weakmap.get(target);

	if (!listeners)
		return []

	let result = [];

	for (let listener of listeners)
		if (listener.match(type, callback, options))
			result.push(listener);

	return result

}

function addEventListener(target, type, callback, options = undefined) {

	if (!callback) {

		console.log('event.js: addEventListener callback is null! (ignored)');
		return

	}

	if (isIterable(target)) {

		for (let element of target)
			addEventListener(element, type, callback, options);

		return target

	}

	if (whitespace(type)) {

		for (let sub of type.split(/\s/))
			addEventListener(target, sub, callback, options);

		return target

	}

	let listener = new Listener(getAllListeners(target, true), type, callback, options);

	return target

}

function once(target, type, callback, options = { }) {

	options.max = 1;

	return addEventListener(target, type, callback, options)

}

function removeEventListener(target, type, callback = null, options = { }) {

	if (isIterable(target)) {

		for (let element of target)
			removeEventListener(element, type, callback);

		return target

	}

	if (whitespace(type)) {

		for (let sub of type.split(/\s/))
			removeEventListener(target, type, callback);

		return target

	}

	for (let listener of getListenersMatching(target, type, callback, options))
		listener.kill();

	return target

}

function clearEventListener(target) {

	let listeners = weakmap.get(target);

	if (!listeners)
		return target

	while(listeners.length)
		listeners.pop().kill();

	deleteListenersArray(target);

	return target

}

function dispatchEvent(target, event, eventOptions = null) {

	if (!target || !event)
		return target

	if (isIterable(target)) {

		for (let element of target)
			dispatchEvent(element, event, eventOptions);

		return target

	}

	// fast skip test (x20 speed on target with no listeners: 0.0030ms to 0.00015ms)
	if (!weakmap.has(target) && !event.propagateTo && (!eventOptions || !eventOptions.propagateTo))
		return target

	if (typeof event === 'string') {

		if (whitespace(event)) {

			for (let sub of event.split(/\s/))
				dispatchEvent(target, sub, eventOptions);

			return target

		}

		return dispatchEvent(target, new Event(target, event, eventOptions))

	}



	event.currentTarget = target;

	// let listeners = getListenersMatching(target, event.type).sort((A, B) => B.priority - A.priority)
	let listeners = getListenersMatching(target, event.type);

	for (let listener of listeners) {

		listener.call(event);

		if (event.canceled)
			break

	}

	if (event.propagateTo)
		dispatchEvent(event.propagateTo(event.currentTarget), event);

	return target

}









const EventOptions = {

	cancelable: true,
	priority: 0,
	propagateTo: null,

};

class Event {

	constructor(target, type, options) {

		options = Object.assign({}, EventOptions, options);

		Object.defineProperty(this, 'target', { 

			value: target,

		});

		Object.defineProperty(this, 'currentTarget', { 

			writable: true,
			value: target,

		});

		Object.defineProperty(this, 'type', {

			enumerable: true,
			value: type,

		});

		for (let k in options) {

			Object.defineProperty(this, k, { 
				
				enumerable: k in EventOptions,
				value: options[k],

			});

		}

		Object.defineProperty(this, 'canceled', {

			writable: this.cancelable,
			value: false,

		});

	}

	cancel() {

		if (this.cancelable)
			this.canceled = true;

	}

}



let ListenerDefaultOptions = {

	priority: 0,
	insertFirst: false,

};

class Listener {

	constructor(array, type, callback, options = {}) {

		this.count = 0;

		this.array = array;
		// this.array.push(this)

		this.type = type;
		this.callback = callback;

		this.enabled = true;

		// options
		Object.assign(this, ListenerDefaultOptions, options);

		let index = this.array.findIndex(listener => this.insertFirst ? 
			listener.priority <= this.priority : 
			listener.priority < this.priority);

		if (index === -1)
			this.array.push(this);
		else
			this.array.splice(index, 0, this);

	}

	match(str, callback = null, options = null) {

		if (options !== null && this.match(str, callback)) {

			for (let k in options)
				if (this[k] !== options[k])
					return false

			return true

		}

		if (callback !== null)
			return this.match(str) && this.callback === callback

		if (this.type instanceof RegExp)
			return this.type.test(str)

		if (this.type instanceof Array)
			return this.type.indexOf(str) !== -1

		if (typeof this.type === 'function')
			return this.type(str)

		return this.type === str

	}

	call(event) {

		if (this.killed)
			return

		this.callback.call(this.thisArg || event.currentTarget, event, ...(this.args || []));

		this.count++;

		if (this.count === this.max)
			this.kill();

	}

	kill() {

		if (this.killed)
			return

		let index = this.array.indexOf(this);

		this.array.splice(index, 1);

		delete this.array;
		delete this.type;
		delete this.callback;
		delete this.options;

		this.killed = true;

	}

}







let EventDispatcherPrototype = {

	getAllListeners(createMode = false) {

		return getAllListeners(this, createMode)

	},

	clearEventListener() {

		return clearEventListener(this)

	},
	
	addEventListener(type, callback, options = undefined) { 

		return addEventListener(this, type, callback, options) 

	},

	on(type, callback, options = undefined) { 

		return addEventListener(this, type, callback, options) 

	},

	once(type, callback, options = { }) { 

		return once(this, type, callback, options) 

	},

	removeEventListener(type, callback = undefined, options = undefined) { 

		return removeEventListener(this, type, callback, options) 

	},

	off(type, callback = undefined, options = undefined) { 

		return removeEventListener(this, type, callback, options) 

	},

	dispatchEvent(event, eventOptions = null) { 

		return dispatchEvent(this, event, eventOptions) 

	},

};







class EventDispatcher { }

Object.assign(EventDispatcher.prototype, EventDispatcherPrototype);

// utils

function copy(object, { recursive = false, exclude = null } = {}) {

	if (typeof object !== 'object')
		return object

	// let result = new object.constructor()
	let result = {};

	if (exclude && typeof exclude === 'string')
		exclude = exclude.split(/,\s|,|\s/);

	for (let k in object) {

		if (exclude.includes(k))
			continue

		let value = object[k];

		if (recursive && typeof value === 'object')
			value = copy(value, { recursive, exclude });

		result[k] = value;

	}

	return result

}

function propsToString(props) {

	let entries = Object.entries(props);

	if (!entries.length)
		return '{}'

	return `{ ${entries.map(([k, v]) => {

		if (v === true)
			return k

		return k + ': ' + v

	}).join(', ')} }`

}

/*

query(object, 'page enabled')
query(object, 'page enabled > stop')
query(object, 'page enabled pagination.number>0 > stop')
query(object, 'page enabled pagination[number>0] > stop')
query(object, 'stop name=bob')

*/

const SelectorOp = {

	'=': 	(lhs, rhs) => String(lhs) === String(rhs),
	'!=': 	(lhs, rhs) => String(lhs) !== String(rhs),
	'>': 	(lhs, rhs) => parseFloat(lhs) > parseFloat(rhs),
	'>=': 	(lhs, rhs) => parseFloat(lhs) >= parseFloat(rhs),
	'<': 	(lhs, rhs) => parseFloat(lhs) < parseFloat(rhs),
	'<=': 	(lhs, rhs) => parseFloat(lhs) <= parseFloat(rhs),

};

function makeTest(str) {

	let [, key, op, rhs] = str.match(/([\w-]+|\*)(=|!=|>|>=|<|<=)?([\w-]+)?/);

	if (key === '*')
		return object => true

	return op
		? object => SelectorOp[op](object[key], rhs)
		: object => object.hasOwnProperty(key)

}

function getChildren(object, childrenDelegate, includeSelf) {

	let array = includeSelf ? [object] : [];

	let children = childrenDelegate(object);

	if (children)
		for (let child of children)
			array.push(...getChildren(child, childrenDelegate, true));

	return array

}

/**
 * returns children objects matching selector
 * selector rules:
 *
 *    • Match only the first result (the result will not be necessarily iterable)
 *    'first:[str]' 
 *
 *    • Match children
 *    '[str] > [str]' 
 *
 */
function query(object, selector, { firstOnly = false, propsDelegate = 'props', childrenDelegate = 'children' } = {}) {

	if (typeof propsDelegate === 'string') {

		let key = propsDelegate;
		propsDelegate = object => object[key];
		
	}

	if (typeof childrenDelegate === 'string') {

		let key = childrenDelegate;
		childrenDelegate = object => object[key];

	}

	if (/^f:|^first:/.test(selector)) {

		firstOnly = true;
		selector = selector.replace(/^f:|^first:/, '');

	}

	let includeSelf = true;

	if (/^\s*>\s+/.test(selector)) {

		selector = selector.replace(/^\s*>\s+/, '');
		includeSelf = false;

	}

	let stages = selector
		.split(/\s+>\s+/)
		.map(str => str
			.split(/\s+/)
			.map(str => makeTest(str)));

	let array, candidates = getChildren(object, childrenDelegate, includeSelf);

	for (let [index, stage] of stages.entries()) {

		array = [];

		for (let candidate of candidates) {

			let props = propsDelegate(candidate);

			if (stage.every(test => test(props)))
				array.push(candidate);

		}

		candidates = [].concat(...array.map(candidate => childrenDelegate(candidate) || []));

	}

	return firstOnly ? array[0] || null : array

}

const percent = /%/;
const spaces = /\s/;

/**
 *
 * Double
 * 
 * Most of the lines are about parsing input values:
 * 
 * x 			> new Double(x, 1)
 * '100' 		> new Double(100, 0)
 * '100%' 		> new Double(0, 1)
 * '0 1' 		> new Double(0, 1)
 * '50 50%' 	> new Double(50, .5)
 * '50% 50%' 	> new Double(.5, .5)
 * [x, y] 		> new Double(x, y)
 * 
 */

class Double {

	static isDouble(value) {

		return value.hasOwnProperty('absolute') && value.hasOwnProperty('relative')

	}

	static parsePercent(value) {

		return parseFloat(value) * (percent.test(value) ? .01 : 1)

	}

	static parse(value, relativeValue = null) {

		if (Double.isDouble(value))
			return value

		return new Double().parse(value, relativeValue)

	}

	constructor(absolute = 0, relative = 0) {

		this.absolute = absolute;
		this.relative = relative;

	}

	parse(value, relativeValue = null) {

		if (relativeValue)
			return this.set(Double.parsePercent(value), Double.parsePercent(relativeValue))

		if (value instanceof Array)
			return this.set(Double.parsePercent(value[0]), Double.parsePercent(value[1]))

		switch(typeof value) {

			case 'number':

				return this.set(value, 0)

			case 'string':
				
				if (spaces.test(value))
					return Double.parse(value.split(spaces))

				return percent.test(value)
					? this.set(0, parseFloat(value) / 100)
					: this.set(parseFloat(value), 0)

			default:

				return this.set(0, 0)

		}

	}

	set(absolute, relative) {

		if (typeof absolute === 'number' && typeof relative === 'number') {

			this.absolute = absolute;
			this.relative = relative;

			return this

		}

		return this.parse(absolute, relative)

	}

	solve(relativeReference) {

		return (relativeReference || 0) * this.relative + this.absolute

	}

	/**
	 * alignment is solved that way:
	 *
	 * relative === -1 		=> 		-relativeReference (+ absolute)
	 * relative === 0 		=> 		-relativeReference / 2 (+ absolute)
	 * relative === 1 		=> 		0 (+ absolute)
	 *
	 */
	solveAlign(relativeReference) {

		return (relativeReference || 0) * (this.relative - 1) / 2 + this.absolute 

	}

	toString() {

		return this.absolute === 0 && this.relative === 0
			? '0'
			: this.relative === 0
			? this.absolute.toFixed(1)
			: this.absolute === 0
			? (this.relative * 100).toFixed(1) + '%'
			: this.absolute.toFixed(1) + ' ' + (this.relative * 100).toFixed(1) + '%'

	}

}




/** Class representing an interval [min, max] */

class Range {

	constructor(min = 0, max = 1) {

		this.set(min, max);

	}

	set(min, max) {

		this.min = min;
		this.max = max;

		return this

	}

	isVoid() {

		return isNaN(this.min) || isNaN(this.max)

	}

	copy(other) {

		this.min = other.min;
		this.max = other.max;

		return this

	}

	clone() {

		return new Range(this.min, this.max)

	}

	intersects(other) {

		return !(other.max < this.min || other.min > this.max)
		
	}

	intersection(other, clone = false) {

		let target = clone ? this.clone() : this;

		if (!target.intersects(other))
			return target.set(NaN, NaN)

		return target.set(Math.max(this.min, other.min), Math.min(this.max, other.max))

	}

	union(other, clone = false) {

		let target = clone ? this.clone() : this;

		if (this.isVoid())
			return target.copy(other)

		return target.set(Math.min(this.min, other.min), Math.max(this.max, other.max))

	}

	contains(x) {

		return x >= this.min && x <= this.max

	}

	/**
	 * interpolate a value to local bound
	 * @param {number} x the ratio, if x = 0: interpolate(x) = min, if x = 1: interpolate(x) = max
	 * @param {boolean} clamp should the result be clamp to [min, max]?
	 */
	interpolate(x, clamp = false) {

		if (clamp)
			x = x < 0 ? 0 : x > 1 ? 1 : x;

		return this.min + (this.max - this.min) * x

	}

	/**
	 * return the ratio of x inside the range
	 * @param {number} x the value, if x = min: interpolate(x) = 0, if x = max: interpolate(x) = 1
	 * @param {boolean} clamp should the result be clamp to [0, 1]?
	 */
	ratio(x, clamp = false) {

		if (clamp) {

			if (x < this.min)
				return 0

			if (x > this.max)
				return 1

		}

		return (x - this.min) / (this.max - this.min)

	}

	get width() { return this.max - this.min }
	set width(value) { this.max = this.min + value; }

	toString(type = null) {

		if (type === 1)
			return this.min.toFixed(0) + '~' + this.max.toFixed(0)

		return '[' + this.min.toFixed(1) + ', ' + this.max.toFixed(1) + ']'

	}

}

/**
 * Class to simulate the movement of a Mobile from 2 variables:
 * • velocity
 * • friction
 *
 * key function: destination = position - velocity / log(friction)
 */
class Mobile {

	constructor() {

		Object.assign(this, {

			// classic physic properties
			position: 0,
			velocity: 0,	// px / s
			friction: .01, 	// ratio / s^2 WARN: inversed expression, friction represent the remaining part of velocity after 1 second

			hasMoved: false,
			positionOld: 0,
			velocityOld: 0,
			
			// target
			forcedPosition: NaN,
			// target: NaN,
			// computedFriction: .1,

		});

	}

	update(dt = 1 / 60) {

		let { position, position:positionOld, velocity, velocity:velocityOld, friction } = this;

		// integral
		position += velocity * (friction ** dt - 1) / Math.log(friction);
		velocity *= friction ** dt;

		let hasMoved = position !== positionOld;

		if (!isNaN(this.forcedPosition)) {

			position = this.forcedPosition;
			this.forcedPosition = NaN;

		}

		Object.assign(this, { position, positionOld, velocity, velocityOld, hasMoved });

	}

	setFriction(value, dt = 1) {

		this.friction = value ** (1 / dt);

	}

	setPosition(value, { computeVelocity = true, dt = 1 / 60 } = {}) {

		let d = value - this.positionOld;
		this.position = value;
		this.velocity = d ** (1 / dt);

	}

	/**
	 * F*** powerful, i can't remind how it works, but it works!
	 */
	getDestination({ position, velocity, friction } = this) {

		return position + -velocity / Math.log(friction)

	}

	getVelocityForDestination(destination, { position, friction } = this) {

		return (position - destination) * Math.log(friction)

	}

	getFrictionForDestination(destination, { position, velocity } = this) {

		return Math.exp(velocity / (position - destination))

	}

	get destination() { return this.getDestination() }

	shoot(destination) {

		this.velocity = this.getVelocityForDestination(destination);

		return this

	}

}










/**
 * Extends Mobile to add Timeline integration.
 */

class Head extends Mobile {

	constructor(timeline) {

		super();

		this.color = 'red';
		this.timeline = timeline;

	}

	getIndex() {

		return this.timeline
			? this.timeline.heads.indexOf(this)
			: -1

	}

	get index() { return this.getIndex() }

	// value interface for easier handling
	get value() { return this.position }
	set value(value) { 

		this.forcedPosition = value;
		this.forceUpdate = true;

	}

	update(force = false) {

		super.update();

		if (force || this.forceUpdate || this.hasMoved) {

			this.forceUpdate = false;

			let index = this.getIndex();
			
			this.timeline.rootDivision.walk(division => division.updateHead(index, this.position));

		}

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

	}

}

let now = typeof performance === 'object' 
	? performance.now.bind(performance)
	: Date.now.bind(Date);

const readonlyProperties = (target, properties, options = {}) => {

	for (let [key, value] of Object.entries(properties))
		Object.defineProperty(target, key, Object.assign({ value }, options));

};





/**
 * key can be compared via 'is':
 * 
 * let e = new Enum('FOO', 'BAR')
 * let key = e.FOO
 * key.is.FOO // true
 * key.is.BAR // false
 *
 */
class EnumKey {

	constructor(enumInstance, index, keys) { 

		Object.assign(this, {

			enum: enumInstance,
			name: keys[index],
			index,
			is: keys.reduce((r, v, i) => Object.defineProperty(r, v, {

				value: i === index,
				enumerable: true,

			}), {}),

		});

		Object.freeze(this);
	
	}

	toString() { return this.name }

}

class Enum {

	constructor(...keys) {

		for (let [index, key] of keys.entries()) {

			Object.defineProperty(this, key, {

				value: new EnumKey(this, index, keys),
				enumerable: true,

			});

		}

		Object.freeze(this);

	}

	has(key) { return this[key] === key }

	*[Symbol.iterator]() {

		for (let key of Object.keys(this))
			yield this[key];

	}

	toString() { return [...this].join(', ') }

}

/**
 *
 * SpaceProperty
 * 
 * Most of the lines are about parsing input values:
 * 
 * x 			> new Double(x, 1)
 * '100' 		> new Double(100, 0)
 * '100%' 		> new Double(0, 1)
 * '0 1' 		> new Double(0, 1)
 * '50 50%' 	> new Double(50, .5)
 * '50% 50%' 	> new Double(.5, .5)
 * [x, y] 		> new Double(x, y)
 * 
 */


	// console.log('' + new SpaceProperty('content'))
	// console.log('' + SpaceProperty.ensure(2))
	// console.log('' + SpaceProperty.ensure('200%'))
	// console.log('' + SpaceProperty.ensure('300 200%'))

	// let p1 = new SpaceProperty('bob')
	// console.log(SpaceProperty.ensure(p1) === p1)

const PositionMode = new Enum(

	'STACK',			// position depends on previous spaces
	'FREE', 			// position depends on [this.position] and [this.parent.range]
);

const WidthMode = new Enum(

	'FIXED',			// width is fixed (by 'width' property)
	'CONTENT',			// width is computed from content

	// TODO, implement:
	'FLEX',				// width is fixed (by 'width' property), but children width is computed from their contribution among the available width

);

console.log(WidthMode.FIXED.name === 'FIXED');




let spaceUID = 0;

class Space {

	constructor({ position = 0, width = '100%', align = '100%', order = 0, positionMode, widthMode } = {}) {

		readonlyProperties(this, {

			uid: spaceUID++,

		});

		Object.assign(this, {

			// design:
			
			positionMode: PositionMode[positionMode] || PositionMode.STACK,
			position: new Double().set(position),
			globalPosition: NaN,

			widthMode: WidthMode[widthMode] || WidthMode.FIXED,
			width: new Double().set(width),
			globalWidth: 0,
			
			order,
			align: new Double().set(align), // 100% = align left, 0% = center, -100% = align right

			// maths:

			range: new Range(0, 1),
			bounds: new Range(0, 0),

			// hierarchy:

			root: this,
			parent: null,
			children: [],
			sortedChildren: [],

			childrenUniqueIdentifierCount: 0,
			childUniqueIdentifier: -1,

			// debug:

			color: null,

		});

	}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (child.parent)
			child.parent.removeChild(child);

		child.root = this.root;
		child.parent = this;
		child.childUniqueIdentifier = this.childrenUniqueIdentifierCount++;
		this.children.push(child);

		return this

	}

	removeChild(child) {

		if (child.parent !== this)
			throw 'child argument is not a child of this'

		child.root = this;
		child.parent = null;
		child.childUniqueIdentifier = -1;
		this.children.splice(this.children.indexOf(child), 1);

		return this

	}

	remove() {

		if (this.parent)
			this.parent.removeChild(this);

		return this

	}

	getFixedParent() {

		let parent = this.parent;

		while(parent && parent.widthMode !== WidthMode.FIXED)
			parent = parent.parent;

		return parent

	}

	resolveSpace() {

		this.resolveWidth();
		this.resolvePosition();

	}

	getParentGlobalWidth() {

		let space = this.parent;

		while(space && space.widthMode.is.CONTENT)
			space = space.parent;

		// important if no fixed parent is found: 
		// globalWidth is computed from root.width
		return space ? space.globalWidth : this.root.width.solve(0)

	}

	resolveWidth() {

		this.sortedChildren = this.children.concat().sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier);

		if (this.widthMode.is.CONTENT) {

			this.globalWidth = 0;

			for (let child of this.sortedChildren) {

				child.resolveWidth();

				if (child.positionMode.is.STACK)
					this.globalWidth += child.globalWidth;

			}

		} else {

			this.globalWidth = this.width.solve(this.getParentGlobalWidth());

			for (let child of this.sortedChildren)
				child.resolveWidth();

		}

	}

	resolvePosition(stackOffset = 0) {

		if (this.positionMode.is.FREE) {

			// this.globalPosition = (this.parent && this.parent.globalPosition || 0) + this.position.solve(this.parent && this.parent.globalWidth || 0)
			this.globalPosition = (this.parent && this.parent.range.min || 0) + this.position.solve(this.parent && this.parent.globalWidth || 0);

			let alignOffset = this.align.solveAlign(this.globalWidth);
			this.range.min = this.globalPosition + alignOffset;
			this.range.max = this.globalPosition + alignOffset + this.globalWidth;

		} else {

			this.globalPosition = (this.parent && this.parent.globalPosition || 0) + stackOffset + this.position.solve(this.parent && this.parent.globalWidth || 0);
			this.range.min = this.globalPosition;
			this.range.max = this.globalPosition + this.globalWidth;

		}

		this.bounds.copy(this.range);

		let childStackOffset = 0;

		for (let child of this.sortedChildren) {

			child.resolvePosition(childStackOffset);

			if (child.positionMode.is.STACK)
				childStackOffset += child.globalWidth;

			this.bounds.union(child.bounds);

		}

	}


	// resolveSpace() {

	// 	let { parent, range, position, width, align, children } = this

	// 	// self positionMode:

	// 	let fixedParent = this.getFixedParent()

	// 	let rangeWidth = !fixedParent
	// 		? width.relative + width.absolute
	// 		: fixedParent.range.width * width.relative + width.absolute

	// 	let alignOffset = rangeWidth * (align.relative - 1) / 2 + align.absolute

	// 	this.globalPosition = offset + (parent ? parent.range.interpolate(position.relative) : position.relative) + position.absolute

	// 	range.min = !parent
	// 		? offset + alignOffset + position.relative + position.absolute
	// 		: offset + alignOffset + parent.range.min + parent.range.width * position.relative + position.absolute

	// 	range.width = rangeWidth

	// 	if (this.widthMode === WidthMode.CONTENT)
	// 		this.range.copy(this.bounds)

	// 	this.bounds.copy(this.range)

	// 	// children:

	// 	children.sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)

	// 	let childOffset = 0
	// 	this.floatChildren.length = 0

	// 	for (let child of children) {
			
	// 		child.resolveSpace(childOffset)

	// 		if (child.positionMode === PositionMode.STACK) {

	// 			childOffset += child.range.width

	// 			if (this.widthMode === WidthMode.CONTENT)
	// 				this.range.union(child.range)

	// 		}

	// 		this.bounds.union(child.bounds)

	// 	}

	// 	// if (this.widthMode === WidthMode.CONTENT)
	// 	// 	this.range.copy(this.bounds)

	// 	return this

	// }

	walk(callback) {

		callback(this);

		for (let child of this.children)
			child.walk(callback);

		return this

	}

	contains(value) {

		return value >= this.range.min && value <= this.range.min + this.range.width

	}

	getSpaces(value) {

	}

	toString() {

		return `Space#${this.uid} {${this.positionMode} d:${this.depth}, p:${this.position.toString()}, w:${this.width.toString()} r:${this.range.toString(1)}, b:${this.bounds.toString(1)}}`

	}

}

let divisionMap = new WeakMap();
let divisionUID = 0;

class DivisionProps {

	constructor(division, props) {

		Object.assign(this, props);

		Object.defineProperties(this, {

			root: {

				enumerable: true,
				get() { return !division.space.parent } 

			},

		});

	}

}

class Division extends EventDispatcher {

	constructor(timeline, parent, spaceProps = null, props = null) {

		super();

		readonlyProperties(this, {

			uid: divisionUID++,
			space: new Space(spaceProps),
			// props: Object.assign({}, props),
			props: new DivisionProps(this, props),
			heads: [],

		});

		Object.assign(this, {

			timeline,

		});

		readonlyProperties(this.props, { uid: this.uid }, { enumerable: true });

		divisionMap.set(this.space, this);

		if (parent)
			parent.space.addChild(this.space);

	}

	addTo(parent) {

		if (typeof parent === 'string')
			parent = this.timeline.query(parent);

		if (Array.isArray(parent))
			parent = parent[0];

		parent.space.addChild(this.space);

		return this

	}

	remove() {

		this.space.remove();

		return this

	}

	query(selector) {

		return query(this, selector)

	}

	// queryFirst(selector) {

	// 	return query(this, selector)[0] || null
	// }

	updateHead(index, headValue) {

		let relative = this.space.range.ratio(headValue);

		// handle the 0 / 0 case (0 / range.width)
		if (isNaN(relative))
			relative = 1;

		let relativeClamp = relative < 0 ? 0 : relative > 1 ? 1 : relative;

		let newValues = { index, global: headValue, absolute: headValue - this.space.range.min, relative, relativeClamp };
		let oldValues = this.heads[index] || { index: -1, global: NaN, absolute: NaN, relative: NaN, relativeClamp: NaN };

		this.heads[index] = newValues;

		let old_r = 		oldValues.relative;
		let new_r = 		newValues.relative;
		let direction = 	old_r < new_r ? 1 : -1;

		// flags:

		let wasInside = 	old_r >= 0 && old_r <= 1;
		let isInside = 		new_r >= 0 && new_r <= 1;

		let enter = 		!wasInside && isInside;
		let exit = 			wasInside && !isInside;

		let pass = 			old_r <= 1 && new_r > 1 ||
							old_r >= 0 && new_r < 0;

		let eventData = { progress:relativeClamp, direction, values:newValues, oldValues, propagateTo: target => target instanceof Division && this.timeline };

		if (isNaN(oldValues.global))
			this.dispatchEvent(`init-head${index}`, eventData);

		if (enter)
			this.dispatchEvent(`enter-head${index}`, eventData);

		if (exit)
			this.dispatchEvent(`exit-head${index}`, eventData);

		if (isInside || pass)
			this.dispatchEvent(`progress-head${index}`, eventData);

		if (pass)
			this.dispatchEvent(`pass-head${index}`, eventData);

	}

	// traps:
	get parent() { return this.space.parent && divisionMap.get(this.space.parent) }
	get children() { return this.space.children && this.space.children.map(v => divisionMap.get(v)) }

	walk(callback) {

		this.space.walk(space => callback(divisionMap.get(space)));

		return this

	}

	toString() {

		let r = `[${this.space.range.min}, ${this.space.range.min + this.space.range.width}]`;
		let b = `[${this.space.bounds.min}, ${this.space.bounds.max}]`;
		let props = propsToString(copy(this.props, { exclude: 'uid' }));

		return `Division#${this.uid} {props: ${props}, r: ${r}, b: ${b}}`

	}

}

let timelines = [];
let timelineUID = 0;

class Timeline extends EventDispatcher {

	constructor(rootWidth = 1) {

		super();

		readonlyProperties(this, {

			uid: timelineUID++,
			rootDivision: this.createDivision(null, { width: rootWidth, 
				widthMode: 'CONTENT',
			}),
			heads: [],

		});

		this.currentDivision = this.rootDivision;

		Object.assign(this, {

			enabled: true,

		});

		this.newHead();

		timelines.push(this);

	}

	newHead() {

		this.heads.push(new Head(this));

	}

	get head() { return this.heads[0] }

	update() {

		let t = now();

		this.rootDivision.space.resolveSpace();

		for (let head of this.heads)
			head.update();

		let dt = now() - t;

		this.updateCost = dt;

		this.dispatchEvent('update');

	}

	createDivision(parent = this.rootDivision, spaceProps, props = null) {

		let division = new Division(this, parent, spaceProps, props);

		this.lastDivision = division;

		return division

	}

	// shorthands

	query(selector) { return this.rootDivision.query(selector) }

	division({ parent = null, position = 0, width = '100%', align = '100%', order = 0, widthMode, positionMode }) {

		let props = copy(arguments[0], { recursive: false, exclude: 'parent, position, width, align, order, positionMode, widthMode' });

		if (typeof parent === 'string')
			parent = this.query(parent);

		if (Array.isArray(parent))
			parent = parent[0];

		if (!parent)
			parent = this.currentDivision;

		return this.createDivision(parent, { position, width, align, order, positionMode, widthMode }, props)

		return null

	}

}

function udpateTimelines() {

	if (typeof requestAnimationFrame === 'undefined')
		throw 'requestAnimationFrame is not available, cannot run'

	requestAnimationFrame(udpateTimelines);

	for (let timeline of timelines)
		if (timeline.enabled)
			timeline.update();

}

udpateTimelines();

export { Timeline };
