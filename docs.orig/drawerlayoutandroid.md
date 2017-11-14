---
id: drawerlayoutandroid
title: DrawerLayoutAndroid
---
React component that wraps the platform `DrawerLayout` (Android only). The
Drawer (typically used for navigation) is rendered with `renderNavigationView`
and direct children are the main view (where your content goes). The navigation
view is initially not visible on the screen, but can be pulled in from the
side of the window specified by the `drawerPosition` prop and its width can
be set by the `drawerWidth` prop.

Example:

```
render: function() {
  var navigationView = (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <Text style={{margin: 10, fontSize: 15, textAlign: 'left'}}>I'm in the Drawer!</Text>
    </View>
  );
  return (
    <DrawerLayoutAndroid
      drawerWidth={300}
      drawerPosition={DrawerLayoutAndroid.positions.Left}
      renderNavigationView={() => navigationView}>
      <View style={{flex: 1, alignItems: 'center'}}>
        <Text style={{margin: 10, fontSize: 15, textAlign: 'right'}}>Hello</Text>
        <Text style={{margin: 10, fontSize: 15, textAlign: 'right'}}>World!</Text>
      </View>
    </DrawerLayoutAndroid>
  );
},
```

### Props

- [View props...](docs/view-props.html)
- [`renderNavigationView`](docs/drawerlayoutandroid.html#rendernavigationview)
- [`onDrawerClose`](docs/drawerlayoutandroid.html#ondrawerclose)
- [`drawerPosition`](docs/drawerlayoutandroid.html#drawerposition)
- [`drawerWidth`](docs/drawerlayoutandroid.html#drawerwidth)
- [`keyboardDismissMode`](docs/drawerlayoutandroid.html#keyboarddismissmode)
- [`drawerLockMode`](docs/drawerlayoutandroid.html#drawerlockmode)
- [`onDrawerOpen`](docs/drawerlayoutandroid.html#ondraweropen)
- [`onDrawerSlide`](docs/drawerlayoutandroid.html#ondrawerslide)
- [`onDrawerStateChanged`](docs/drawerlayoutandroid.html#ondrawerstatechanged)
- [`drawerBackgroundColor`](docs/drawerlayoutandroid.html#drawerbackgroundcolor)
- [`statusBarBackgroundColor`](docs/drawerlayoutandroid.html#statusbarbackgroundcolor)




### Methods

- [`openDrawer`](docs/drawerlayoutandroid.html#opendrawer)
- [`closeDrawer`](docs/drawerlayoutandroid.html#closedrawer)




---

# Reference

## Props

### `renderNavigationView`

The navigation view that will be rendered to the side of the screen and can be pulled in.

| Type | Required |
| - | - |
| function | Yes |




---

### `onDrawerClose`

Function called whenever the navigation view has been closed.

| Type | Required |
| - | - |
| function | No |




---

### `drawerPosition`

Specifies the side of the screen from which the drawer will slide in.

| Type | Required |
| - | - |
| enum(DrawerConsts.DrawerPosition.Left, DrawerConsts.DrawerPosition.Right) | No |




---

### `drawerWidth`

Specifies the width of the drawer, more precisely the width of the view that be pulled in
from the edge of the window.

| Type | Required |
| - | - |
| number | No |




---

### `keyboardDismissMode`

Determines whether the keyboard gets dismissed in response to a drag.
  - 'none' (the default), drags do not dismiss the keyboard.
  - 'on-drag', the keyboard is dismissed when a drag begins.

| Type | Required |
| - | - |
| enum('none', 'on-drag') | No |




---

### `drawerLockMode`

Specifies the lock mode of the drawer. The drawer can be locked in 3 states:
- unlocked (default), meaning that the drawer will respond (open/close) to touch gestures.
- locked-closed, meaning that the drawer will stay closed and not respond to gestures.
- locked-open, meaning that the drawer will stay opened and not respond to gestures.
The drawer may still be opened and closed programmatically (`openDrawer`/`closeDrawer`).

| Type | Required |
| - | - |
| enum('unlocked', 'locked-closed', 'locked-open') | No |




---

### `onDrawerOpen`

Function called whenever the navigation view has been opened.

| Type | Required |
| - | - |
| function | No |




---

### `onDrawerSlide`

Function called whenever there is an interaction with the navigation view.

| Type | Required |
| - | - |
| function | No |




---

### `onDrawerStateChanged`

Function called when the drawer state has changed. The drawer can be in 3 states:
- idle, meaning there is no interaction with the navigation view happening at the time
- dragging, meaning there is currently an interaction with the navigation view
- settling, meaning that there was an interaction with the navigation view, and the
navigation view is now finishing its closing or opening animation

| Type | Required |
| - | - |
| function | No |




---

### `drawerBackgroundColor`

Specifies the background color of the drawer. The default value is white.
If you want to set the opacity of the drawer, use rgba. Example:

```
return (
  <DrawerLayoutAndroid drawerBackgroundColor="rgba(0,0,0,0.5)">
  </DrawerLayoutAndroid>
);
```

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `statusBarBackgroundColor`

Make the drawer take the entire screen and draw the background of the
status bar to allow it to open over the status bar. It will only have an
effect on API 21+.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |






## Methods

### `openDrawer()`

```javascript
openDrawer()
```

Opens the drawer.



---

### `closeDrawer()`

```javascript
closeDrawer()
```

Closes the drawer.



