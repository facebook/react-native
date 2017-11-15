---
id: refreshcontrol
title: RefreshControl
layout: docs
category: components
permalink: docs/refreshcontrol.html
next: scrollview
previous: progressviewios
---
This component is used inside a ScrollView or ListView to add pull to refresh
functionality. When the ScrollView is at `scrollY: 0`, swiping down
triggers an `onRefresh` event.

### Usage example

``` js
class RefreshableList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  _onRefresh() {
    this.setState({refreshing: true});
    fetchData().then(() => {
      this.setState({refreshing: false});
    });
  }

  render() {
    return (
      <ListView
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh.bind(this)}
          />
        }
        ...
      >
      ...
      </ListView>
    );
  }
  ...
}
```

__Note:__ `refreshing` is a controlled prop, this is why it needs to be set to true
in the `onRefresh` function otherwise the refresh indicator will stop immediately.

### Props

- [View props...](docs/view-props.html)
- [`refreshing`](docs/refreshcontrol.html#refreshing)
- [`onRefresh`](docs/refreshcontrol.html#onrefresh)
- [`colors`](docs/refreshcontrol.html#colors)
- [`enabled`](docs/refreshcontrol.html#enabled)
- [`progressBackgroundColor`](docs/refreshcontrol.html#progressbackgroundcolor)
- [`progressViewOffset`](docs/refreshcontrol.html#progressviewoffset)
- [`size`](docs/refreshcontrol.html#size)
- [`tintColor`](docs/refreshcontrol.html#tintcolor)
- [`title`](docs/refreshcontrol.html#title)
- [`titleColor`](docs/refreshcontrol.html#titlecolor)






---

# Reference

## Props

### `refreshing`

Whether the view should be indicating an active refresh.

| Type | Required |
| - | - |
| bool | Yes |




---

### `onRefresh`

Called when the view starts refreshing.

| Type | Required |
| - | - |
| function | No |




---

### `colors`

The colors (at least one) that will be used to draw the refresh indicator.


| Type | Required | Platform |
| - | - | - |
| array of [color](docs/colors.html) | No | Android  |




---

### `enabled`

Whether the pull to refresh functionality is enabled.


| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `progressBackgroundColor`

The background color of the refresh indicator.


| Type | Required | Platform |
| - | - | - |
| [color](docs/colors.html) | No | Android  |




---

### `progressViewOffset`

Progress view top offset


| Type | Required | Platform |
| - | - | - |
| number | No | Android  |




---

### `size`

Size of the refresh indicator, see RefreshControl.SIZE.


| Type | Required | Platform |
| - | - | - |
| enum(RefreshLayoutConsts.SIZE.DEFAULT, RefreshLayoutConsts.SIZE.LARGE) | No | Android  |




---

### `tintColor`

The color of the refresh indicator.


| Type | Required | Platform |
| - | - | - |
| [color](docs/colors.html) | No | iOS  |




---

### `title`

The title displayed under the refresh indicator.


| Type | Required | Platform |
| - | - | - |
| string | No | iOS  |




---

### `titleColor`

Title color.


| Type | Required | Platform |
| - | - | - |
| [color](docs/colors.html) | No | iOS  |






