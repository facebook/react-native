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

This is a convenience wrapper around [`<VirtualizedList>`](docs/virtualizedlist.html),
and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed
here, along with the following caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all
  your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
  equal. Make sure that everything your `renderItem` function depends on is passed as a prop
  (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
  changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
  offscreen. This means it's possible to scroll faster than the fill rate and momentarily see
  blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
  and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key.
  Alternatively, you can provide a custom `keyExtractor` prop.

### Props

- [`stickySectionHeadersEnabled`](docs/sectionlist.html#stickysectionheadersenabled)




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

### `stickySectionHeadersEnabled`



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




