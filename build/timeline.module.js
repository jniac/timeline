/*

	timeline.js
<<<<<<< HEAD
	2018-07-18 15:55 GMT(+2)
=======
	2018-07-18 15:52 GMT(+2)
>>>>>>> 37579c8f84e4c15906477c78c9e9e57cc185db5f
 	exprimental stuff from https://github.com/jniac/timeline

*/

import { EventDispatcher } from './event.js';

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



/*

query(object, 'page enabled')
query(object, 'page !enabled')
query(object, 'page enabled > section')
query(object, 'page enabled pagination.number>0 > section')
query(object, 'page enabled pagination[number>0] > section')
query(object, 'section name=bob')

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

	let [, not, key, op, rhs] = str.match(/(!)?([\w-]+|\*)(=|!=|>|>=|<|<=)?([\w-]+)?/);

	if (key === '*')
		return object => true

	return not
	 	? object => object.hasOwnProperty(key) && !object[key]
		: op
		? object => SelectorOp[op](object[key], rhs)
		: object => object.hasOwnProperty(key) && !!object[key]

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
 *    'first:{selector}' or 'f:{selector}'
 *
 *    • Match multiple:
 *    'type=page !isRoot width>100'
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

/** Class representing an interval [min, max] */

class Range {

	constructor(min = 0, max = 1) {

		this.set(min, max);

	}

	equals(other) {

		return this.min === other.min && this.max == other.max

	}

	set(min, max) {

		this.min = min;
		this.max = max;

		return this

	}

	secure() {

		if (this.min > this.max)
			this.min = this.max = (this.min + this.max) / 2;
			
	}

	expand(q) {

		this.min += -q;
		this.max += q;

		this.secure();

		return this

	}

	isVoid() {

		return isNaN(this.min) || isNaN(this.max)

	}

	setAsVoid() {

		this.min = NaN;
		this.max = NaN;

		return this

	}

	copy(other) {

		this.min = other.min;
		this.max = other.max;

		return this

	}

	clone() {

		return new Range(this.min, this.max)

	}

