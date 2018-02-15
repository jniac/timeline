

# Thu Feb 15 2018

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


# Mon Feb 14 2018

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

