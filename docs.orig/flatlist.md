---
id: flatlist
title: FlatList
---
A performant interface for rendering simple, flat lists, supporting the most handy features:

 - Fully cross-platform.
 - Optional horizontal mode.
 - Configurable viewability callbacks.
 - Header support.
 - Footer support.
 - Separator support.
 - Pull to Refresh.
 - Scroll loading.
 - ScrollToIndex support.

If you need section support, use [`<SectionList>`](docs/sectionlist.html).

Minimal Example:

```javascript
    <FlatList
      data={[{key: 'a'}, {key: 'b'}]}
      renderItem={({item}) => <Text>{item.key}</Text>}
    />
```

More complex, multi-select example demonstrating `PureComponent` usage for perf optimization and avoiding bugs.

- By binding the `onPressItem` handler, the props will remain `===` and `PureComponent` will
  prevent wasteful re-renders unless the actual `id`, `selected`, or `title` props change, even
  if the components rendered in `MyListItem` did not have such optimizations.
- By passing `extraData={this.state}` to `FlatList` we make sure `FlatList` itself will re-render
  when the `state.selected` changes. Without setting this prop, `FlatList` would not know it
  needs to re-render any items because it is also a `PureComponent` and the prop comparison will
  not show any changes.
- `keyExtractor` tells the list to use the `id`s for the react keys instead of the default `key` property.

```javascript
class MyListItem extends React.PureComponent {
  _onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    const textColor = this.props.selected ? "red" : "black";
    return (
      <TouchableOpacity onPress={this._onPress}>
        <View>
          <Text style={{ color: textColor }}>
            {this.props.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class MultiSelectList extends React.PureComponent {
  state = {selected: (new Map(): Map<string, boolean>)};

  _keyExtractor = (item, index) => item.id;

  _onPressItem = (id: string) => {
    // updater functions are preferred for transactional updates
    this.setState((state) => {
      // copy the map rather than modifying state.
      const selected = new Map(state.selected);
      selected.set(id, !selected.get(id)); // toggle
      return {selected};
    });
  };

  _renderItem = ({item}) => (
    <MyListItem
      id={item.id}
      onPressItem={this._onPressItem}
      selected={!!this.state.selected.get(item.id)}
      title={item.title}
    />
  );

  render() {
    return (
      <FlatList
        data={this.props.data}
        extraData={this.state}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderItem}
      />
    );
  }
}
```

This is a convenience wrapper around [`VirtualizedList`](docs/virtualizedlist.html), and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed here, along with the following caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all  your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow- equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key.  Alternatively, you can provide a custom `keyExtractor` prop.

