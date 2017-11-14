---
id: image
title: Image
---
A React component for displaying different types of images,
including network images, static resources, temporary local images, and
images from local disk, such as the camera roll.

This example shows fetching and displaying an image from local storage
as well as one from network and even from data provided in the `'data:'` uri scheme.

> Note that for network and data images, you will need to manually specify the dimensions of your image!

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, View, Image } from 'react-native';

export default class DisplayAnImage extends Component {
  render() {
    return (
      <View>
        <Image
          source={require('./img/favicon.png')}
        />
        <Image
          style={{width: 50, height: 50}}
          source={{uri: 'https://facebook.github.io/react-native/img/favicon.png'}}
        />
        <Image
          style={{width: 66, height: 58}}
          source={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAAAEXRFWHRTb2Z0d2FyZQBwbmdjcnVzaEB1SfMAAABQSURBVGje7dSxCQBACARB+2/ab8BEeQNhFi6WSYzYLYudDQYGBgYGBgYGBgYGBgYGBgZmcvDqYGBgmhivGQYGBgYGBgYGBgYGBgYGBgbmQw+P/eMrC5UTVAAAAABJRU5ErkJggg=='}}
        />
      </View>
    );
  }
}

// skip this line if using Create React Native App
AppRegistry.registerComponent('DisplayAnImage', () => DisplayAnImage);
```

You can also add `style` to an image:

```ReactNativeWebPlayer
import React, { Component } from 'react';
import { AppRegistry, View, Image, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  stretch: {
    width: 50,
    height: 200
  }
});

export default class DisplayAnImageWithStyle extends Component {
  render() {
    return (
      <View>
        <Image
          style={styles.stretch}
          source={require('./img/favicon.png')}
        />
      </View>
    );
  }
}

