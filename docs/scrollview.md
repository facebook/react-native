---
id: scrollview
title: ScrollView
layout: docs
category: components
permalink: docs/scrollview.html
next: sectionlist
previous: refreshcontrol
---
Component that wraps platform ScrollView while providing
integration with touch locking "responder" system.

Keep in mind that ScrollViews must have a bounded height in order to work,
since they contain unbounded-height children into a bounded container (via
a scroll interaction). In order to bound the height of a ScrollView, either
set the height of the view directly (discouraged) or make sure all parent
views have bounded height. Forgetting to transfer `{flex: 1}` down the
view stack can lead to errors here, which the element inspector makes
easy to debug.

Doesn't yet support other contained responders from blocking this scroll
view from becoming the responder.


`<ScrollView>` vs [`<FlatList>`](/react-native/docs/flatlist.html) - which one to use?

`ScrollView` simply renders all its react child components at once. That
makes it very easy to understand and use.

On the other hand, this has a performance downside. Imagine you have a very
long list of items you want to display, maybe several screens worth of
content. Creating JS components and native views for everything all at once,
much of which may not even be shown, will contribute to slow rendering and
increased memory usage.

This is where `FlatList` comes into play. `FlatList` renders items lazily,
just when they are about to appear, and removes items that scroll way off
screen to save memory and processing time.

`FlatList` is also handy if you want to render separators between your items,
multiple columns, infinite scroll loading, or any number of other features it
supports out of the box.

### Props

