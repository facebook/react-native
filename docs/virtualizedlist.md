---
id: virtualizedlist
title: VirtualizedList
layout: docs
category: components
permalink: docs/virtualizedlist.html
next: webview
previous: viewpagerandroid
---
Base implementation for the more convenient [`<FlatList>`](/react-native/docs/flatlist.html)
and [`<SectionList>`](/react-native/docs/sectionlist.html) components, which are also better
documented. In general, this should only really be used if you need more flexibility than
`FlatList` provides, e.g. for use with immutable data instead of plain arrays.

Virtualization massively improves memory consumption and performance of large lists by
maintaining a finite render window of active items and replacing all items outside of the render
window with appropriately sized blank space. The window adapts to scrolling behavior, and items
are rendered incrementally with low-pri (after any running interactions) if they are far from the
visible area, or with hi-pri otherwise to minimize the potential of seeing blank space.

Some caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all
  your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
  equal. Make sure that everything your `renderItem` function depends on is passed as a prop
  (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
  changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
  offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see
  blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
  and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key.
  Alternatively, you can provide a custom `keyExtractor` prop.

### Props

- [`last`](docs/virtualizedlist.html#last)
- [`first`](docs/virtualizedlist.html#first)
- [`horizontal`](docs/virtualizedlist.html#horizontal)
- [`initialNumToRender`](docs/virtualizedlist.html#initialnumtorender)
- [`keyExtractor`](docs/virtualizedlist.html#keyextractor)
- [`disableVirtualization`](docs/virtualizedlist.html#disablevirtualization)
- [`maxToRenderPerBatch`](docs/virtualizedlist.html#maxtorenderperbatch)
- [`onEndReachedThreshold`](docs/virtualizedlist.html#onendreachedthreshold)
- [`scrollEventThrottle`](docs/virtualizedlist.html#scrolleventthrottle)
- [`updateCellsBatchingPeriod`](docs/virtualizedlist.html#updatecellsbatchingperiod)
- [`windowSize`](docs/virtualizedlist.html#windowsize)




### Methods

- [`scrollToEnd`](docs/virtualizedlist.html#scrolltoend)
- [`scrollToIndex`](docs/virtualizedlist.html#scrolltoindex)
- [`scrollToItem`](docs/virtualizedlist.html#scrolltoitem)
- [`scrollToOffset`](docs/virtualizedlist.html#scrolltooffset)
- [`recordInteraction`](docs/virtualizedlist.html#recordinteraction)
- [`flashScrollIndicators`](docs/virtualizedlist.html#flashscrollindicators)


### Type Definitions

- [`renderItemType`](docs/virtualizedlist.html#renderitemtype)
- [`Props`](docs/virtualizedlist.html#props)




---

# Reference

## Props

### `last`



| Type | Required |
| - | - |
| number | Yes |




---

### `first`



| Type | Required |
| - | - |
| number | Yes |




---

### `horizontal`



| Type | Required |
| - | - |
|  | No |




---

### `initialNumToRender`



| Type | Required |
| - | - |
|  | No |




---

### `keyExtractor`



| Type | Required |
| - | - |
|  | No |




---

### `disableVirtualization`



| Type | Required |
| - | - |
|  | No |




---

### `maxToRenderPerBatch`



| Type | Required |
| - | - |
|  | No |




---

### `onEndReachedThreshold`



| Type | Required |
| - | - |
|  | No |




---

### `scrollEventThrottle`



| Type | Required |
| - | - |
|  | No |




---

### `updateCellsBatchingPeriod`



| Type | Required |
| - | - |
|  | No |




---

### `windowSize`



| Type | Required |
| - | - |
|  | No |






## Methods

### `scrollToEnd()`

```javascript
scrollToEnd([params]: object)
```



---

### `scrollToIndex()`

```javascript
scrollToIndex(params: object)
```



---

### `scrollToItem()`

```javascript
scrollToItem(params: object)
```



---

### `scrollToOffset()`

```javascript
scrollToOffset(params: object)
```

Scroll to a specific content pixel offset in the list.

Param `offset` expects the offset to scroll to.
In case of `horizontal` is true, the offset is the x-value,
in any other case the offset is the y-value.

Param `animated` (`true` by default) defines whether the list
should do an animation while scrolling.



---

### `recordInteraction()`

```javascript
recordInteraction()
```



---

### `flashScrollIndicators()`

```javascript
flashScrollIndicators()
```



## Type Definitions

### renderItemType

| Type |
| - |
| FunctionTypeAnnotation |




---

### Props

| Type |
| - |
| IntersectionTypeAnnotation |




