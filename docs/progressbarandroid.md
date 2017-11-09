---
id: progressbarandroid
title: ProgressBarAndroid
layout: docs
category: components
permalink: docs/progressbarandroid.html
next: progressviewios
previous: pickerios
---
React component that wraps the Android-only `ProgressBar`. This component is used to indicate
that the app is loading or there is some activity in the app.

Example:

```
render: function() {
  var progressBar =
    <View style={styles.container}>
      <ProgressBar styleAttr="Inverse" />
    </View>;

  return (
    <MyLoadingComponent
      componentView={componentView}
      loadingView={progressBar}
      style={styles.loadingComponent}
    />
  );
},
```

### Props

- [View props...](docs/view-props.html)
- [`animating`](docs/progressbarandroid.html#animating)
- [`color`](docs/progressbarandroid.html#color)
- [`indeterminate`](docs/progressbarandroid.html#indeterminate)
- [`progress`](docs/progressbarandroid.html#progress)
- [`styleAttr`](docs/progressbarandroid.html#styleattr)
- [`testID`](docs/progressbarandroid.html#testid)






---

# Reference

## Props

### `animating`

Whether to show the ProgressBar (true, the default) or hide it (false).

| Type | Required |
| - | - |
| bool | No |




---

### `color`

Color of the progress bar.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `indeterminate`

If the progress bar will show indeterminate progress. Note that this
can only be false if styleAttr is Horizontal.

| Type | Required |
| - | - |
| indeterminateType | No |




---

### `progress`

The progress value (between 0 and 1).

| Type | Required |
| - | - |
| number | No |




---

### `styleAttr`

Style of the ProgressBar. One of:

- `Horizontal`
- `Normal` (default)
- `Small`
- `Large`
- `Inverse`
- `SmallInverse`
- `LargeInverse`

| Type | Required |
| - | - |
| enum('Horizontal', 'Normal', 'Small', 'Large', 'Inverse', 'SmallInverse', 'LargeInverse') | No |




---

### `testID`

Used to locate this view in end-to-end tests.

| Type | Required |
| - | - |
| string | No |