	intersects(other, epsilon = 0) {

		// return !(other.max < this.min || other.min > this.max)
		return other.max - this.min >= -epsilon && other.min - this.max <= epsilon

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

	clamp(x, tolerance = 0) {

		return x < this.min - tolerance ? this.min - tolerance : x > this.max + tolerance ? this.max + tolerance : x

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

let now = typeof performance !== 'undefined' // web
	? performance.now.bind(performance)
	: typeof nativePerformanceNow !== 'undefined' // React
	? nativePerformanceNow
	: Date.now.bind(Date);

const readonlyProperties = (target, properties, options = {}) => {

	for (let [key, value] of Object.entries(properties))
		Object.defineProperty(target, key, Object.assign({ value }, options));

};



/**
 * returns an image of x where f(x) < limit
 * f(0) = 0
 * f(limit) = limit / 2
 * f(Infinity) = limit
 * f'(0) = 1
 * f'(limit) = 1/4 * limit
 * f'(Infinity) = 0
 */
const limit = (x, limit = 1, ratio = 1) => x * ratio * limit / (x * ratio + limit);



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

const rePercent = /%/;
const reSpaces = /\s/;
const reMode = /^[^\d-]/;

function parsePercent(value) {

	return parseFloat(value) * (rePercent.test(value) ? .01 : 1)

}

/**
 *
 * SpaceProperty
 *
 * Most of the lines are about parsing input values:
 *
 * x 			> new SpaceProperty().set(x, 1)
 * '100' 		> new SpaceProperty().set(100, 0)
 * '100%' 		> new SpaceProperty().set(0, 1)
 * '0 1' 		> new SpaceProperty().set(0, 1)
 * '50 50%' 	> new SpaceProperty().set(50, .5)
 * '50% 50%' 	> new SpaceProperty().set(.5, .5)
 * [x, y] 		> new SpaceProperty().set(x, y)
 *
 */
class SpaceProperty {

	static ensure(value) {

		if (value instanceof SpaceProperty)
			return value

		return new SpaceProperty().parse(value)

	}

	constructor(space) {

		Object.assign(this, {

			space,
			absolute: 0,
			relative: 0,
			mode: null,
			computeDelegate: null,

		});

	}

	set(absolute, relative = 0, mode = null) {

		if (this.space)
			this.space.setDirty();

		this.absolute = absolute;
		this.relative = relative;
		this.mode = mode;

		return this

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

	parse(...args) {

		if (args.length === 0)
			return this.set(0, 1, null)

		if (args.length === 1 && typeof args[0] === 'function') {

			this.computeDelegate = args[0];
			return this

		}

		if (args.length === 2)
			return this.set(parsePercent(args[0]), parsePercent(args[1]))

		if (args.length === 3)
			return this.set(parsePercent(args[0]), parsePercent(args[1]), args[2])

		let [value] = args;

		if (value instanceof Array)
			return this.set(parsePercent(value[0]), parsePercent(value[1]), value[2])

		switch(typeof value) {

			case 'number':

				return this.set(value, 0)

			case 'string':

				if (reMode.test(value))
					return this.set(0, 0, value)

				if (reSpaces.test(value))
					return this.set(...value.split(reSpaces).map(parsePercent))

				return rePercent.test(value)
					? this.set(0, parseFloat(value) / 100)
					: this.set(parseFloat(value), 0)

			default:

				return this.set(0, 0)

		}

	}

	destroy() {

		for (let k in this)
			delete this[k];

		return this

	}

	toString() {

		return this.mode
			? this.mode
			: this.absolute === 0 && this.relative === 0 ? '0'
			: this.relative === 0 ? this.absolute.toFixed(1)
			: this.absolute === 0 ? (this.relative * 100).toFixed(1) + '%'
			: this.absolute.toFixed(1) + ' ' + (this.relative * 100).toFixed(1) + '%'

	}

}

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




let spaceUID = 0;

class Space {

	constructor({ position = 0, width = '100%', align = '100%', order = 0, positionMode, widthMode, color = null } = {}) {

		readonlyProperties(this, {

			uid: spaceUID++,

		});

		Object.assign(this, {

			// dirty pattern:

			isDirty: true,
			rootUpdateCount: 0,
			onUpdate: [],
			updateApart: false,

			// design:

			positionMode: PositionMode[positionMode] || PositionMode.STACK,
			position: new SpaceProperty(this).parse(position),
			globalPosition: NaN,

			widthMode: WidthMode[widthMode] || WidthMode.FIXED,
			width: new SpaceProperty(this).parse(width),
			globalWidth: 0,

			order,
			align: new SpaceProperty(this).parse(align), // 100% = align left, 0% = center, -100% = align right

			// maths:

			range: new Range(0, 1),
			bounds: new Range(0, 0),

			// hierarchy:

			root: this,
			parent: null,
			children: [],

			// TODO: remove this
			// sortedChildren: [],

			childrenUniqueIdentifierCount: 0,
			childUniqueIdentifier: -1,

			// debug:

			color,

		});

	}

		destroy({ recursive = false } = {}) {

			if (recursive)
				for (let child of this.children)
					child.destroy({ recursive });

			this.bounds.setAsVoid();
			this.range.setAsVoid();
			this.position.destroy();
			this.width.destroy();
			this.align.destroy();
			this.onUpdate.length = 0;
			this.children.length = 0;
			this.root = null;
			this.parent = null;

		}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (child.parent)
			child.parent.removeChild(child);

		child.root = this.root;
		child.parent = this;
		child.childUniqueIdentifier = this.childrenUniqueIdentifierCount++;
		this.children.push(child);

		// NOTE should we avoid sorting? and prefer splice() to push() && sort()
		this.children.sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier);

		this.setDirty();

		return this

	}

	removeChild(child) {

		if (child.parent !== this)
			throw 'child argument is not a child of this'

		child.root = child;
		child.parent = null;
		child.childUniqueIdentifier = -1;
		this.children.splice(this.children.indexOf(child), 1);

		this.setDirty();

		return this

	}

	removeAll({ recursive = false } = {}) {

		for (let child of this.children) {

			if (recursive)
				child.removeAll({ recursive });

			child.root = child;
			child.parent = null;
			child.childUniqueIdentifier = -1;

		}

		this.children.length = 0;

		this.setDirty();

		return this

	}

	remove() {

		if (this.parent)
			this.parent.removeChild(this);

		return this

	}

	get isRoot() {

		return this.root === this

	}

	isParentOf(node) {

		while (node) {

			if (node.parent === this)
				return true

			node = node.parent;

		}

		return false

	}

	isChildOf(node) {

		return node.isParentOf(this)

	}





	// update:

	/**
	 * setDirty is lazy, parent recursive:
	 * parent recursive: when a space is set dirty, all his parent will become dirty too
	 * lazy: if the parent is already dirty, the parent recursive call is skipped
	 */
	setDirty() {

		this.isDirty = true;

		if (!this.updateApart && this.parent && !this.parent.isDirty)
			this.parent.setDirty();

		return this

	}

	get hasBeenUpdated() {

		return this.updatedAt === this.root.rootUpdateCount

	}

	rootUpdate(force = false) {

		this.rootUpdateCount++;

		if (force || this.isDirty) {

			// OPTIMIZE only dirty divisions should be updated
			this.updateWidth();
			this.updatePosition();

		}

	}

	getParentGlobalWidth() {

		let space = this.parent;

		while(space && space.widthMode.is.CONTENT)
			space = space.parent;

		// important if no fixed parent is found:
		// globalWidth is computed from root.width
		return space ? space.globalWidth : this.root.width.solve(0)

	}

	updateWidth() {

		// this.sortedChildren = this.children.concat().sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)

		if (this.widthMode.is.CONTENT) {

			// globalWidth is inherited from children (stacked ones only)
			this.globalWidth = 0;

			for (let child of this.children) {

				child.updateWidth();

				if (child.positionMode.is.STACK)
					this.globalWidth += child.globalWidth;

			}

			if (this.width.computeDelegate)
				this.globalWidth = this.width.computeDelegate(this, this.globalWidth);

		} else {

			// globalWidth is computed from parent
			this.globalWidth = this.width.solve(this.getParentGlobalWidth());

			if (this.width.computeDelegate)
				this.globalWidth = this.width.computeDelegate(this, this.globalWidth);

			for (let child of this.children)
				child.updateWidth();

		}

	}

	computePosition() {

		/*
			Global position must be relative to parent.range (and not parent.globalPosition)
			since range can be modified by align.
		*/

		return this.parent

			? this.parent.range.min + this.position.solve(this.parent.globalWidth)

			: this.position.solve(0)

	}

	updatePosition(stackOffset = 0) {

		if (this.positionMode.is.FREE) {

			this.globalPosition = this.computePosition();

			let alignOffset = this.align.solveAlign(this.globalWidth);
			this.range.min = this.globalPosition + alignOffset;
			this.range.max = this.globalPosition + alignOffset + this.globalWidth;

		} else {

			this.globalPosition = this.computePosition() + stackOffset;
			this.range.min = this.globalPosition;
			this.range.max = this.globalPosition + this.globalWidth;

		}

		this.bounds.copy(this.range);

		let childStackOffset = 0;

		for (let child of this.children) {

			child.updatePosition(childStackOffset);

			if (child.positionMode.is.STACK)
				childStackOffset += child.globalWidth;

			this.bounds.union(child.bounds);

		}

		this.isDirty = false;
		this.updatedAt = this.root.rootUpdateCount;

		for (let callback of this.onUpdate)
			callback();

	}

	walk(callback) {

		callback(this);

		for (let child of this.children)
			child.walk(callback);

		return this

	}

	contains(value) {

		return this.range.contains(value)

	}

	toString() {

		return `Space#${this.uid} {${this.positionMode} d:${this.depth}, p:${this.position.toString()}, w:${this.width.toString()} r:${this.range.toString(1)}, b:${this.bounds.toString(1)}}`

	}

}

class Variable {

	constructor({ length, value = 0 }) {

		this.length = length;
		this.sum = value * length;

		this.array = [];

		for (let i = 0; i < length; i++)
			this.array[i] = value;

		this.value = value;

	}

	setNewValue(value) {

		this.value = value;

		this.sum += -this.array.shift() + value;

		this.array.push(value);

	}

	get average() { return this.sum / this.length }

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

			deltaPosition: 0,
			hasMoved: false,
			positionOld: 0,
			velocityOld: 0,

			// target
			forcedPosition: NaN,
			// target: NaN,
			// computedFriction: .1,

			velocityVar: new Variable({ length: 5 }),

		});

	}

	update(dt = 1 / 60) {

		let { position, position:positionOld, velocity, velocity:velocityOld, friction } = this;

		if (!isNaN(this.forcedPosition)) {

			this.setPosition(this.forcedPosition);
			this.forcedPosition = NaN;

			position = this.position;
			velocity = this.velocity;

		} else {

			// integral
			position += friction === 1 ? velocity * dt : velocity * (friction ** dt - 1) / Math.log(friction);
			velocity *= friction ** dt;

		}

		let deltaPosition = position - positionOld;
		let hasMoved = deltaPosition !== 0;

		Object.assign(this, { position, positionOld, velocity, velocityOld, deltaPosition, hasMoved });

		this.velocityVar.setNewValue(velocity);

	}

	setFriction(value, dt = 1) {

		this.friction = value ** (1 / dt);

	}

	setPosition(value, { computeVelocity = true, dt = 1 / 60 } = {}) {

		let d = value - this.positionOld;
		this.position = value;
		this.velocity = d / dt;

	}

	/**
	 * F*** powerful, i can't remind how it works, but it works!
	 */
	getDestination({ position = this.position, velocity = this.velocity, friction = this.friction } = {}) {

		return position + -velocity / Math.log(friction)

	}

	getVelocityForDestination(destination, { position, friction } = this) {

		return (position - destination) * Math.log(friction)

	}

	getFrictionForDestination(destination, { position, velocity } = this) {

		return Math.exp(velocity / (position - destination))

	}

	get destination() { return this.getDestination() }
	set destination(value) { this.velocity = this.getVelocityForDestination(value); }

	shoot(destination, { friction = this.friction, log = false } = {}) {

		this.forcedPosition = NaN;

		let velocityBefore = this.velocity;

		this.friction = friction;
		this.velocity = this.getVelocityForDestination(destination);

		if (log)
			console.log(`Mobile.shoot: destination: ${destination.toFixed(1)}, velocity shift: ${(100 * this.velocity / velocityBefore).toFixed(1)}%`);

		return this

	}

}

const round = (x, precision) => Math.round(x / precision) * precision;
const clamp$1 = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x;

let HeadUID = 0;

class Head {

	constructor(timeline, { name = null } = {}) {

		Object.assign(this, {

			uid: HeadUID++,
			name: name || `head-${HeadUID}`,
			color: 'red',
			timeline,
			roundPosition: 0,
			positionRounding: 1 / 4,
			mobile: new Mobile(),

		});

		this.space = new Space({ positionMode: 'FREE', width: '100%' });
		this.space.updateApart = true; // important! head move should not trigger division update cycle
		this.timeline.rootDivision.space.addChild(this.space);

	}

	getIndex() {

		return this.timeline
			? this.timeline.heads.indexOf(this)
			: -1

	}

	get index() { return this.getIndex() }

	get position() { return this.mobile.position }
	set position(value) { this.mobile.position = value; }

	get destination() { return this.mobile.destination }
	set destination(value) { this.mobile.destination = value; }

	get forcedPosition() { return this.mobile.position }
	set forcedPosition(value) { this.mobile.forcedPosition = value; }

	update(force = false) {

		// super.update()
		this.mobile.update();

		this.hasBeenUpdated = false;

		let newRoundPosition = round(this.mobile.position, this.positionRounding);
		let roundPositionHasChanged = this.roundPosition !== newRoundPosition;
		this.roundPosition = newRoundPosition;

		if (force || roundPositionHasChanged) {

			this.hasBeenUpdated = true;

			this.spaceBoundsOld = this.space.bounds.clone();
			this.space.position.set(this.roundPosition, 0);
			this.space.rootUpdate();

		}

	}

	updateDivision(force = false) {

		if (force || this.hasBeenUpdated) {

			this.timeline.rootDivision.walk(division => {

				// NOTE optimization (done): only division whose bounds contain head position are updated
				if (force || division.space.bounds.intersects(this.space.bounds) || division.space.bounds.intersects(this.spaceBoundsOld))
					division.updateHead(this);

			});

		}

	}

	getDestinationApproximation(velocityBoostRatio = 1) {

		return this.mobile.getDestination({ velocity: this.mobile.velocityVar.average * velocityBoostRatio })

	}

	velocityCorrectionForNearest(selector = '*') {

		let mobileVelocityBefore = this.mobile.velocity;

		let position = this.getDestinationApproximation();

		let nearest = this.timeline.nearest({ position, selector });

		if (nearest)
			this.mobile.shoot(nearest.space.globalPosition, { log: false });

		this.velocityCorrection = this.mobile.velocity / mobileVelocityBefore;

	}

	clampVelocity(division, maxOverflow) {

		let min = division.space.range.min - maxOverflow;
		let max = division.space.range.max + maxOverflow;

		this.mobile.position = clamp$1(this.mobile.position, min, max);

		let destination = this.getDestinationApproximation();

		if (destination < min)
			this.mobile.shoot(min, { log: true });

		if (destination > max)
			this.mobile.shoot(max, { log: true });

	}

	reset(position = 0) {

		this.mobile.position = position;
		this.mobile.velocity = 0;

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.position.toFixed(1)} }`

	}

}

class DivisionProps {

	constructor(division, props) {

		Object.defineProperties(this, {

			isRoot: {

				enumerable: false,
				configurable: true,
				get() { return division.space.isRoot },

			},

			uid: {

				enumerable: false,
				configurable: true,
				get() { return division.uid },

			},

		});

		Object.assign(this, props);

	}

	set(props) {

		Object.assign(this, props);

	}

	toString() {

		let array = [];

		for (let [key, value] of Object.entries(this)) {

			let type = typeof value;

			if (value === true) {

				array.push(key);

			} else {

				if (type === 'string') {

					array.push(`${key}="${value}"`);

				} else if (type === 'object') {

					array.push(`${key}=${value.constructor.name}()`);

				} else {

					array.push(`${key}=${value}`);

				}

			}

		}

		return array.join(', ')

	}

}

// event: propagate to parent or timeline
const propagateTo = division => division instanceof Division && (division.parent || division.timeline);

let divisionMap = new WeakMap();
let divisionUID = 0;

class Division extends EventDispatcher {

	constructor(timeline, parent, spaceProps = null, props = null) {

		super();

		if (props && props.color)
			spaceProps.color = props.color;

		readonlyProperties(this, {

			uid: divisionUID++,
			space: new Space(spaceProps),
			props: new DivisionProps(this, props),
			localHeads: [],

		}, { enumerable: true, configurable: true });

		Object.assign(this, {

			timeline,

		});

		// TODO: remove this line (useless right?)
		// this.space.onUpdate.push(() => this.dispatchEvent('change'))

		// readonlyProperties(this.props, { uid: this.uid }, { enumerable: true, configurable: true })

		divisionMap.set(this.space, this);

		if (parent)
			parent.add(this);

	}

	destroy({ recursive = false } = {}) {

		if (recursive)
			for (let child of this.children)
				child.destroy({ recursive });

		this.space.destroy({ recursive: false });

		this.localHeads.length = 0;

		for (let k in this.props)
			delete this.props[k];

		divisionMap.delete(this.space);

		delete this.timeline;
		delete this.space;


	}





	// props:

	setProps(props) {

		this.props.set(props);

		return this

	}

	// convenient (and secured) methods:

	add(child) {

		if (this.timeline.shouldNotChange) {

			this.timeline.onNextLateUpdate.add(this.add, { thisArg: this, args: arguments });

			return this

		}

		if (Array.isArray(child)) {

			let children = child;

			for (let child of children)
				this.add(child);

		} else {

			if (!(child instanceof Division))
				child = this.timeline.division(child);

			this.space.addChild(child.space);

			// EVENT:
			child.dispatchEvent('add-child', { propagateTo });

		}

		return this

	}

	addTo(parent) {

		if (typeof parent === 'string')
			parent = this.timeline.query(parent);

		if (Array.isArray(parent))
			parent = parent[0];

		if (parent)
			parent.add(this);

		return this

	}

	remove() {

		// EVENT:
		this.dispatchEvent('remove-child', { propagateTo });

		this.space.remove();

		return this

	}

	removeAll(filter = null) {

		for (let division of this.children) {

			if (!filter || filter(division))
				division.remove();

		}

		return this

	}

	query(selector) {

		return query(this, selector)

	}

	division(division) {

		if (typeof division === 'string')
			return this.query(division)

		// division are props:

		division.parent = this;

		return this.timeline.division(division)

	}

	nearest({ position, selector = '*', distanceMax = Infinity } = {}) {

		let array = this.query(selector);

		if (!array.length)
			return null

		let division = null;
		let distance = distanceMax;
		let best = { division, distance };

		for (let i = 0; division = array[i]; i++) {

			distance = Math.abs(division.space.globalPosition - position);

			if (distance <= best.distance)
				best = { division, distance };

		}

		return best.division

	}

	getHeadValues(headIndex = 0) {

		return this.localHeads[headIndex]

	}

	updateHead(head = null, { extraEvent = null, forcedEvent = null } = {}) {

		if (head === null) {

<<<<<<< HEAD
			if (this.timeline) {

				for (let head of this.timeline.heads) {
=======
			if (this.division) {

				for (let head of this.division.heads) {
>>>>>>> 37579c8f84e4c15906477c78c9e9e57cc185db5f

					this.updateHead(head, { extraEvent, forcedEvent });

				}

			}

			return this

		}

		let headValue = head.roundPosition;
		let headIndex = head.getIndex();
		let relative = this.space.range.ratio(headValue);

		// handle the 0 / 0 case (0 / range.width)
		if (isNaN(relative))
			relative = 1;

		let contained = this.space.range.contains(headValue);
		let overlap = head.space.range.intersects(this.space.range);

		let globalClamp = this.space.range.clamp(headValue);
		let relativeClamp = relative < 0 ? 0 : relative > 1 ? 1 : relative;

		let newValues = {

			head,
			headIndex,
			contained,
			overlap,
			global: headValue,
			globalClamp,
			absolute: headValue - this.space.range.min,
			absoluteClamp: globalClamp - this.space.range.min,
			relative,
			relativeClamp,

		};

		let oldValues = this.localHeads[headIndex] || {

			head: null,
			headIndex: -1,
			contained: false,
			overlap: false,
			global: NaN,
			globalClamp: NaN,
			absolute: NaN,
			absoluteClamp: NaN,
			relative: NaN,
			relativeClamp: NaN,

		};

		this.localHeads[headIndex] = newValues;

		let old_r = 		oldValues.relative;
		let new_r = 		newValues.relative;
		let direction = 	old_r < new_r ? 1 : -1;

		// flags:

		let init = isNaN(oldValues.global);

		let wasInside = 	old_r >= 0 && old_r <= 1;
		let isInside = 		new_r >= 0 && new_r <= 1;

		let enter = 		!wasInside && isInside;
		let exit = 			wasInside && !isInside;
		let overlapEnter = 	overlap && !oldValues.overlap;
		let overlapExit = 	!overlap && oldValues.overlap;

		let pass = 			old_r <= 1 && new_r > 1 ||
							old_r >= 0 && new_r < 0;

		let progress = 		isInside || pass;

		if (forcedEvent) {

			forcedEvent = Array.isArray(forcedEvent) ? forcedEvent : forcedEvent.split(/\s/);

			for (let event of forcedEvent) {

				init = init || event === 'init';
				enter = enter || event === 'enter';
				exit = exit || event === 'exit';
				pass = pass || event === 'pass';
				progress = progress || event === 'progress';
				overlap = overlap || event === 'overlap';
				overlapEnter = overlapEnter || event === 'overlapEnter';
				overlapExit = overlapExit || event === 'overlapExit';

			}

		}

		let eventData = { progress:relativeClamp, direction, values:newValues, oldValues, range:this.space.range };

		if (init)
			this.dispatchEvent(`init-${head.name}`, eventData);

		if (enter)
			this.dispatchEvent(`enter-${head.name}`, eventData);

		if (exit)
			this.dispatchEvent(`exit-${head.name}`, eventData);

		if (progress)
			this.dispatchEvent(`progress-${head.name}`, eventData);

		if (pass)
			this.dispatchEvent(`pass-${head.name}`, eventData);

		if (overlap)
			this.dispatchEvent(`overlapProgress-${head.name}`, eventData);

		if (overlapEnter)
			this.dispatchEvent(`overlapEnter-${head.name}`, eventData);

		if (overlapExit)
			this.dispatchEvent(`overlapExit-${head.name}`, eventData);

		if (extraEvent)
			this.dispatchEvent(`${extraEvent}-${head.name}`, eventData);

		return this

	}

	// traps:

	get root() { return this.space.root && divisionMap.get(this.space.root) }
	get isRoot() { return this.space.isRoot }
	get parent() { return this.space.parent && divisionMap.get(this.space.parent) }

	get children() {

		// OPTIMIZE : the result could be cached, since the children array does not change frequently,
		// kind of a mess: it's quite complicated to use the dirty flag outside Space

		let array = [];

		for (let child of this.space.children) {

			let division = divisionMap.get(child);

			if (division)
				array.push(division);

		}

		return array

	}

	isParentOf(division) { return this.space.isParentOf(division.space) }
	isChildOf(division) { return this.space.isChildOf(division.space) }

	contains(value) { return this.space.contains(value) }

	get position() { return this.space.globalPosition }
	get min() { return this.space.range.min }
	get max() { return this.space.range.max }
	get width() { return this.space.range.width }

	get boundsMin() { return this.space.bounds.min }
	get boundsMax() { return this.space.bounds.max }
	get boundsWidth() { return this.space.bounds.width }

	//

	set width(value) { this.space.width.parse(value); }

	walk(callback) {

		this.space.walk(space => {

			let division = divisionMap.get(space);

			if (division)
				callback(division);

		});

		return this

	}

	// utils

	/**
	 * Very useful function to smoothly clamp head inside a division (allowing some controlled overflow).
	 */
	getLimitedValue(value, maxOverflow = 300) {

		if (value < this.space.range.min)
			return this.space.range.min - limit(this.space.range.min - value, maxOverflow)

		if (value > this.space.range.max)
			return this.space.range.max + limit(value - this.space.range.max, maxOverflow)

		return value

	}

	/**
	 * Very useful function to smoothly bring back head instance into the division bounds.
	 * This function should be called in runtime loop.
	 */
	bringBackHeadInside({ head = this.timeline.head, ease = .25, friction = .001 } = {}) {

		let { range } = this.space;
		let { mobile } = head;

		if (!range.contains(mobile.position)) {

			mobile.velocity *= friction ** (1 / 60);

			if (mobile.position < range.min)
				mobile.position += (range.min - mobile.position) * ease;

			if (mobile.position > range.max)
				mobile.position += (range.max - mobile.position) * ease;

		}

	}





	toString() {

		let r = `[${this.space.range.min.toFixed(1)}, ${this.space.range.max.toFixed(1)}]`;
		let b = `[${this.space.bounds.min.toFixed(1)}, ${this.space.bounds.max.toFixed(1)}]`;

		return `Division#${this.uid} { ${this.props.toString()}, r: ${r}, b: ${b} }`

	}

	toGraphString() {

		let array = [];

		array.push('root');

		this.walk(division => {

			let body = `division#${division.uid} [${division.props.toString()}]`;

			let hier = division.children.length ? '┬' : '─';

			let str = '  '.repeat(division.space.depth) + hier + ' ' + body;

			array.push(str);

		});

		return array.join('\n')

	}

}

