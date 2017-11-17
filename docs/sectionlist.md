---
id: sectionlist
title: SectionList
layout: docs
category: components
permalink: docs/sectionlist.html
next: segmentedcontrolios
previous: scrollview
---

A performant interface for rendering sectioned lists, supporting the most handy features:

 - Fully cross-platform.
 - Configurable viewability callbacks.
 - List header support.
 - List footer support.
 - Item separator support.
 - Section header support.
 - Section separator support.
 - Heterogeneous data and item rendering support.
 - Pull to Refresh.
 - Scroll loading.

If you don't need section support and want a simpler interface, use
[`<FlatList>`](/react-native/docs/flatlist.html).

Simple Examples:

```javascript
<SectionList
  renderItem={({item}) => <ListItem title={item} />}
  renderSectionHeader={({section}) => <Header title={section.title} />}
  sections={[ // homogeneous rendering between sections
    {data: [...], title: ...},
    {data: [...], title: ...},
    {data: [...], title: ...},
  ]}
/>

<SectionList
  sections={[ // heterogeneous rendering between sections
    {data: [...], renderItem: ...},
    {data: [...], renderItem: ...},
    {data: [...], renderItem: ...},
  ]}
/>
```

This is a convenience wrapper around [`VirtualizedList`](docs/virtualizedlist.html),
and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed
here, along with the following caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow- equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate and momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

### Props

