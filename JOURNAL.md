

# Thu Feb 15 2018

---

What about 'Division' for renaming as well `Space` as `Section` ?

---

Should root Space automatically be seen as expandable (ExpandEnum.EXPAND)?  
...in order to allow simpler timeline agregation later.


# Mon Feb 14 2018

Space: changed children disposition  

---
Introducing `ExpandEnum(FIXED, EXPAND)`.  
Now, inside a `Space(expand===ExpandEnum.EXPAND)` children can be stacked (as div in a page).  
This implies that parent Space can now **inherit size** from children.  
Such parent cannot be referent to children relative dimensions. So to compute relative dimensions, `resolveSpace()` now searches for a fixed parent via `getFixedParent`.