- [View props...](docs/view.html#props)
- [`alwaysBounceVertical`](docs/scrollview.html#alwaysbouncevertical)
- [`contentContainerStyle`](docs/scrollview.html#contentcontainerstyle)
- [`keyboardDismissMode`](docs/scrollview.html#keyboarddismissmode)
- [`keyboardShouldPersistTaps`](docs/scrollview.html#keyboardshouldpersisttaps)
- [`onContentSizeChange`](docs/scrollview.html#oncontentsizechange)
- [`onMomentumScrollBegin`](docs/scrollview.html#onmomentumscrollbegin)
- [`onMomentumScrollEnd`](docs/scrollview.html#onmomentumscrollend)
- [`onScroll`](docs/scrollview.html#onscroll)
- [`pagingEnabled`](docs/scrollview.html#pagingenabled)
- [`refreshControl`](docs/scrollview.html#refreshcontrol)
- [`removeClippedSubviews`](docs/scrollview.html#removeclippedsubviews)
- [`scrollEnabled`](docs/scrollview.html#scrollenabled)
- [`showsHorizontalScrollIndicator`](docs/scrollview.html#showshorizontalscrollindicator)
- [`showsVerticalScrollIndicator`](docs/scrollview.html#showsverticalscrollindicator)
- [`stickyHeaderIndices`](docs/scrollview.html#stickyheaderindices)
- [`endFillColor`](docs/scrollview.html#endfillcolor)
- [`overScrollMode`](docs/scrollview.html#overscrollmode)
- [`scrollPerfTag`](docs/scrollview.html#scrollperftag)
- [`alwaysBounceHorizontal`](docs/scrollview.html#alwaysbouncehorizontal)
- [`horizontal`](docs/scrollview.html#horizontal)
- [`automaticallyAdjustContentInsets`](docs/scrollview.html#automaticallyadjustcontentinsets)
- [`bounces`](docs/scrollview.html#bounces)
- [`bouncesZoom`](docs/scrollview.html#bounceszoom)
- [`canCancelContentTouches`](docs/scrollview.html#cancancelcontenttouches)
- [`centerContent`](docs/scrollview.html#centercontent)
- [`contentInset`](docs/scrollview.html#contentinset)
- [`contentInsetAdjustmentBehavior`](docs/scrollview.html#contentinsetadjustmentbehavior)
- [`contentOffset`](docs/scrollview.html#contentoffset)
- [`decelerationRate`](docs/scrollview.html#decelerationrate)
- [`directionalLockEnabled`](docs/scrollview.html#directionallockenabled)
- [`indicatorStyle`](docs/scrollview.html#indicatorstyle)
- [`maximumZoomScale`](docs/scrollview.html#maximumzoomscale)
- [`minimumZoomScale`](docs/scrollview.html#minimumzoomscale)
- [`pinchGestureEnabled`](docs/scrollview.html#pinchgestureenabled)
- [`scrollEventThrottle`](docs/scrollview.html#scrolleventthrottle)
- [`scrollIndicatorInsets`](docs/scrollview.html#scrollindicatorinsets)
- [`scrollsToTop`](docs/scrollview.html#scrollstotop)
- [`snapToAlignment`](docs/scrollview.html#snaptoalignment)
- [`snapToInterval`](docs/scrollview.html#snaptointerval)
- [`zoomScale`](docs/scrollview.html#zoomscale)
- [`DEPRECATED_sendUpdatedChildFrames`](docs/scrollview.html#deprecated-sendupdatedchildframes)




### Methods

- [`scrollTo`](docs/scrollview.html#scrollto)
- [`scrollToEnd`](docs/scrollview.html#scrolltoend)
- [`scrollWithoutAnimationTo`](docs/scrollview.html#scrollwithoutanimationto)
- [`flashScrollIndicators`](docs/scrollview.html#flashscrollindicators)




---

# Reference

## Props

### `alwaysBounceVertical`

When true, the scroll view bounces vertically when it reaches the end
even if the content is smaller than the scroll view itself. The default
value is false when `horizontal={true}` and true otherwise.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `contentContainerStyle`

These styles will be applied to the scroll view content container which
wraps all of the child views. Example:

```
return (
  <ScrollView contentContainerStyle={styles.contentContainer}>
  </ScrollView>
);
...
const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 20
  }
});
```

| Type | Required |
| - | - |
| [style](docs/view-style-props.html) | No |




---

### `keyboardDismissMode`

Determines whether the keyboard gets dismissed in response to a drag.

*Cross platform*

  - `'none'` (the default), drags do not dismiss the keyboard.
  - `'on-drag'`, the keyboard is dismissed when a drag begins.

*iOS Only*

  - `'interactive'`, the keyboard is dismissed interactively with the drag and moves in
    synchrony with the touch; dragging upwards cancels the dismissal.
    On android this is not supported and it will have the same behavior as 'none'.

| Type | Required |
| - | - |
| enum('none', 'on-drag', 'interactive') | No |




---

### `keyboardShouldPersistTaps`

Determines when the keyboard should stay visible after a tap.

  - `'never'` (the default), tapping outside of the focused text input when the keyboard
    is up dismisses the keyboard. When this happens, children won't receive the tap.
  - `'always'`, the keyboard will not dismiss automatically, and the scroll view will not
    catch taps, but children of the scroll view can catch taps.
  - `'handled'`, the keyboard will not dismiss automatically when the tap was handled by
    a children, (or captured by an ancestor).
  - `false`, deprecated, use 'never' instead
  - `true`, deprecated, use 'always' instead

| Type | Required |
| - | - |
| enum('always', 'never', 'handled', false, true) | No |




---

### `onContentSizeChange`

Called when scrollable content view of the ScrollView changes.

Handler function is passed the content width and content height as parameters:
`(contentWidth, contentHeight)`

It's implemented using onLayout handler attached to the content container
which this ScrollView renders.

| Type | Required |
| - | - |
| function | No |




---

### `onMomentumScrollBegin`

Called when the momentum scroll starts (scroll which occurs as the ScrollView glides to a stop).

| Type | Required |
| - | - |
| function | No |




---

### `onMomentumScrollEnd`

Called when the momentum scroll ends (scroll which occurs as the ScrollView glides to a stop).

| Type | Required |
| - | - |
| function | No |




---

### `onScroll`

Fires at most once per frame during scrolling. The frequency of the
events can be controlled using the `scrollEventThrottle` prop.

| Type | Required |
| - | - |
| function | No |




---

### `pagingEnabled`

When true, the scroll view stops on multiples of the scroll view's size
when scrolling. This can be used for horizontal pagination. The default
value is false.

Note: Vertical pagination is not supported on Android.

| Type | Required |
| - | - |
| bool | No |




---

### `refreshControl`

A RefreshControl component, used to provide pull-to-refresh
functionality for the ScrollView. Only works for vertical ScrollViews
(`horizontal` prop must be `false`).

See [RefreshControl](docs/refreshcontrol.html).

| Type | Required |
| - | - |
| element | No |




---

### `removeClippedSubviews`

Experimental: When true, offscreen child views (whose `overflow` value is
`hidden`) are removed from their native backing superview when offscreen.
This can improve scrolling performance on long lists. The default value is
true.

| Type | Required |
| - | - |
| bool | No |




---

### `scrollEnabled`

When false, the view cannot be scrolled via touch interaction.
The default value is true.

Note that the view can always be scrolled by calling `scrollTo`.

| Type | Required |
| - | - |
| bool | No |




---

### `showsHorizontalScrollIndicator`

When true, shows a horizontal scroll indicator.
The default value is true.

| Type | Required |
| - | - |
| bool | No |




---

### `showsVerticalScrollIndicator`

When true, shows a vertical scroll indicator.
The default value is true.

| Type | Required |
| - | - |
| bool | No |




---

### `stickyHeaderIndices`

An array of child indices determining which children get docked to the
top of the screen when scrolling. For example, passing
`stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
top of the scroll view. This property is not supported in conjunction
with `horizontal={true}`.

| Type | Required |
| - | - |
| array of number | No |




---

### `endFillColor`

Sometimes a scrollview takes up more space than its content fills. When this is
the case, this prop will fill the rest of the scrollview with a color to avoid setting
a background and creating unnecessary overdraw. This is an advanced optimization
that is not needed in the general case.


| Type | Required | Platform |
| - | - | - |
| [color](docs/colors.html) | No | Android  |




---

### `overScrollMode`

Used to override default value of overScroll mode.

Possible values:

 - `'auto'` - Default value, allow a user to over-scroll
   this view only if the content is large enough to meaningfully scroll.
 - `'always'` - Always allow a user to over-scroll this view.
 - `'never'` - Never allow a user to over-scroll this view.



| Type | Required | Platform |
| - | - | - |
| enum('auto', 'always', 'never') | No | Android  |




---

### `scrollPerfTag`

Tag used to log scroll performance on this scroll view. Will force
momentum events to be turned on (see sendMomentumEvents). This doesn't do
anything out of the box and you need to implement a custom native
FpsListener for it to be useful.


| Type | Required | Platform |
| - | - | - |
| string | No | Android  |



---

### `alwaysBounceHorizontal`

When true, the scroll view bounces horizontally when it reaches the end
even if the content is smaller than the scroll view itself. The default
value is true when `horizontal={true}` and false otherwise.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `horizontal`

When true, the scroll view's children are arranged horizontally in a row
instead of vertically in a column. The default value is false.

| Type | Required |
| - | - |
| bool | No |




---

### `automaticallyAdjustContentInsets`

Controls whether iOS should automatically adjust the content inset
for scroll views that are placed behind a navigation bar or
tab bar/ toolbar. The default value is true.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `bounces`

When true, the scroll view bounces when it reaches the end of the
content if the content is larger then the scroll view along the axis of
the scroll direction. When false, it disables all bouncing even if
the `alwaysBounce*` props are true. The default value is true.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `bouncesZoom`

When true, gestures can drive zoom past min/max and the zoom will animate
to the min/max value at gesture end, otherwise the zoom will not exceed
the limits.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `canCancelContentTouches`

When false, once tracking starts, won't try to drag if the touch moves.
The default value is true.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `centerContent`

When true, the scroll view automatically centers the content when the
content is smaller than the scroll view bounds; when the content is
larger than the scroll view, this property has no effect. The default
value is false.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `contentInset`

The amount by which the scroll view content is inset from the edges
of the scroll view. Defaults to `{top: 0, left: 0, bottom: 0, right: 0}`.


| Type | Required | Platform |
| - | - | - |
| object: {top: number, left: number, bottom: number, right: number} | No | iOS  |




---

### `contentInsetAdjustmentBehavior`

This property specifies how the safe area insets are used to modify the
content area of the scroll view. The default value of this property is
"never". Available on iOS 11 and later.


| Type | Required | Platform |
| - | - | - |
| enum('automatic', 'scrollableAxes', 'never', 'always') | No | iOS  |




---

### `contentOffset`

Used to manually set the starting scroll offset.
The default value is `{x: 0, y: 0}`.


| Type | Required | Platform |
| - | - | - |
| PointPropType | No | iOS  |




---

### `decelerationRate`

A floating-point number that determines how quickly the scroll view
decelerates after the user lifts their finger. You may also use string
shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
for `UIScrollViewDecelerationRateNormal` and
`UIScrollViewDecelerationRateFast` respectively.

  - `'normal'`: 0.998 (the default)
  - `'fast'`: 0.99



| Type | Required | Platform |
| - | - | - |
| enum('fast', 'normal'), ,number | No | iOS  |




---

### `directionalLockEnabled`

When true, the ScrollView will try to lock to only vertical or horizontal
scrolling while dragging.  The default value is false.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `indicatorStyle`

The style of the scroll indicators.

  - `'default'` (the default), same as `black`.
  - `'black'`, scroll indicator is black. This style is good against a light background.
  - `'white'`, scroll indicator is white. This style is good against a dark background.



| Type | Required | Platform |
| - | - | - |
| enum('default', 'black', 'white') | No | iOS  |




---

### `maximumZoomScale`

The maximum allowed zoom scale. The default value is 1.0.


| Type | Required | Platform |
| - | - | - |
| number | No | iOS  |




---

### `minimumZoomScale`

The minimum allowed zoom scale. The default value is 1.0.


| Type | Required | Platform |
| - | - | - |
| number | No | iOS  |




---

### `pinchGestureEnabled`

When true, ScrollView allows use of pinch gestures to zoom in and out.
The default value is true.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `scrollEventThrottle`

This controls how often the scroll event will be fired while scrolling
(as a time interval in ms). A lower number yields better accuracy for code
that is tracking the scroll position, but can lead to scroll performance
problems due to the volume of information being send over the bridge.
You will not notice a difference between values set between 1-16 as the
JS run loop is synced to the screen refresh rate. If you do not need precise
scroll position tracking, set this value higher to limit the information
being sent across the bridge. The default value is zero, which results in
the scroll event being sent only once each time the view is scrolled.


| Type | Required | Platform |
| - | - | - |
| number | No | iOS  |




---

### `scrollIndicatorInsets`

The amount by which the scroll view indicators are inset from the edges
of the scroll view. This should normally be set to the same value as
the `contentInset`. Defaults to `{0, 0, 0, 0}`.


| Type | Required | Platform |
| - | - | - |
| object: {top: number, left: number, bottom: number, right: number} | No | iOS  |




---

### `scrollsToTop`

When true, the scroll view scrolls to top when the status bar is tapped.
The default value is true.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `snapToAlignment`

When `snapToInterval` is set, `snapToAlignment` will define the relationship
of the snapping to the scroll view.

  - `'start'` (the default) will align the snap at the left (horizontal) or top (vertical)
  - `'center'` will align the snap in the center
  - `'end'` will align the snap at the right (horizontal) or bottom (vertical)



| Type | Required | Platform |
| - | - | - |
| enum('start', 'center', 'end') | No | iOS  |




---

### `snapToInterval`

When set, causes the scroll view to stop at multiples of the value of
`snapToInterval`. This can be used for paginating through children
that have lengths smaller than the scroll view. Typically used in
combination with `snapToAlignment` and `decelerationRate="fast"`.
Overrides less configurable `pagingEnabled` prop.



| Type | Required | Platform |
| - | - | - |
| number | No | iOS  |




---

### `zoomScale`

The current scale of the scroll view content. The default value is 1.0.


| Type | Required | Platform |
| - | - | - |
| number | No | iOS  |


---

### `DEPRECATED_sendUpdatedChildFrames`

**Deprecated.** When true, ScrollView will emit updateChildFrames data in scroll events,
otherwise will not compute or emit child frame data.  This only exists
to support legacy issues, `onLayout` should be used instead to retrieve
frame data.
The default value is false.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




## Methods

### `scrollTo()`

```javascript
scrollTo([y]: number, object, [x]: number, [animated]: boolean)
```

Scrolls to a given x, y offset, either immediately or with a smooth animation.

Example:

`scrollTo({x: 0, y: 0, animated: true})`

Note: The weird function signature is due to the fact that, for historical reasons,
the function also accepts separate arguments as an alternative to the options object.
This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.



---

### `scrollToEnd()`

```javascript
scrollToEnd([options]: object)
```

If this is a vertical ScrollView scrolls to the bottom.
If this is a horizontal ScrollView scrolls to the right.

Use `scrollToEnd({animated: true})` for smooth animated scrolling,
`scrollToEnd({animated: false})` for immediate scrolling.
If no options are passed, `animated` defaults to true.



---

### `scrollWithoutAnimationTo()`

```javascript
scrollWithoutAnimationTo(y, x)
```

Deprecated, use `scrollTo` instead.



---

### `flashScrollIndicators()`

```javascript
flashScrollIndicators()
```

Displays the scroll indicators momentarily.