let timelines = [];
let timelineUID = 0;

class Variable$1 {

	constructor(length = 30) {

		let array = [];

		for (let i = 0; i < length; i++)
			array[i] = 0;

		Object.assign(this, {
			array,
			length,
			sum: 0,
		});

		Object.defineProperties(this, {
			average: {
				enumerable: true,
				get: () => this.sum / this.length
			}
		});

	}

	add(value) {

		this.array.push(value);
		this.sum += -this.array.shift() + value;

		return this

	}

}

class Timeline extends EventDispatcher {

	constructor(rootWidth = 1) {

		super();

		readonlyProperties(this, {

			uid: timelineUID++,
			rootDivision: this.createDivision(null, { width: rootWidth,
				widthMode: 'CONTENT',
			}),
			heads: [],
			updateCost: new Variable$1(30),

		});

		Object.assign(this, {

			enabled: true,
			updateDuration: 2000,
			updateCount: 0,

			onUpdate: new Stack(),
			onNextUpdate: new Stack(),
			onLateUpdate: new Stack(),
			onNextLateUpdate: new Stack(),

		});

		this.newHead('main');

		timelines.push(this);

	}

	destroy() {

		if (this.shouldNotChange) {

			onNextLateUpdate.add(this.destroy, { thisArg: this });

			return this

		}

		this.rootDivision.destroy({ recursive: true });
		this.enabled = false;
		this.destroyed = true;

		let index = timelines.indexOf(this);
		timelines.splice(index, 1);

		this.dispatchEvent('destroy');

		return this

	}

