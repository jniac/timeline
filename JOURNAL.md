
# Fri Feb 2018

- **Head**  
Should head avatars, currently declared in `Division`, allow to modify head position directly (from absolute/relative property)? Overkill?  
Example:
```javasctipt
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