Also inherits [ScrollView props](docs/scrollview.html#props), unless it is nested in another `FlatList` of same orientation.

### Props

- [`ScrollView` props...](docs/scrollview.html#props)
- [`VirtualizedList` props...](docs/virtualizedlist.html#props)
- [`renderItem`](docs/flatlist.html#renderitem)
- [`data`](docs/flatlist.html#data)
- [`ItemSeparatorComponent`](docs/flatlist.html#itemseparatorcomponent)
- [`ListEmptyComponent`](docs/flatlist.html#listemptycomponent)
- [`ListFooterComponent`](docs/flatlist.html#listgootercomponent)
- [`ListHeaderComponent`](docs/flatlist.html#listheadercomponent)
- [`columnwrapperstyle`](docs/flatlist.html#columnwrapperstyle)
- [`extraData`](docs/flatlist.html#extradata)
- [`getItemLayout`](docs/flatlist.html#getitemlayout)
- [`horizontal`](docs/flatlist.html#horizontal)
- [`initialNumToRender`](docs/flatlist.html#initialnumtorender)
- [`initialScrollIndex`](docs/flatlist.html#initialscrollindex)
- [`inverted`](docs/flatlist.html#inverted)
- [`keyExtractor`](docs/flatlist.html#keyextractor)
- [`numColumns`](docs/flatlist.html#numcolumns)
- [`onEndReached`](docs/flatlist.html#onendreached)
- [`onEndReachedThreshold`](docs/flatlist.html#onendreachedthreshold)
- [`onRefresh`](docs/flatlist.html#onrefresh)
- [`onViewableItemsChanged`](docs/flatlist.html#onviewableitemschanged)
- [`progressViewOffset`](docs/flatlist.html#progressviewoffset)
- [`legacyImplementation`](docs/flatlist.html#legacyimplementation)
- [`refreshing`](docs/flatlist.html#refreshing)
- [`removeClippedSubviews`](docs/flatlist.html#removeclippedsubviews)
- [`viewabilityConfig`](docs/flatlist.html#viewabilityconfig)
- [`viewabilityConfigCallbackPairs`](docs/flatlist.html#viewabilityconfigcallbackpairs)

### Methods

- [`scrollToEnd`](docs/flatlist.html#scrolltoend)
- [`scrollToIndex`](docs/flatlist.html#scrolltoindex)
- [`scrollToItem`](docs/flatlist.html#scrolltoitem)
- [`scrollToOffset`](docs/flatlist.html#scrolltooffset)
- [`recordInteraction`](docs/flatlist.html#recordinteraction)
- [`flashScrollIndicators`](docs/flatlist.html#flashscrollindicators)


### Type Definitions

- [`Props`](docs/flatlist.html#props)
- [`DefaultProps`](docs/flatlist.html#defaultprops)




---

# Reference

## Props

### `renderItem`

```javascript
renderItem({ item: object, index: number, separators: { highlight: function, unhighlight: function, updateProps: function(select: string, newProps: object) } }): [element]
```

Takes an item from `data` and renders it into the list.

Provides additional metadata like `index` if you need it, as well as a more generic `separators.updateProps` function which let's you set whatever props you want to change the rendering of either the leading separator or trailing separator in case the more common `highlight` and `unhighlight` (which set the `highlighted: boolean` prop) are insufficient for your use case.

| Type | Required |
| - | - |
| function | Yes |


Example usage:

```javascript
<FlatList
      ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
        <View style={[style.separator, highlighted && {marginLeft: 0}]} />
      )}
      data={[{title: 'Title Text', key: 'item1'}]}
      renderItem={({item, separators}) => (
        <TouchableHighlight
          onPress={() => this._onPress(item)}
          onShowUnderlay={separators.highlight}
          onHideUnderlay={separators.unhighlight}>
          <View style={{backgroundColor: 'white'}}>
            <Text>{item.title}</Text>
          </View>
        </TouchableHighlight>
      )}
    />
```


---


### `data`

For simplicity, data is just a plain array. If you want to use something else, like an immutable list, use the underlying [`VirtualizedList`](docs/virtualizedlist.html) directly.

| Type | Required |
| - | - |
| array | Yes |



---


### `ItemSeparatorComponent`

Rendered in between each item, but not at the top or bottom. By default, `highlighted` and `leadingItem` props are provided. `renderItem` provides `separators.highlight`/`unhighlight` which will update the `highlighted` prop, but you can also add custom props with `separators.updateProps`.

| Type | Required |
| - | - |
| component | No |



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


### `columnWrapperStyle`

Optional custom style for multi-item rows generated when `numColumns > 1`.

| Type | Required |
| - | - |
| style object | No |



---


### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type | Required |
| - | - |
| any | No |




---


### `getItemLayout`

```javascript
(data, index) => {length: number, offset: number, index: number}
```

`getItemLayout` is an optional optimization that let us skip measurement of dynamic content if you know the height of items a priori. `getItemLayout` is the most efficient, and is easy to use if you have fixed height items, for example:

```javascript
  getItemLayout={(data, index) => (
    {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
  )}
```

Adding `getItemLayout` can be a great performance boost for lists of several hundred items. Remember to include separator length (height or width) in your offset calculation if you specify `ItemSeparatorComponent`.

| Type | Required |
| - | - |
| function  | No |



---


### `horizontal`

If true, renders items next to each other horizontally instead of stacked vertically.

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


### `initialScrollIndex`

Instead of starting at the top with the first item, start at `initialScrollIndex`. This disables the "scroll to top" optimization that keeps the first `initialNumToRender` items always rendered and immediately renders the items starting at this initial index. Requires `getItemLayout` to be implemented.

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

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the react key to track item re-ordering. The default extractor checks `item.key`, then falls back to using the index, like React does.

| Type | Required |
| - | - |
| function | No |




---


### `numColumns`

Multiple columns can only be rendered with `horizontal={false}` and will zig-zag like a `flexWrap` layout. Items should all be the same height - masonry layouts are not supported.

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


### `progressViewOffset`

Set this when offset is needed for the loading indicator to show correctly.

| Type | Required | Platform |
| - | - | - |
| number | No | Android |



---


### `legacyImplementation`

May not have full feature parity and is meant for debugging and performance comparison. 

| Type | Required |
| - | - |
| boolean | No |



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


## Methods

### `scrollToEnd()`

```javascript
scrollToEnd([params]: object)
```

Scrolls to the end of the content. May be janky without `getItemLayout` prop.



---

### `scrollToIndex()`

```javascript
scrollToIndex(params: object)
```

Scrolls to the item at the specified index such that it is positioned in the viewable area
such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the
middle. `viewOffset` is a fixed number of pixels to offset the final target position.

Note: cannot scroll to locations outside the render window without specifying the
`getItemLayout` prop.



---

### `scrollToItem()`

```javascript
scrollToItem(params: object)
```

Requires linear scan through data - use `scrollToIndex` instead if possible.

Note: cannot scroll to locations outside the render window without specifying the
`getItemLayout` prop.



---

### `scrollToOffset()`

```javascript
scrollToOffset(params: object)
```

Scroll to a specific content pixel offset in the list.

Check out [scrollToOffset](docs/virtualizedlist.html#scrolltooffset) of VirtualizedList



---

### `recordInteraction()`

```javascript
recordInteraction()
```

Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
if `waitForInteractions` is true and the user has not scrolled. This is typically called by
taps on items or by navigation actions.



---

### `flashScrollIndicators()`

```javascript
flashScrollIndicators()
```

Displays the scroll indicators momentarily.



## Type Definitions

### Props

| Type |
| - |
| IntersectionTypeAnnotation |




---

### DefaultProps

| Type |
| - |
| TypeofTypeAnnotation |




