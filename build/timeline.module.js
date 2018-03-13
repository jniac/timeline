/* 2018-03-13 */
/* exprimental stuff from https://github.com/jniac/timeline */
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

	clamp(x) {

		return x < this.min ? this.min : x > this.max ? this.max : x

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
			position += velocity * (friction ** dt - 1) / Math.log(friction);
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

	shoot(destination) {

		this.velocity = this.getVelocityForDestination(destination);

		return this

	}

}








const round = (x, precision) => Math.round(x / precision) * precision;

/**
 * Extends Mobile to add Timeline integration.
 */

class Head extends Mobile {

	constructor(timeline) {

		super();

		this.color = 'red';
		this.timeline = timeline;

		this.roundPosition = this.position;
		this.positionRounding = .1;

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
		// this.setPosition(value)

	}

	update(force = false) {

		super.update();

		this.hasBeenUpdated = false;

		let newRoundPosition = round(this.position, this.positionRounding);
		let roundPositionHasChanged = this.roundPosition !== newRoundPosition;
		this.roundPosition = newRoundPosition;

		if (roundPositionHasChanged || force || this.forceUpdate) {

			this.forceUpdate = false;

			this.hasBeenUpdated = true;

			let index = this.getIndex();
			
			// this.timeline.rootDivision.walk(division => division.updateHead(index, this.position))
			this.timeline.rootDivision.walk(division => division.updateHead(index, this.roundPosition));

		}

	}

	velocityCorrectionForNearest(selector) {

		this.forcedPosition = NaN;

		let velocityBefore = this.velocity;

		let destination = this.getDestination({ velocity: this.velocityVar.average });

		let nearest = this.timeline.nearest(destination, selector);

		if (nearest)
			this.shoot(nearest.space.globalPosition);

		this.velocityCorrection = this.velocity / velocityBefore;

		// console.log('velocity shift:', (100 * this.velocityCorrection).toFixed(1) + '%')

	}

	toString() {

		return `Head{ index: ${this.index}, value: ${this.value.toFixed(1)} }`

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
 * x 			> new Double(x, 1)
 * '100' 		> new Double(100, 0)
 * '100%' 		> new Double(0, 1)
 * '0 1' 		> new Double(0, 1)
 * '50 50%' 	> new Double(50, .5)
 * '50% 50%' 	> new Double(.5, .5)
 * [x, y] 		> new Double(x, y)
 * 
 */
class SpaceProperty {

	static ensure(value) {

		if (value instanceof SpaceProperty)
			return value

		return new SpaceProperty().parse(value)

	}

	constructor(space) {

		this.space = space;

	}

	set(absolute, relative, mode = null) {

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
			onUpdate: [],

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
			sortedChildren: [],

			childrenUniqueIdentifierCount: 0,
			childUniqueIdentifier: -1,

			// debug:

			color,

		});

	}

	setDirty() {

		this.isDirty = true;

		if (this.root)
			this.root.isDirty = true;

		return this

	}

	get depth() { return this.parent ? this.parent.depth + 1 : 0 }