	newHead(name = null) {

		this.heads.push(new Head(this, { name }));

	}

	get head() { return this.heads[0] }

	update(force = false) {

		let t = now();

		this.onUpdate.execute();
		this.onNextUpdate.dump();

		this.shouldNotChange = true;

		for (let head of this.heads)
			head.update();

		this.rootDivision.space.rootUpdate(force);

		for (let head of this.heads)
			head.updateDivision(force || this.rootDivision.space.hasBeenUpdated);

		let dt = now() - t;

		this.updateCost.add(dt);

		let divisionsHaveBeenUpdated = this.rootDivision.children.some(division => division.space.hasBeenUpdated);
		let headsHaveBeenUpdated = this.heads.some(head => head.hasBeenUpdated);

		if (divisionsHaveBeenUpdated)
			this.dispatchEvent('division-update');

		if (headsHaveBeenUpdated)
			this.dispatchEvent('head-update');

		if (divisionsHaveBeenUpdated || headsHaveBeenUpdated)
			this.lastUpdateTime = t;

		if (t - this.lastUpdateTime < this.updateDuration)
			this.dispatchEvent('update');

		this.dispatchEvent('frame');

		this.onLateUpdate.execute();
		this.onNextLateUpdate.dump();

		this.shouldNotChange = false;
		this.updateCount++;

	}

