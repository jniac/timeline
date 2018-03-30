
# Fri Mar 30 2018

### Stack! (to fix a major bug, cf below)
Major feature: added light Stack class,  
~~2 stacks instances:~~
4 stacks instances (`Late` suffix is coming from Unity)
- `onUpdate` every callback added to the stack will be execute every frame **before** the timeline updates (until the callback returns false)
- `onNextUpdate` the callback will be executed once **before** the timeline updates(at the beginning of the next frame)
- `onLateUpdate` every callback added to the stack will be execute every frame **after** the timeline updates (until the callback returns false)
- `onNextLateUpdate` the callback will be executed once **after** the timeline updates (at the beginning of the next frame)

those 4 stacks exist globally and locally (by Timeline instance)
```javascript
import { onUpdate, onNextUpdate } from './timeline.js'

onNextUpdate.add(myCallback, { thisArg, args })
```
Current internal usage (3):

- `onNextLateUpdate (global)` timeline.destroy: `timeline.destroy()` was previously using its own array, now is using onNextUpdate
```javascript
    ...
    dispatchHeadEvent({ extraEvent = null, forcedEvent = null } = {}) {

        if (this.updateCount === 0) {

            onNextLateUpdate.add(this.dispatchEvent, { thisArg: this, args: arguments })

            return this

        }
        ...
```

- `onNextLateUpdate (local)` [Division].add(): to avoid adding child during an update loop
```javascript
    ...
    add(child) {

        if (this.timeline.shouldNotChange) {

            this.timeline.onNextLateUpdate.add(this.add, { thisArg: this, args: arguments })

            return this

        }
        ...
```

- `onNextLateUpdate (local)` timeline.dispatchHeadEvent: to avoid any call before the first `Space` update loop
```javascript
...
    dispatchHeadEvent({ extraEvent = null, forcedEvent = null } = {}) {

        if (this.updateCount === 0) {

            onNextLateUpdate.add(this.dispatchEvent, { thisArg: this, args: arguments })

            return this

        }
        ...
```


# WARN: SHOULD-NOT-CHANGE!!!!
### fix a f*** annoying bug
I should know it.  
Changing something inside an update loop is *DANGEROUS*! And should be avoided.  
To do that timeline has now a flag: `shouldNotChange`  
And according to the flag, some operations may be delayed, this is the case for `[Division].add(...)`:  
```javascript
export class Division extends eventjs.EventDispatcher {
    ...
    add(child) {

        if (this.timeline.shouldNotChange) {

            onNextUpdate.add(this.add, { thisArg: this, args: arguments })

            return this

        }

        ...
    }
    ...
}
```
**Reminder** some other operations may be concerned!




### timeline.destroy()! [changed, cf *Stack!* above]
now Timeline can be destroyed (for performance, memory consideration)  
as seen below, the timeline is not destroyed immediately but at the next frame (to be sure not currently being inside a nested timeline.update call)

```javascript
class Timeline {

    ...

    destroy() {

        toBeDestroyed.push(this)

        return this

    }

    ...

}

...

for (let timeline of toBeDestroyed) {

    timeline.rootDivision.destroy({ recursive: true })
    timeline.enabled = false
    timeline.destroyed = true

    let index = timelines.indexOf(timeline)
    timelines.splice(index, 1)

}
```

### `[Space].removeAll({ recursive = false } = {})`
now `Space` instances can be cleared recursively (e.g. to destroy timeline)

# Wed Mar 28 2018

### timeline.add(divisionParams)
like `division.add()` (returning itself), `timeline.add(divisionParams)` return timeline, this allows concise declaration, eg:
```javascript
timeline
    .add({ name:'first', width: '50%' })
    .add({ name:'second', width: '50%' })
```

### forcedEvent vs extraEvent
```javascript
timeline.dispatchHeadEvent({ extraEvent, forcedEvent })
```
allows to dispatch events outside internal update loop:  

2 ways:  
- `timeline.dispatchHeadEvent({ extraEvent: 'foo' })` to dispatch an extra 'foo' event (that could never be fired internally, if the event already exists (eg: `progress`), it may be fired twice (first in the internal process, second as an extra event))
- `timeline.dispatchHeadEvent({ forcedEvent: 'progress' })` to dispatch a 'progress' event (if that event is normally triggered, it won't be fired twice)

**Reminder**  
Current events are:
- `init`
- `enter`
- `exit`
- `pass`
- `progress`
- `overlap`

Forced event can be multiple:
```javascript
timeline.dispatchHeadEvent({ forcedEvent: ['progress', 'init'] })
// ===
timeline.dispatchHeadEvent({ forcedEvent: 'progress init' })
```



# Mon Mar 19 2018

### SpaceProperty has delegate!
`SpaceProperty` can now define a function to compute the value.
```javascript
let margin = 100
timeline.division({ positionMode: 'FREE', position: margin, width: space => space.parent.globalWidth - 2 * margin })
```
So `SpaceProperty`instance are no more restricted to a combination of absolute and relative parts.  
This is a lot more permissive. And it will fix the problem of width computation of none-stacked divisions (should the relative part refer to the direct parent (the one that is dependent from stacked chilren, or to parent, the 2 options are meaningfull, instead of choose right now a suffix for relative part referring to direct parent or fixed parent, it's more wise to allow delegate for calculations, if an usage seems to ermerge it will be time then to find a suffix (eg: `em, rem, %, vw, vh etc.`))).

NOTE: positionMode && widthMode seem superfluous, the mode (a enum key, a string once serialized) should probably hold by SpaceProperty.  
It will allow a more concise definition of property: `timeline.division({ position: 'FREE 100%' })` or, using a delegate, `timeline.division({ width: ['CONTENT', space })`

# Thu Mar 14 2018

*Major changes:*  
The new paradigm is quite cool, seems very powerful, but we have to be careful with side effects.  
The *spacialized head* paradigm can solve the old problem of margin (for proximity detection),  

As very often, the new paradigm was harder too implement than imagined: The Reminder below suggests to use counter to compute hasBeenUpdated, this is no more a suggestion, and has been implemented since we can not do without that flag.  
Head's Space are updated separately, via `[Head].update()` which invoke `[Space].rootUpdate()`.

NB: `[Space].rootUpdate()` has been renamed `[Space].rootUpdate()`.

### Head is spacialized!
consequence: Division.get[children]() now need to filter children between Division and other (Head), may need an optimization there (see Reminder below)  

**New Event:** *overlap*  
Let's enter the overlap event! Fired when the head range intersects the current space range (`head.space.range.intersects(division.space.range)`).
~~The overlap flag is also used to trigger the progress event.~~ (not anymore, not good design)

- **[Reminder] Head**  
Space has currently 2 update flags:  
**isDirty** and **hasBeenUpdated** (the first to internal use, the second for external use in a loop)  
but for external use not in a loop, we miss an option / flag, for kind of lazy methods, eg:  
Division.get[children]() may need that kind of flag, if the space instance has changed since the last call, then compute the new array, otherwise skip computation and use the current array.  
**WARN** that flag / option should be a number: the time of the last update, given in frames, so a frame number should be propagated from timeline to divisions/heads to spaces
**WARN** if the option seems to make sense (flag for lazy updates), be aware that implementation will result in a more complex design, is it worth it? [Yes it is, see above]

### isDirty
setDirty is lazy, parent recursive:  
- parent recursive: when a space is set dirty, all his parent will become dirty too
- lazy: if the parent is already dirty, the parent recursive call is skipped



# Thu Mar 08 2018
### flexibility

&#35;3b `[Division].division({ ...props } or "query")` Division.division() gives the opportunity of any Division to return a new division from props, or a fetched division from query string.

&#35;3a `[Timeline].division("query")` if the first arg is a string, then Timeline.division("query") is returning the result of Timeline.query("query")

&#35;2 `[Division].width`
- `get`: return division.space.range.width
- `set`: trap for division.space.width.parse(value)

&#35;1 `[Division].add({ ...props })` Division.add() can now accept props for a brand new division (no longer need to start from the timeline instance)



# Mon Mar 05 2018
### isDirty implementation
`Space` implements now isDirty design.
`Space` has a flag `isDirty`, that determine if Space should update or not.
`ResolveSpace` has been renamed `update`.
`Double` is no more used, `SpaceProperty` is prefered. SpaceProperty can switch the dirty flag.  

Now timeline will dispatch `update` events only if:
- The tree has changed (some spaces props, width/position/align or hierarchy parent/children has changed)
- One head has moved (at least one).



# Tue Feb 20 2018
### Added highlight() to TimelineCanvas (Debug)
Added hierarchy test (isParentOf, isChildOf) to `Space`.
```javascript
timelineCanvas.highlight(divisionOrSelector, options)
```
```javascript
options = {
    activeColor: 'red',     // the highlight color
    greyedColor: '#ddd',    // the greyed color
    branch: true,  // should the whole branch holding the highlighted be highlighted w activeColor?
}
```

### Working Proof of concept
The result is ambiguous, the tool is powerful, but the syntax is still quite complicated:
```javascript
timeline.division({
    circle,
    positionMode: 'FREE',
    position: (100 * index / (n - 1)) + '%',    // 0%, 33.3%, 66.6%, 100%
    width: [-10, (100 / (n - 1)) + '%'],        // 33.3% - 10, hard to decipher right?
    align: '0%',
    page: true,
})
    .addTo('svgWrapper')
    .on(/enter/, event => {

        event.target.props.circle.r.baseVal.value = 16

    })
    .on(/exit/, event => {

        event.target.props.circle.r.baseVal.value = 8

    })
```

# Mon Feb 19 2018
**removed sortedChildren!**<br>
Too hard to maintain (sortedChildren is empty before the first resolveSpace() call). `childUniqueIdentifier` is preserved. `children` is sorted on each addChild call. So Division.query() will return Division instances in the same order as Spaces instances.

[begin to implement `Space` queries based on range (overlaping, nearest)]

# Sun Feb 18 2018
**added sortedChildren & childUniqueIdentifier properties to `Space`**  <br/>
Important! Since a property (`space.order`) is dedicated to the order in which each child will be computed, since `Array.sort()` [is not stable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort), space.children is cloned first (`array.concat()`) and sorted using `childUniqueIdentifier` to guarantee determinism :
```javascript
this.sortedChildren = this.children.concat().sort((a, b) => a.order - b.order || a.childUniqueIdentifier - b.childUniqueIdentifier)
```
So, if 2 children have the same order, they will be ordered according to their order of arrival.


# Fri Feb 16 2018

- **Head**  
Should head avatars, currently declared in `Division`, allow to modify head position directly (from absolute/relative property)? Overkill?  
Example:
```javascript
division.heads[0].position.relative += .01
```

- **Flex**
What about a flex layout?  
Children can get portions of available size from their associated weight.

---

**TimelineCanvas**  
Added arrow to figure children contribution to parent width.

**Mth.js**  
Good name for a Math lib ?  
(have to found a quite-definitive solution for math functions)

**SpaceProperty**  
`Double` should not be declared in `primitives.js`, `Double` is not as generic as `Range`. `Range` is like `Point`, it could be used in many different cases, for different usages. That's why `timeline.space-property.js`has been created. However, while re-writing `Double` in `SpaceProperty` i was asking myself if `SpaceProperty` should allow other declaration than the couple `absolute/relative`. I started to add `mode`, which could be used in that way: `position: 'free:10 50%', width: 'content'`. I can not decide if it's a good or bad idea.  
Good idea: it will allow more concise declaration (`free: 10 50%`).  
Bad idea: does it really make sense to associate any numeric property to a string? Can a large amount of properties be concerned? beyond position & width?  
(to be continued)

---

### Totally rewritten Space width/position calculations
Way way way more logic. Now, there are two recursive functions, to compute width first, then position.  
Still not totally convinced, by the current architecture. It's better though.

**Added 'root' to Space instances**  
Trivial implementation (`child.root = this.root` in `addChild()`). Great opportunity.

---

- Should `Division` inherits from `Space` instead of having a member `space:Space` ?
- Should `Timeline` inherits from `Division` which whould inherits from `Space` ? (easier integration of timeline)

# Tue Feb 15 2018

**Renamed Section to 'Division':**  
The sense of *division* is more neutral than *section*, refers to more simple objects.  
Section term will be reserved to portions of timeline (`Division` instances) that have to 'hold' `Head` instances when the timeline is being altered (because of element resizing or removing).`

---

### Added physics to Head
`position`, `velocity`, `friction` simulate the movement of a Mobile.
```javascript
// integrals for accurate position updates:
position += velocity * (friction ** dt - 1) / Math.log(friction)

// key feature: anticipate destination with
destination = position + -velocity / Math.log(friction)

// easy move
head.shoot(destination)
```


---

**Renamed inside event to 'progress':**  
inside is not as meaningfull as progress
```javascript
section.on(/progress/, event => myDiv.style.opacity = event.progress)
```

**Renamed leave event to 'pass':**  
'leave' introduces the idea of being inside before leaving, 'pass' is more generic  
The leave/pass event is fired when leaving a section as well as passing over the section. Usage: before that section that variable should be in that state, after in that other state, example:
```javascript
section.on(/pass/, event => myState.myVar = event.direction === 1 ? 'beyond' : 'below')
```

---

- **[Reminder] Head**  
`Head` instances must be 'clipped' to relevant `Section` (in order to resize parent section (responsive) or remove preceding section without having `Head` instances jumping or sliding through current section, (global position should be as meaningless as possible))

- **[Info] Section vs. Space**  
Currently `Section` is built on top of `Space`. `Section` is the operative part of `Timeline`, and `Space` is the mathematic / logic part. `Space` holds range values, hierachy (parent/children). `Section` fires events and `Head` computed values.

- What about `Division` for renaming as well `Space` as `Section` ?

- Should root Space automatically be seen as expandable (ExpandEnum.EXPAND)?  
...in order to allow simpler timeline agregation later.


# Wed Feb 14 2018

### Space: changed children disposition  
Introducing `ExpandEnum(FIXED, EXPAND)`.  
Now, inside a `Space(expand===ExpandEnum.EXPAND)` children can be stacked (as div in a page).  
This implies that parent Space can now **inherit size** from children.  
Such parent cannot be referent to children relative dimensions. So to compute relative dimensions, `resolveSpace()` now searches for a fixed parent via `getFixedParent`.


# Fri Feb 9 2018

### Goals:

Implement an hyper flexible Timeline object, featuring:
- **Responsiveness (layout acceptation):**  
Dimensions of any section of the timeline should be resized without breaking scroll position and other current interpolations of local position.
- **Event system:**  
It should be very easy to watch local progression, resizing, etc.
```javascript
section.on(/exit/, event => { ...do something }
```
- **Multiple heads:**  <br/>
*Not currently* seeing usages of such a feature, but in order to be future proof as much as possible, current position will not be unique (as can be seen actual web scroll position). A position in the timeline will be named **Head**, and `Timeline` instances will accept any arbitrary number of heads.