- [`ScrollView` props...](docs/scrollview.html#props)
- [`VirtualizedList` props...](docs/virtualizedlist.html#props)
- [`sections`](docs/virtualizedlist.html#sections)
- [`renderItem`](docs/virtualizedlist.html#renderitem)
- [`ItemSeparatorComponent`](docs/virtualizedlist.html#itemseparatorcomponent)
- [`ListEmptyComponent`](docs/virtualizedlist.html#listemptycomponent)
- [`ListFooterComponent`](docs/virtualizedlist.html#listgootercomponent)
SectionSeparatorComponent
- [`extradata`](docs/virtualizedlist.html#extradata)
- [`initialNumToRender`](docs/virtualizedlist.html#initialnumtorender)
- [`inverted`](docs/virtualizedlist.html#inverted)
- [`keyExtractor`](docs/virtualizedlist.html#keyextractor)
- [`onEndReached`](docs/virtualizedlist.html#onendreached)
- [`onEndReachedThreshold`](docs/virtualizedlist.html#onendreachedthreshold)
- [`onRefresh`](docs/virtualizedlist.html#onrefresh)
- [`onViewableItemsChanged`](docs/virtualizedlist.html#onviewableitemschanged)
- [`refreshing`](docs/virtualizedlist.html#refreshing)
- [`removeClippedSubviews`](docs/virtualizedlist.html#removeclippedsubviews)
- [`renderSectionHeader`](docs/virtualizedlist.html#removeclippedsubviews)
- [`renderSectionFooter`](docs/virtualizedlist.html#rendersectionfooter)
- [`stickySectionHeadersEnabled`](docs/sectionlist.html#stickysectionheadersenabled)
- [`legacyImplementation`](docs/virtualizedlist.html#legacyimplementation)


### Methods

- [`scrollToLocation`](docs/sectionlist.html#scrolltolocation)
- [`recordInteraction`](docs/sectionlist.html#recordinteraction)
- [`flashScrollIndicators`](docs/sectionlist.html#flashscrollindicators)


### Type Definitions

- [`SectionBase`](docs/sectionlist.html#sectionbase)
- [`Props`](docs/sectionlist.html#props)




---

# Reference

## Props

### `sections`

The actual data to render, akin to the `data` prop in [`FlatList`](/docs/flatlist.html#data).

**General shape:**

```
sections: [{
  data: array,
  [renderItem]: ({item: SectionItem, ...}) => element,
  [ItemSeparatorComponent]: React Class Component | function | element,
}]
```

| Type | Required |
| - | - |
| array of objects | Yes |



---


### `renderItem`

```javascript
renderItem({ item: object, index: number, section: object, separators: { highlight: function, unhighlight: function, updateProps: function(select: string, newProps: object) } }): [element]
```

Default renderer for every item in every section. Can be over-ridden on a per-section basis.

Provides additional metadata like `index` if you need it, as well as a more generic `separators.updateProps` function which let's you set whatever props you want to change the rendering of either the leading separator or trailing separator in case the more common `highlight` and `unhighlight` (which set the `highlighted: boolean` prop) are insufficient for your use case.

| Type | Required |
| - | - |
| function | No |



---


### `ItemSeparatorComponent`

Rendered in between each item, but not at the top or bottom. By default, `highlighted`, `section`, and `[leading/trailing][Item/Separator]` props are provided. `renderItem` provides `separators.highlight`/`unhighlight` which will update the `highlighted` prop, but you can also add custom props with `separators.updateProps`.

| Type | Required |
| - | - |
| component | No |



---


### `ListHeaderComponent`

Rendered at the top of all the items. Can be a React Component Class, a render function, or a rendered element.

| Type | Required |
| - | - |
| component, function, element | No |



---


### `ListEmptyComponent`

Rendered when the list is empty. Can be a React Component Class, a render function, or a rendered element.

| Type | Required |
| - | - |
| component, function, element | No |



---


### `ListFooterComponent`

Rendered at the very end of the list. Can be a React Component Class, a render function, or a rendered element.

| Type | Required |
| - | - |
| component, function, element | No |



---


### `SectionSeparatorComponent`

Rendered at the top and bottom of each section (note this is different from `ItemSeparatorComponent` which is only rendered between items). These are intended to separate sections from the headers above and below and typically have the same highlight response as `ItemSeparatorComponent`. Also receives `highlighted`, `[leading/trailing][Item/Separator]`, and any custom props from `separators.updateProps`.

| Type | Required |
| - | - |
| any | No |



---


### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type | Required |
| - | - |
| any | No |



---


### `initialNumToRender`

How many items to render in the initial batch. This should be enough to fill the screen but not much more. Note these items will never be unmounted as part of the windowed rendering in order to improve perceived performance of scroll-to-top actions.

| Type | Required |
| - | - |
| number | No |



---


### `inverted`

Reverses the direction of scroll. Uses scale transforms of `-1`.

| Type | Required |
| - | - |
| boolean | No |



---


### `keyExtractor`

```javascript
(item: object, index: number) => string
```

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the react key to track item re-ordering. The default extractor checks item.key, then falls back to using the index, like react does. Note that this sets keys for each item, but each overall section still needs its own key.

| Type | Required |
| - | - |
| function | No |



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


### `onRefresh`

```javascript
() => void
```

If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly.

| Type | Required |
| - | - |
| function  | No |



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


### `renderSectionHeader`

```
(info: {section}) => [element]
```

Rendered at the top of each section. These stick to the top of the `ScrollView` by default on iOS. See `stickySectionHeadersEnabled`.

| Type | Required |
| - | - |
| element | No |



---


### `renderSectionFooter`

```
(info: {section}) => [element]
```

React element rendered at the bottom of each section.

| Type | Required |
| - | - |
| element | No |



---


### `stickySectionHeadersEnabled`

Makes section headers stick to the top of the screen until the next one pushes it off. Only enabled by default on iOS because that is the platform standard there.

| Type | Required |
| - | - |
|  | No |






## Methods

### `scrollToLocation()`

```javascript
scrollToLocation(params: object)
```

Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within the section)
positioned in the viewable area such that `viewPosition` 0 places it at the top (and may be
covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle. `viewOffset` is a
fixed number of pixels to offset the final target position, e.g. to compensate for sticky
headers.

Note: cannot scroll to locations outside the render window without specifying the
`getItemLayout` prop.



---

### `recordInteraction()`

```javascript
recordInteraction()
```

Tells the list an interaction has occured, which should trigger viewability calculations, e.g.
if `waitForInteractions` is true and the user has not scrolled. This is typically called by
taps on items or by navigation actions.



---

### `flashScrollIndicators()`

```javascript
flashScrollIndicators()
```

Displays the scroll indicators momentarily.



## Type Definitions

### SectionBase

| Type |
| - |
| ObjectTypeAnnotation |




---

### Props

| Type |
| - |
| IntersectionTypeAnnotation |