	addChild(child) {

		if (child.parent)
			child.parent.removeChild(child);

		child.root = this.root;
		child.parent = this;
		child.childUniqueIdentifier = this.childrenUniqueIdentifierCount++;
		this.children.push(child);

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

	removeAll() {

		for (let child of this.children) {

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

	update() {

		this.hasBeenUpdated = false;

		if (this.isDirty) {

			this.updateWidth();
			this.updatePosition();

			this.hasBeenUpdated = true;

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

		} else {

			// globalWidth is computed from parent
			this.globalWidth = this.width.solve(this.getParentGlobalWidth());

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

			isRoot: {

				enumerable: true,
				get() { return division.space.isRoot },

			},

		});

	}

	set(props) {

		Object.assign(this, props);

	}

}

class Division extends EventDispatcher {

	constructor(timeline, parent, spaceProps = null, props = null) {

		super();

		if (props && props.color)
			spaceProps.color = props.color;

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

		this.space.onUpdate.push(() => this.dispatchEvent('change'));

		readonlyProperties(this.props, { uid: this.uid }, { enumerable: true });

		divisionMap.set(this.space, this);

		if (parent)
			parent.space.addChild(this.space);

	}





	// props:

	setProps(props) {

		this.props.set(props);

		return this

	}

	// convenient methods:

	add(child) {

		if (Array.isArray(child)) {

			for (let child2 of child)
				this.space.addChild(child2.space);

		} else {

			if (!(child instanceof Division))
				child = this.timeline.division(child);

			this.space.addChild(child.space);

		}

		return this

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

	division(propsOrQuery) {

		if (typeof propsOrQuery === 'string')
			return this.query(propsOrQuery)

		// propsOrQuery are props:

		let division = this.timeline.division(propsOrQuery);

		this.space.addChild(division.space);

		return division

	}

	nearest(position, selector = '*') {

		let array = this.query(selector);

		if (!array.length)
			return null

		let distance = Math.abs(array[0].space.globalPosition - position);
		let best = { division: array[0], distance };

		for (let i = 1, division; division = array[i]; i++) {

			distance = Math.abs(division.space.globalPosition - position);

			if (distance < best.distance)
				best = { division, distance };

		}

		return best.division

	}

	// updateSpace(force = false) {

	// 	this.space.update()

	// }

	updateHead(index, headValue) {

		let relative = this.space.range.ratio(headValue);

		// handle the 0 / 0 case (0 / range.width)
		if (isNaN(relative))
			relative = 1;

		let contained = this.space.range.contains(headValue);
		let globalClamp = this.space.range.clamp(headValue);
		let relativeClamp = relative < 0 ? 0 : relative > 1 ? 1 : relative;

		let newValues = { index, contained, global: headValue, globalClamp, absolute: headValue - this.space.range.min, absoluteClamp: globalClamp - this.space.range.min, relative, relativeClamp };
		let oldValues = this.heads[index] || { index: -1, contained: false, global: NaN, globalClamp: NaN, absolute: NaN, absoluteClamp: NaN, relative: NaN, relativeClamp: NaN };

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
	
	get root() { return this.space.root && divisionMap.get(this.space.root) }
	get isRoot() { return this.space.isRoot }
	get parent() { return this.space.parent && divisionMap.get(this.space.parent) }
	get children() { return this.space.children && this.space.children.map(v => divisionMap.get(v)) }
	isParentOf(division) { return this.space.isParentOf(division.space) }
	isChildOf(division) { return this.space.isChildOf(division.space) }

	contains(value) { return this.space.contains(value) }
	
	get min() { return this.space.range.min }
	get max() { return this.space.range.max }
	get width() { return this.space.range.width }

	get boundsMin() { return this.space.bounds.min }
	get boundsMax() { return this.space.bounds.max }
	get boundsWidth() { return this.space.bounds.width }

	//

	set width(value) { this.space.width.parse(value); }

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

		this.rootDivision.space.update();
		// this.rootDivision.updateSpace()

		for (let head of this.heads)
			head.update();

		let dt = now() - t;

		this.updateCost.add(dt);

		if (this.rootDivision.space.hasBeenUpdated || this.heads.some(head => head.hasBeenUpdated))
			this.dispatchEvent('update');

	}

	createDivision(parent = this.rootDivision, spaceProps, props = null) {

		let division = new Division(this, parent, spaceProps, props);

		this.lastDivision = division;

		return division

	}

	// shorthands

	get rootWidth() { return this.rootDivision.space.width.absolute }
	set rootWidth(value) { this.rootDivision.space.setDirty().width.absolute = value; }

	query(selector) { return this.rootDivision.query(selector) }

	nearest(...args) { return this.rootDivision.nearest(...args)}

	division({ parent = null, position = 0, width = '100%', align = '100%', order = 0, widthMode, positionMode }) {

		if (typeof arguments[0] === 'string') // it's a query!
			return this.query(arguments[0])

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