	dispatchHeadEvent({ extraEvent = null, forcedEvent = null } = {}) {

		if (this.updateCount === 0 || !this.enabled) {

			this.onNextLateUpdate.add(this.dispatchHeadEvent, { thisArg: this, args: arguments });

			return this

		}

		this.rootDivision.walk(division => {

			for (let head of this.heads)
				division.updateHead(head, { extraEvent, forcedEvent });

		});

		return this

	}

	createDivision(parent = this.rootDivision, spaceProps, props = null) {

		let division = new Division(this, parent, spaceProps, props);

		// this.lastDivision = division

		return division

	}

	// shorthands

	get rootWidth() { return this.rootDivision.space.width.absolute }
	set rootWidth(value) {

		if (this.rootDivision.space.width.absolute !== value)
			this.rootDivision.space.setDirty().width.absolute = value;

	}

	query(selector) { return this.rootDivision.query(selector) }

	nearest({ position, selector = '*', distanceMax = Infinity } = {}) {

		if (position === undefined)
			position = this.head.position;

		return this.rootDivision.nearest({ position, selector, distanceMax })

	}

	division({ parent = null, position = 0, width = '100%', align = '100%', order = 0, widthMode, positionMode }) {

		if (typeof arguments[0] === 'string') // it's a query!
			return this.query(arguments[0])

		if (Array.isArray(arguments[0])) // it's multiple
			return [...arguments[0]].map(props => this.division(props))

		let props = copy(arguments[0], { recursive: false, exclude: 'parent, position, width, align, order, positionMode, widthMode' });

		if (typeof parent === 'string')
			parent = this.query(parent);

		if (Array.isArray(parent))
			parent = parent[0];

		// if (!parent)
		// 	parent = this.currentDivision

		if (!parent)
			parent = this.rootDivision;

		return this.createDivision(parent, { position, width, align, order, positionMode, widthMode }, props)

		return null

	}

	add(params = {}) {

		params.parent = this.rootDivision;

		this.division(params);

		return this

	}

}

class Stack {

	constructor() {

		this.array = [];
		this.next = [];
		this.count = 0;

	}

	add(callback, { thisArg = null, args = null  } = {}) {

		if (!callback)
			return

		this.next.push({ callback, thisArg, args });
		this.count++;

	}

	remove(callback, { thisArg = null, args = null  } = {}) {

		// TODO: implement or use another Stack definition

	}

	execute() {

		let { array, next } = this;

		array.push(...next);
		next.length = 0;

		for (let i = 0, n = array.length; i < n; i++) {

			let { callback, thisArg, args } = array[i];

			if (callback.apply(thisArg, args) === false) {

				array.splice(i, 1);
				i--;
				n--;
				this.count--;

			}

		}

	}

	dump() {

		let { array, next } = this;

		array.push(...next);
		next.length = 0;

		for (let { callback, thisArg, args } of array)
			callback.apply(thisArg, args);

		array.length = 0;
		this.count = 0;

	}

}

let onUpdate = new Stack();
let onNextUpdate = new Stack();

let onLateUpdate = new Stack();
let onNextLateUpdate = new Stack();

function update() {

	if (typeof requestAnimationFrame === 'undefined')
		throw 'requestAnimationFrame is not available, cannot run'

	requestAnimationFrame(update);

	onUpdate.execute();
	onNextUpdate.dump();

	for (let timeline of timelines)
		if (timeline.enabled)
			timeline.update();

	onLateUpdate.execute();
	onNextLateUpdate.dump();

}

update();

export { Timeline, onUpdate, onNextUpdate, onLateUpdate, onNextLateUpdate };
