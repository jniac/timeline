

# Thu Feb 15 2018


# Mon Feb 14 2018

Space: changed children disposition  
---
Introducing `ExpandEnum(FIXED, EXPAND)`.
Now, inside a Space(.expand=ExpandEnum.EXPAND) children can be stacked (as div in a page).  
This implies that parent Space can now inherit size from children.  
Such parent cannot be referent to children relative dimensions. So to compute relative dimensions, `resolveSpace()` now search for a fixed parent via `getFixedParent`.


