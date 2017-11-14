---
id: virtualizedlist
title: VirtualizedList
---

Base implementation for the more convenient [`<FlatList>`](/react-native/docs/flatlist.html) and [`<SectionList>`](/react-native/docs/sectionlist.html) components, which are also better documented. In general, this should only really be used if you need more flexibility than `FlatList` provides, e.g. for use with immutable data instead of plain arrays.

Virtualization massively improves memory consumption and performance of large lists by maintaining a finite render window of active items and replacing all items outside of the render window with appropriately sized blank space. The window adapts to scrolling behavior, and items are rendered incrementally with low-pri (after any running interactions) if they are far from the visible area, or with hi-pri otherwise to minimize the potential of seeing blank space.

Some caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow-equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

### Props

- [`ScrollView` props...](docs/scrollview.html#props)
- [`renderItem`](docs/virtualizedlist.html#renderitem)
- [`data`](docs/virtualizedlist.html#data)
- [`getItem`](docs/virtualizedlist.html#getitem)
- [`getItemCount`](docs/virtualizedlist.html#getitemcount)
- [`debug`](docs/virtualizedlist.html#debug)
- [`extraData`](docs/virtualizedlist.html#extradata)
- [`getItemLayout`](docs/virtualizedlist.html#getitemlayout)
- [`initialScrollIndex`](docs/virtualizedlist.html#initialscrollindex)
- [`inverted`](docs/virtualizedlist.html#inverted)
- [`CellRendererComponent`](docs/virtualizedlist.html#cellrenderercomponent)
- [`ListEmptyComponent`](docs/virtualizedlist.html#listemptycomponent)
- [`ListFooterComponent`](docs/virtualizedlist.html#listfootercomponent)
- [`ListHeaderComponent`](docs/virtualizedlist.html#listheadercomponent)
- [`onEndReached`](docs/virtualizedlist.html#onendreached)
- [`onLayout`](docs/virtualizedlist.html#onlayout)
- [`onRefresh`](docs/virtualizedlist.html#onrefresh)
- [`onScrollToIndexFailed`](docs/virtualizedlist.html#onscrolltoindexfailed)
- [`onViewableItemsChanged`](docs/virtualizedlist.html#onviewableitemschanged)
- [`refreshing`](docs/virtualizedlist.html#refreshing)
- [`removeClippedSubviews`](docs/virtualizedlist.html#removeclippedsubviews)
- [`renderScrollComponent`](docs/virtualizedlist.html#renderscrollcomponent)
- [`viewabilityConfig`](docs/virtualizedlist.html#viewabilityconfig)
- [`viewabilityConfigCallbackPairs`](docs/virtualizedlist.html#viewabilityconfigcallbackpairs)
- [`horizontal`](docs/virtualizedlist.html#horizontal)
- [`initialNumToRender`](docs/virtualizedlist.html#initialnumtorender)
- [`keyExtractor`](docs/virtualizedlist.html#keyextractor)
- [`maxToRenderPerBatch`](docs/virtualizedlist.html#maxtorenderperbatch)
- [`onEndReachedThreshold`](docs/virtualizedlist.html#onendreachedthreshold)
- [`scrollEventThrottle`](docs/virtualizedlist.html#scrolleventthrottle)
- [`updateCellsBatchingPeriod`](docs/virtualizedlist.html#updatecellsbatchingperiod)
- [`windowSize`](docs/virtualizedlist.html#windowsize)
- [`disableVirtualization`](docs/virtualizedlist.html#disablevirtualization)
- [`progressViewOffset`](docs/virtualizedlist.html#progressviewoffset)

### State

- [`first`](docs/virtualizedlist.html#first)
- [`last`](docs/virtualizedlist.html#last)

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

### `renderItem`

| Type | Required |
| - | - |
| number | Yes |


---


### `data`

The default accessor functions assume this is an array of objects with shape `{key: string}` but you can override `getItem`, `getItemCount`, and `keyExtractor` to handle any type of index-based data.

| Type | Required |
| - | - |
| any | Yes |


---


### `getItem`

```javascript
(data: any, index: number) => object
```

A generic accessor for extracting an item from any sort of data blob.

| Type | Required |
| - | - |
| function | Yes |


---


### `getItemCount`

```javascript
(data: any) => number
```

Determines how many items are in the data blob.

| Type | Required |
| - | - |
| function | Yes |


---



### `debug`

`debug` will turn on extra logging and visual overlays to aid with debugging both usage and implementation, but with a significant perf hit.

| Type | Required |
| - | - |
| boolean | No |


---


### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type | Required |
| - | - |
| any | No |


---


### `getItemLayout`

```javascript
(
    data: any,
    index: number,
  ) => {length: number, offset: number, index: number}
```

| Type | Required |
| - | - |
| function | No |


---


### `initialScrollIndex`

Instead of starting at the top with the first item, start at `initialScrollIndex`. This disables the "scroll to top" optimization that keeps the first `initialNumToRender` items always rendered and immediately renders the items starting at this initial index. Requires `getItemLayout` to be implemented.

| Type | Required |
| - | - |
| number | No |


---


### `inverted`

Reverses the direction of scroll. Uses scale transforms of -1.

| Type | Required |
| - | - |
| boolean | No |


---


### `CellRendererComponent`

Each cell is rendered using this element. Can be a React Component Class,or a render function. Defaults to using [`View`](docs/view.html).

| Type | Required |
| - | - |
| component, function | No |


---


### `ListEmptyComponent`

Rendered when the list is empty. Can be a React Component Class, a render function, or a rendered element.

| Type | Required |
| - | - |
| component, function, element | No |


---


### `ListFooterComponent`

Rendered at the bottom of all the items. Can be a React Component Class, a render function, or a rendered element.

| Type | Required |
| - | - |
| component, function, element | No |


---


### `ListHeaderComponent`

Rendered at the top of all the items. Can be a React Component Class, a render function, or a rendered element.

| Type | Required |
| - | - |
| component, function, element | No |


---


### `onLayout`

| Type | Required |
| - | - |
| function | No |


---


### `onRefresh`

```javascript
() => void
```

If provided, a standard `RefreshControl` will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly.

| Type | Required |
| - | - |
| function | No |


---


### `onScrollToIndexFailed`

```javascript
(info: {
    index: number,
    highestMeasuredFrameIndex: number,
    averageItemLength: number,
  }) => void
```  

Used to handle failures when scrolling to an index that has not been measured yet. Recommended action is to either compute your own offset and `scrollTo` it, or scroll as far as possible and then try again after more items have been rendered.

| Type | Required |
| - | - |
| function | No |


---


### `onViewableItemsChanged`

```javascript
(info: {
    viewableItems: array,
    changed: array,
  }) => void
```

Called when the viewability of rows changes, as defined by the `viewabilityConfig` prop.

| Type | Required |
| - | - |
| function | No |



---


### `refreshing`

Set this true while waiting for new data from a refresh.

| Type | Required |
| - | - |
| boolean | No |


---


### `removeClippedSubviews`

This may improve scroll performance for large lists.

> Note: 
> May have bugs (missing content) in some circumstances - use at your own risk.

| Type | Required |
| - | - |
| boolean | No |


---


### `renderScrollComponent`

```javascript
(props: object) => element
```

Render a custom scroll component, e.g. with a differently styled `RefreshControl`.

| Type | Required |
| - | - |
| function | No |


---


### `viewabilityConfig`

See `ViewabilityHelper.js` for flow type and further documentation.

| Type | Required |
| - | - |
| ViewabilityConfig | No |



---


### `viewabilityConfigCallbackPairs`

List of `ViewabilityConfig`/`onViewableItemsChanged` pairs. A specific `onViewableItemsChanged` will be called when its corresponding `ViewabilityConfig`'s conditions are met. See `ViewabilityHelper.js` for flow type and further documentation.

| Type | Required |
| - | - |
| array of ViewabilityConfigCallbackPair | No |


---



### `horizontal`



| Type | Required |
| - | - |
| boolean | No |




---

### `initialNumToRender`

How many items to render in the initial batch. This should be enough to fill the screen but not much more. Note these items will never be unmounted as part of the windowed rendering in order to improve perceived performance of scroll-to-top actions.

| Type | Required |
| - | - |
| number | No |




---

### `keyExtractor`

```javascript
(item: object, index: number) => string
```

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the react key to track item re-ordering. The default extractor checks `item.key`, then falls back to using the index, like React does.

| Type | Required |
| - | - |
| function | No |



---

### `maxToRenderPerBatch`

The maximum number of items to render in each incremental render batch. The more rendered at once, the better the fill rate, but responsiveness my suffer because rendering content may interfere with responding to button taps or other interactions.

| Type | Required |
| - | - |
| number | No |


---

### `onEndReached`

```javascript
(info: {distanceFromEnd: number}) => void
```

Called once when the scroll position gets within `onEndReachedThreshold` of the rendered content.

| Type | Required |
| - | - |
| function  | No |

---

### `onEndReachedThreshold`

 How far from the end (in units of visible length of the list) the bottom edge of the list must be from the end of the content to trigger the `onEndReached` callback. Thus a value of 0.5 will trigger `onEndReached` when the end of the content is within half the visible length of the list.

| Type | Required |
| - | - |
| number | No |





---

### `scrollEventThrottle`



| Type | Required |
| - | - |
|  | No |




---

### `updateCellsBatchingPeriod`

Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off screen. Similar fill rate/responsiveness tradeoff as `maxToRenderPerBatch`.

| Type | Required |
| - | - |
| number | No |




---

### `windowSize`

Determines the maximum number of items rendered outside of the visible area, in units of visible lengths. So if your list fills the screen, then `windowSize={21}` (the default) will render the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing this number will reduce memory consumption and may improve performance, but will increase the chance that fast scrolling may reveal momentary blank areas of unrendered content.


| Type | Required |
| - | - |
| number | No |



---

### `disableVirtualization`

**DEPRECATED.** Virtualization provides significant performance and memory optimizations, but fully unmounts react instances that are outside of the render window. You should only need to disable this for debugging purposes.

| Type | Required |
| - | - |
|  | No |

---


### `progressViewOffset`

Set this when offset is needed for the loading indicator to show correctly.

| Type | Required | Platform |
| - | - | - |
| number | No | Android |


## State

### `first`



| Type |
| - |
| number | 

---

### `last`


| Type |
| - | 
| number |



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

**Parameters:**

- `offset` expects the offset to scroll to.
  In case of `horizontal` is true, the offset is the x-value, in any other case the offset is the y-value.
- `animated` (`true` by default) defines whether the list should do an animation while scrolling.



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