// skip these lines if using Create React Native App
AppRegistry.registerComponent(
  'DisplayAnImageWithStyle',
  () => DisplayAnImageWithStyle
);
```

### GIF and WebP support on Android

When building your own native code, GIF and WebP are not supported by default on Android.

You will need to add some optional modules in `android/app/build.gradle`, depending on the needs of your app.

```
dependencies {
  // If your app supports Android versions before Ice Cream Sandwich (API level 14)
  compile 'com.facebook.fresco:animated-base-support:1.3.0'

  // For animated GIF support
  compile 'com.facebook.fresco:animated-gif:1.3.0'

  // For WebP support, including animated WebP
  compile 'com.facebook.fresco:animated-webp:1.3.0'
  compile 'com.facebook.fresco:webpsupport:1.3.0'

  // For WebP support, without animations
  compile 'com.facebook.fresco:webpsupport:1.3.0'
}
```

Also, if you use GIF with ProGuard, you will need to add this rule in `proguard-rules.pro` :
```
-keep class com.facebook.imagepipeline.animated.factory.AnimatedFactoryImpl {
  public AnimatedFactoryImpl(com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory, com.facebook.imagepipeline.core.ExecutorSupplier);
}
```

### Props

- [`blurRadius`](docs/image.html#blurradius)
- [`onLayout`](docs/image.html#onlayout)
- [`onLoad`](docs/image.html#onload)
- [`onLoadEnd`](docs/image.html#onloadend)
- [`onLoadStart`](docs/image.html#onloadstart)
- [`resizeMode`](docs/image.html#resizemode)
- [`source`](docs/image.html#source)
- [`onError`](docs/image.html#onerror)
- [`testID`](docs/image.html#testid)
- [`resizeMethod`](docs/image.html#resizemethod)
- [`accessibilityLabel`](docs/image.html#accessibilitylabel)
- [`accessible`](docs/image.html#accessible)
- [`capInsets`](docs/image.html#capinsets)
- [`defaultSource`](docs/image.html#defaultsource)
- [`onPartialLoad`](docs/image.html#onpartialload)
- [`onProgress`](docs/image.html#onprogress)
- [`style`](docs/image.html#style)




### Methods

- [`getSize`](docs/image.html#getsize)
- [`prefetch`](docs/image.html#prefetch)




---

# Reference

## Props

### `blurRadius`

blurRadius: the blur radius of the blur filter added to the image

| Type | Required |
| - | - |
| number | No |




---

### `onLayout`

Invoked on mount and layout changes with
`{nativeEvent: {layout: {x, y, width, height}}}`.

| Type | Required |
| - | - |
| function | No |




---

### `onLoad`

Invoked when load completes successfully.

| Type | Required |
| - | - |
| function | No |




---

### `onLoadEnd`

Invoked when load either succeeds or fails.

| Type | Required |
| - | - |
| function | No |




---

### `onLoadStart`

Invoked on load start.

e.g., `onLoadStart={(e) => this.setState({loading: true})}`

| Type | Required |
| - | - |
| function | No |




---

### `resizeMode`

Determines how to resize the image when the frame doesn't match the raw
image dimensions.

- `cover`: Scale the image uniformly (maintain the image's aspect ratio)
so that both dimensions (width and height) of the image will be equal
to or larger than the corresponding dimension of the view (minus padding).

- `contain`: Scale the image uniformly (maintain the image's aspect ratio)
so that both dimensions (width and height) of the image will be equal to
or less than the corresponding dimension of the view (minus padding).

- `stretch`: Scale width and height independently, This may change the
aspect ratio of the src.

- `repeat`: Repeat the image to cover the frame of the view. The
image will keep it's size and aspect ratio. (iOS only)

| Type | Required |
| - | - |
| enum('cover', 'contain', 'stretch', 'repeat', 'center') | No |




---

### `source`

The image source (either a remote URL or a local file resource).

This prop can also contain several remote URLs, specified together with
their width and height and potentially with scale/other URI arguments.
The native side will then choose the best `uri` to display based on the
measured size of the image container. A `cache` property can be added to
control how networked request interacts with the local cache.

The currently supported formats are `png`, `jpg`, `jpeg`, `bmp`, `gif`,
`webp` (Android only), `psd` (iOS only).

| Type | Required |
| - | - |
| ImageSourcePropType | No |




---

### `onError`

Invoked on load error with `{nativeEvent: {error}}`.

| Type | Required |
| - | - |
| function | No |




---

### `testID`

A unique identifier for this element to be used in UI Automation
testing scripts.

| Type | Required |
| - | - |
| string | No |




---

### `resizeMethod`

The mechanism that should be used to resize the image when the image's dimensions
differ from the image view's dimensions. Defaults to `auto`.

- `auto`: Use heuristics to pick between `resize` and `scale`.

- `resize`: A software operation which changes the encoded image in memory before it
gets decoded. This should be used instead of `scale` when the image is much larger
than the view.

- `scale`: The image gets drawn downscaled or upscaled. Compared to `resize`, `scale` is
faster (usually hardware accelerated) and produces higher quality images. This
should be used if the image is smaller than the view. It should also be used if the
image is slightly bigger than the view.

More details about `resize` and `scale` can be found at http://frescolib.org/docs/resizing-rotating.html.



| Type | Required | Platform |
| - | - | - |
| enum('auto', 'resize', 'scale') | No | Android  |




---

### `accessibilityLabel`

The text that's read by the screen reader when the user interacts with
the image.


| Type | Required | Platform |
| - | - | - |
| node | No | iOS  |




---

### `accessible`

When true, indicates the image is an accessibility element.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `capInsets`

When the image is resized, the corners of the size specified
by `capInsets` will stay a fixed size, but the center content and borders
of the image will be stretched.  This is useful for creating resizable
rounded buttons, shadows, and other resizable assets.  More info in the
[official Apple documentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/index.html#//apple_ref/occ/instm/UIImage/resizableImageWithCapInsets).



| Type | Required | Platform |
| - | - | - |
| object: {top: number, left: number, bottom: number, right: number} | No | iOS  |




---

### `defaultSource`

A static image to display while loading the image source.

- `uri` - a string representing the resource identifier for the image, which
should be either a local file path or the name of a static image resource
(which should be wrapped in the `require('./path/to/image.png')` function).
- `width`, `height` - can be specified if known at build time, in which case
these will be used to set the default `<Image/>` component dimensions.
- `scale` - used to indicate the scale factor of the image. Defaults to 1.0 if
unspecified, meaning that one image pixel equates to one display point / DIP.
- `number` - Opaque type returned by something like `require('./image.jpg')`.



| Type | Required | Platform |
| - | - | - |
| object: {uri: string,width: number,height: number,scale: number}, ,number | No | iOS  |




---

### `onPartialLoad`

Invoked when a partial load of the image is complete. The definition of
what constitutes a "partial load" is loader specific though this is meant
for progressive JPEG loads.


| Type | Required | Platform |
| - | - | - |
| function | No | iOS  |




---

### `onProgress`

Invoked on download progress with `{nativeEvent: {loaded, total}}`.


| Type | Required | Platform |
| - | - | - |
| function | No | iOS  |


---

### `style`

| Type | Required |
| - | - |
| [style](docs/imagestyleproptypes.html) | No |

## Methods

### `getSize()`

```javascript
static getSize(uri: string, success: function, [failure]: function): void
```

Retrieve the width and height (in pixels) of an image prior to displaying it. This method can fail if the image cannot be found, or fails to download.

In order to retrieve the image dimensions, the image may first need to be loaded or downloaded, after which it will be cached. This means that in principle you could use this method to preload images, however it is not optimized for that purpose, and may in future be implemented in a way that does not fully load/download the image data. A proper, supported way to preload images will be provided as a separate API.

Does not work for static image resources.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| uri | string | Yes | The location of the image. |
| success | function | Yes | The function that will be called if the image was successfully found and widthand height retrieved. |
| failure | function | No | The function that will be called if there was an error, such as failing toto retrieve the image. |




---

### `prefetch()`

```javascript
Image.prefetch(url: string): 
```

Prefetches a remote image for later use by downloading it to the disk
cache

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| url | string | Yes | The remote location of the image. |




