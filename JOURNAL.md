

## Thu Feb 15 2018

- **[Reminder] Head**  
`Head` instances must be 'clipped' to relevant `Section` (in order to resize parent section (responsive) or remove preceding section without having `Head` instances jumping or sliding through current section, (global position should be as meaningless as possible))

- **[Info] Section vs Space**  
Currently `Section` is built on top of `Space`. `Section` is the operative part of `Timeline`, and `Space` is the mathematic / logic part. `Space` holds range values, hierachy (parent/children). `Section` fires events and `Head` computed values.

- What about `Division` for renaming as well `Space` as `Section` ?

- Should root Space automatically be seen as expandable (ExpandEnum.EXPAND)?  
...in order to allow simpler timeline agregation later.


## Mon Feb 14 2018

### Space: changed children disposition  
Introducing `ExpandEnum(FIXED, EXPAND)`.  
Now, inside a `Space(expand===ExpandEnum.EXPAND)` children can be stacked (as div in a page).  
This implies that parent Space can now **inherit size** from children.  
Such parent cannot be referent to children relative dimensions. So to compute relative dimensions, `resolveSpace()` now searches for a fixed parent via `getFixedParent`.


