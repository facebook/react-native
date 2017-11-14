---
id: view-props
title: View Props
layout: docs
category: APIs
permalink: docs/view-props.html
next: view-style-props
previous: shadow-props
---
### Props

- [`onStartShouldSetResponder`](docs/view-props.html#onstartshouldsetresponder)
- [`accessibilityLabel`](docs/view-props.html#accessibilitylabel)
- [`hitSlop`](docs/view-props.html#hitslop)
- [`nativeID`](docs/view-props.html#nativeid)
- [`onAccessibilityTap`](docs/view-props.html#onaccessibilitytap)
- [`onLayout`](docs/view-props.html#onlayout)
- [`onMagicTap`](docs/view-props.html#onmagictap)
- [`onMoveShouldSetResponder`](docs/view-props.html#onmoveshouldsetresponder)
- [`onMoveShouldSetResponderCapture`](docs/view-props.html#onmoveshouldsetrespondercapture)
- [`onResponderGrant`](docs/view-props.html#onrespondergrant)
- [`onResponderMove`](docs/view-props.html#onrespondermove)
- [`onResponderReject`](docs/view-props.html#onresponderreject)
- [`onResponderRelease`](docs/view-props.html#onresponderrelease)
- [`onResponderTerminate`](docs/view-props.html#onresponderterminate)
- [`onResponderTerminationRequest`](docs/view-props.html#onresponderterminationrequest)
- [`accessible`](docs/view-props.html#accessible)
- [`onStartShouldSetResponderCapture`](docs/view-props.html#onstartshouldsetrespondercapture)
- [`pointerEvents`](docs/view-props.html#pointerevents)
- [`removeClippedSubviews`](docs/view-props.html#removeclippedsubviews)
- [`style`](docs/view-props.html#style)
- [`testID`](docs/view-props.html#testid)
- [`accessibilityComponentType`](docs/view-props.html#accessibilitycomponenttype)
- [`accessibilityLiveRegion`](docs/view-props.html#accessibilityliveregion)
- [`collapsable`](docs/view-props.html#collapsable)
- [`importantForAccessibility`](docs/view-props.html#importantforaccessibility)
- [`needsOffscreenAlphaCompositing`](docs/view-props.html#needsoffscreenalphacompositing)
- [`renderToHardwareTextureAndroid`](docs/view-props.html#rendertohardwaretextureandroid)
- [`accessibilityTraits`](docs/view-props.html#accessibilitytraits)
- [`accessibilityViewIsModal`](docs/view-props.html#accessibilityviewismodal)
- [`shouldRasterizeIOS`](docs/view-props.html#shouldrasterizeios)






---

# Reference

## Props

### `onStartShouldSetResponder`

Does this view want to become responder on the start of a touch?

`View.props.onStartShouldSetResponder: (event) => [true | false]`, where `event` is a
synthetic touch event as described above.

| Type | Required |
| - | - |
| function | No |




---

### `accessibilityLabel`

Overrides the text that's read by the screen reader when the user interacts
with the element. By default, the label is constructed by traversing all the
children and accumulating all the `Text` nodes separated by space.

| Type | Required |
| - | - |
| node | No |




---

### `hitSlop`

This defines how far a touch event can start away from the view.
Typical interface guidelines recommend touch targets that are at least
30 - 40 points/density-independent pixels.

For example, if a touchable view has a height of 20 the touchable height can be extended to
40 with `hitSlop={{top: 10, bottom: 10, left: 0, right: 0}}`

> The touch area never extends past the parent view bounds and the Z-index
> of sibling views always takes precedence if a touch hits two overlapping
> views.

| Type | Required |
| - | - |
| object: {top: number, left: number, bottom: number, right: number} | No |




---

### `nativeID`

Used to locate this view from native classes.

> This disables the 'layout-only view removal' optimization for this view!

| Type | Required |
| - | - |
| string | No |




---

### `onAccessibilityTap`

When `accessible` is true, the system will try to invoke this function
when the user performs accessibility tap gesture.

| Type | Required |
| - | - |
| function | No |




---

### `onLayout`

Invoked on mount and layout changes with:

`{nativeEvent: { layout: {x, y, width, height}}}`

This event is fired immediately once the layout has been calculated, but
the new layout may not yet be reflected on the screen at the time the
event is received, especially if a layout animation is in progress.

| Type | Required |
| - | - |
| function | No |




---

### `onMagicTap`

When `accessible` is `true`, the system will invoke this function when the
user performs the magic tap gesture.

| Type | Required |
| - | - |
| function | No |




---

### `onMoveShouldSetResponder`

Does this view want to "claim" touch responsiveness? This is called for every touch move on
the `View` when it is not the responder.

`View.props.onMoveShouldSetResponder: (event) => [true | false]`, where `event` is a
synthetic touch event as described above.

| Type | Required |
| - | - |
| function | No |




---

### `onMoveShouldSetResponderCapture`

If a parent `View` wants to prevent a child `View` from becoming responder on a move,
it should have this handler which returns `true`.

`View.props.onMoveShouldSetResponderCapture: (event) => [true | false]`, where `event` is a
synthetic touch event as described above.

| Type | Required |
| - | - |
| function | No |




---

### `onResponderGrant`

The View is now responding for touch events. This is the time to highlight and show the user
what is happening.

`View.props.onResponderGrant: (event) => {}`, where `event` is a synthetic touch event as
described above.

| Type | Required |
| - | - |
| function | No |




---

### `onResponderMove`

The user is moving their finger.

`View.props.onResponderMove: (event) => {}`, where `event` is a synthetic touch event as
described above.

| Type | Required |
| - | - |
| function | No |




---

### `onResponderReject`

Another responder is already active and will not release it to that `View` asking to be
the responder.

`View.props.onResponderReject: (event) => {}`, where `event` is a synthetic touch event as
described above.

| Type | Required |
| - | - |
| function | No |




---

### `onResponderRelease`

Fired at the end of the touch.

`View.props.onResponderRelease: (event) => {}`, where `event` is a synthetic touch event as
described above.

| Type | Required |
| - | - |
| function | No |




---

### `onResponderTerminate`

The responder has been taken from the `View`. Might be taken by other views after a call to
`onResponderTerminationRequest`, or might be taken by the OS without asking (e.g., happens
with control center/ notification center on iOS)

`View.props.onResponderTerminate: (event) => {}`, where `event` is a synthetic touch event as
described above.

| Type | Required |
| - | - |
| function | No |




---

### `onResponderTerminationRequest`

Some other `View` wants to become responder and is asking this `View` to release its
responder. Returning `true` allows its release.

`View.props.onResponderTerminationRequest: (event) => {}`, where `event` is a synthetic touch
event as described above.

| Type | Required |
| - | - |
| function | No |




---

### `accessible`

When `true`, indicates that the view is an accessibility element. By default,
all the touchable elements are accessible.

| Type | Required |
| - | - |
| bool | No |




---

### `onStartShouldSetResponderCapture`

If a parent `View` wants to prevent a child `View` from becoming responder on a touch start,
it should have this handler which returns `true`.

`View.props.onStartShouldSetResponderCapture: (event) => [true | false]`, where `event` is a
synthetic touch event as described above.

| Type | Required |
| - | - |
| function | No |




---

### `pointerEvents`

Controls whether the `View` can be the target of touch events.

  - `'auto'`: The View can be the target of touch events.
  - `'none'`: The View is never the target of touch events.
  - `'box-none'`: The View is never the target of touch events but it's
    subviews can be. It behaves like if the view had the following classes
    in CSS:
```
.box-none {
     pointer-events: none;
}
.box-none * {
     pointer-events: all;
}
```
  - `'box-only'`: The view can be the target of touch events but it's
    subviews cannot be. It behaves like if the view had the following classes
    in CSS:
```
.box-only {
     pointer-events: all;
}
.box-only * {
     pointer-events: none;
}
```
> Since `pointerEvents` does not affect layout/appearance, and we are
> already deviating from the spec by adding additional modes, we opt to not
> include `pointerEvents` on `style`. On some platforms, we would need to
> implement it as a `className` anyways. Using `style` or not is an
> implementation detail of the platform.

| Type | Required |
| - | - |
| enum('box-none', 'none', 'box-only', 'auto') | No |




---

### `removeClippedSubviews`

This is a special performance property exposed by `RCTView` and is useful
for scrolling content when there are many subviews, most of which are
offscreen. For this property to be effective, it must be applied to a
view that contains many subviews that extend outside its bound. The
subviews must also have `overflow: hidden`, as should the containing view
(or one of its superviews).

| Type | Required |
| - | - |
| bool | No |




---

### `style`



| Type | Required |
| - | - |
| style | No |




---

### `testID`

Used to locate this view in end-to-end tests.

> This disables the 'layout-only view removal' optimization for this view!

| Type | Required |
| - | - |
| string | No |




---

### `accessibilityComponentType`

Indicates to accessibility services to treat UI component like a
native one. Works for Android only.

Possible values are one of:

- `'none'`
- `'button'`
- `'radiobutton_checked'`
- `'radiobutton_unchecked'`



| Type | Required | Platform |
| - | - | - |
| AccessibilityComponentTypes | No | Android  |




---

### `accessibilityLiveRegion`

Indicates to accessibility services whether the user should be notified
when this view changes. Works for Android API >= 19 only.
Possible values:

- `'none'` - Accessibility services should not announce changes to this view.
- `'polite'`- Accessibility services should announce changes to this view.
- `'assertive'` - Accessibility services should interrupt ongoing speech to immediately announce changes to this view.

See the [Android `View` docs](http://developer.android.com/reference/android/view/View.html#attr_android:accessibilityLiveRegion)
for reference.



| Type | Required | Platform |
| - | - | - |
| enum('none', 'polite', 'assertive') | No | Android  |




---

### `collapsable`

Views that are only used to layout their children or otherwise don't draw
anything may be automatically removed from the native hierarchy as an
optimization. Set this property to `false` to disable this optimization and
ensure that this `View` exists in the native view hierarchy.



| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `importantForAccessibility`

Controls how view is important for accessibility which is if it
fires accessibility events and if it is reported to accessibility services
that query the screen. Works for Android only.

Possible values:

 - `'auto'` - The system determines whether the view is important for accessibility -
   default (recommended).
 - `'yes'` - The view is important for accessibility.
 - `'no'` - The view is not important for accessibility.
 - `'no-hide-descendants'` - The view is not important for accessibility,
   nor are any of its descendant views.

See the [Android `importantForAccessibility` docs](http://developer.android.com/reference/android/R.attr.html#importantForAccessibility)
for reference.



| Type | Required | Platform |
| - | - | - |
| enum('auto', 'yes', 'no', 'no-hide-descendants') | No | Android  |




---

### `needsOffscreenAlphaCompositing`

Whether this `View` needs to rendered offscreen and composited with an alpha
in order to preserve 100% correct colors and blending behavior. The default
(`false`) falls back to drawing the component and its children with an alpha
applied to the paint used to draw each element instead of rendering the full
component offscreen and compositing it back with an alpha value. This default
may be noticeable and undesired in the case where the `View` you are setting
an opacity on has multiple overlapping elements (e.g. multiple overlapping
`View`s, or text and a background).

Rendering offscreen to preserve correct alpha behavior is extremely
expensive and hard to debug for non-native developers, which is why it is
not turned on by default. If you do need to enable this property for an
animation, consider combining it with renderToHardwareTextureAndroid if the
view **contents** are static (i.e. it doesn't need to be redrawn each frame).
If that property is enabled, this View will be rendered off-screen once,
saved in a hardware texture, and then composited onto the screen with an alpha
each frame without having to switch rendering targets on the GPU.



| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `renderToHardwareTextureAndroid`

Whether this `View` should render itself (and all of its children) into a
single hardware texture on the GPU.

On Android, this is useful for animations and interactions that only
modify opacity, rotation, translation, and/or scale: in those cases, the
view doesn't have to be redrawn and display lists don't need to be
re-executed. The texture can just be re-used and re-composited with
different parameters. The downside is that this can use up limited video
memory, so this prop should be set back to false at the end of the
interaction/animation.



| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `accessibilityTraits`

Provides additional traits to screen reader. By default no traits are
provided unless specified otherwise in element.

You can provide one trait or an array of many traits.

Possible values for `AccessibilityTraits` are:

- `'none'` - The element has no traits.
- `'button'` - The element should be treated as a button.
- `'link'` - The element should be treated as a link.
- `'header'` - The element is a header that divides content into sections.
- `'search'` - The element should be treated as a search field.
- `'image'` - The element should be treated as an image.
- `'selected'` - The element is selected.
- `'plays'` - The element plays sound.
- `'key'` - The element should be treated like a keyboard key.
- `'text'` - The element should be treated as text.
- `'summary'` - The element provides app summary information.
- `'disabled'` - The element is disabled.
- `'frequentUpdates'` - The element frequently changes its value.
- `'startsMedia'` - The element starts a media session.
- `'adjustable'` - The element allows adjustment over a range of values.
- `'allowsDirectInteraction'` - The element allows direct touch interaction for VoiceOver users.
- `'pageTurn'` - Informs VoiceOver that it should scroll to the next page when it finishes reading the contents of the element.

See the [Accessibility guide](docs/accessibility.html#accessibilitytraits-ios)
for more information.



| Type | Required | Platform |
| - | - | - |
| AccessibilityTraits, ,array of AccessibilityTraits | No | iOS  |




---

### `accessibilityViewIsModal`

A value indicating whether VoiceOver should ignore the elements
within views that are siblings of the receiver.
Default is `false`.

See the [Accessibility guide](docs/accessibility.html#accessibilitytraits-ios)
for more information.



| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `shouldRasterizeIOS`

Whether this `View` should be rendered as a bitmap before compositing.

On iOS, this is useful for animations and interactions that do not
modify this component's dimensions nor its children; for example, when
translating the position of a static view, rasterization allows the
renderer to reuse a cached bitmap of a static view and quickly composite
it during each frame.

Rasterization incurs an off-screen drawing pass and the bitmap consumes
memory. Test and measure when using this property.



| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |






