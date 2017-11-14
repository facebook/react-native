---
id: webview
title: WebView
---
`WebView` renders web content in a native view.

```
import React, { Component } from 'react';
import { WebView } from 'react-native';

class MyWeb extends Component {
  render() {
    return (
      <WebView
        source={{uri: 'https://github.com/facebook/react-native'}}
        style={{marginTop: 20}}
      />
    );
  }
}
```

You can use this component to navigate back and forth in the web view's
history and configure various properties for the web content.

### Props

- [View props...](docs/view-props.html)
- [`source`](docs/webview.html#source)
- [`automaticallyAdjustContentInsets`](docs/webview.html#automaticallyadjustcontentinsets)
- [`injectJavaScript`](docs/webview.html#injectjavascript)
- [`injectedJavaScript`](docs/webview.html#injectedjavascript)
- [`mediaPlaybackRequiresUserAction`](docs/webview.html#mediaplaybackrequiresuseraction)
- [`nativeConfig`](docs/webview.html#nativeconfig)
- [`onError`](docs/webview.html#onerror)
- [`onLoad`](docs/webview.html#onload)
- [`onLoadEnd`](docs/webview.html#onloadend)
- [`onLoadStart`](docs/webview.html#onloadstart)
- [`onMessage`](docs/webview.html#onmessage)
- [`onNavigationStateChange`](docs/webview.html#onnavigationstatechange)
- [`renderError`](docs/webview.html#rendererror)
- [`renderLoading`](docs/webview.html#renderloading)
- [`scalesPageToFit`](docs/webview.html#scalespagetofit)
- [`onShouldStartLoadWithRequest`](docs/webview.html#onshouldstartloadwithrequest)
- [`startInLoadingState`](docs/webview.html#startinloadingstate)
- [`style`](docs/webview.html#style)
- [`decelerationRate`](docs/webview.html#decelerationrate)
- [`domStorageEnabled`](docs/webview.html#domstorageenabled)
- [`javaScriptEnabled`](docs/webview.html#javascriptenabled)
- [`mixedContentMode`](docs/webview.html#mixedcontentmode)
- [`thirdPartyCookiesEnabled`](docs/webview.html#thirdpartycookiesenabled)
- [`userAgent`](docs/webview.html#useragent)
- [`allowsInlineMediaPlayback`](docs/webview.html#allowsinlinemediaplayback)
- [`bounces`](docs/webview.html#bounces)
- [`contentInset`](docs/webview.html#contentinset)
- [`dataDetectorTypes`](docs/webview.html#datadetectortypes)
- [`scrollEnabled`](docs/webview.html#scrollenabled)
- [`url`](docs/webview.html#url)
- [`html`](docs/webview.html#html)




### Methods

- [`extraNativeComponentConfig`](docs/webview.html#extranativecomponentconfig)




---

# Reference

## Props

### `source`

Loads static html or a uri (with optional headers) in the WebView.

| Type | Required |
| - | - |
| object: {uri: string, method: string, headers: object, body: string},object: {html: string, baseUrl: string}, number | No |

**Keys:**

An object with either set of keys can be used. Shape:

- `uri` - The URI to load in the `WebView`. Can be a local or remote file.
- `method` - The HTTP Method to use. Defaults to GET if not specified. On Android, only GET and POST are supported.
- `headers` - Additional HTTP headers to send with the request. On Android, this can only be used with GET requests.
- `body` - The HTTP body to send with the request. This must be a valid UTF-8 string, and will be sent exactly as specified, with no additional encoding (e.g. URL-escaping or base64) applied. On Android, this can only be used with POST requests.

Shape:

- `html` - A static HTML page to display in the WebView.
- `baseUrl` - The base URL to be used for any relative links in the HTML.

The packager uses a third type, `number`, internally.



---

### `automaticallyAdjustContentInsets`

Controls whether to adjust the content inset for web views that are
placed behind a navigation bar, tab bar, or toolbar. The default value
is `true`.

| Type | Required |
| - | - |
| bool | No |




---

### `injectJavaScript`

Function that accepts a string that will be passed to the WebView and
executed immediately as JavaScript.

| Type | Required |
| - | - |
| function | No |




---

### `injectedJavaScript`

Set this to provide JavaScript that will be injected into the web page
when the view loads.

| Type | Required |
| - | - |
| string | No |




---

### `mediaPlaybackRequiresUserAction`

Boolean that determines whether HTML5 audio and video requires the user
to tap them before they start playing. The default value is `true`.

| Type | Required |
| - | - |
| bool | No |




---

### `nativeConfig`

Override the native component used to render the WebView. Enables a custom native WebView which uses the same JavaScript as the original WebView.

| Type | Required |
| - | - |
| object: {component: any,props: object,viewManager: object} | No |

**Keys:**

- `component` - The native component used to render the WebView.
- `props` - Set props directly on the native component WebView. Enables custom props which the original WebView doesn't pass through.
- `viewManager` - Set the ViewManager to use for communication with the native side. iOS only.


---

### `onError`

Function that is invoked when the `WebView` load fails.

| Type | Required |
| - | - |
| function | No |




---

### `onLoad`

Function that is invoked when the `WebView` has finished loading.

| Type | Required |
| - | - |
| function | No |




---

### `onLoadEnd`

Function that is invoked when the `WebView` load succeeds or fails.

| Type | Required |
| - | - |
| function | No |




---

### `onLoadStart`

Function that is invoked when the `WebView` starts loading.

| Type | Required |
| - | - |
| function | No |




---

### `onMessage`

A function that is invoked when the webview calls `window.postMessage`.
Setting this property will inject a `postMessage` global into your
webview, but will still call pre-existing values of `postMessage`.

`window.postMessage` accepts one argument, `data`, which will be
available on the event object, `event.nativeEvent.data`. `data`
must be a string.

| Type | Required |
| - | - |
| function | No |




---

### `onNavigationStateChange`

Function that is invoked when the `WebView` loading starts or ends.

| Type | Required |
| - | - |
| function | No |




---

### `renderError`

Function that returns a view to show if there's an error.

| Type | Required |
| - | - |
| function | No |




---

### `renderLoading`

Function that returns a loading indicator.

| Type | Required |
| - | - |
| function | No |




---

### `scalesPageToFit`

Boolean that controls whether the web content is scaled to fit
the view and enables the user to change the scale. The default value
is `true`.

| Type | Required |
| - | - |
| bool | No |




---

### `onShouldStartLoadWithRequest`

Function that allows custom handling of any web view requests. Return
`true` from the function to continue loading the request and `false`
to stop loading.


| Type | Required | Platform |
| - | - | - |
| function | No | iOS  |




---

### `startInLoadingState`

Boolean value that forces the `WebView` to show the loading view
on the first load.

| Type | Required |
| - | - |
| bool | No |




---

### `style`

The style to apply to the `WebView`.

| Type | Required |
| - | - |
| [ViewPropTypes.style](docs/viewproptypes.html#style) | No |




---

### `decelerationRate`

A floating-point number that determines how quickly the scroll view
decelerates after the user lifts their finger. You may also use the
string shortcuts `"normal"` and `"fast"` which match the underlying iOS
settings for `UIScrollViewDecelerationRateNormal` and
`UIScrollViewDecelerationRateFast` respectively:

  - normal: 0.998
  - fast: 0.99 (the default for iOS web view)


| Type | Required | Platform |
| - | - | - |
| ScrollView.propTypes.decelerationRate | No | iOS  |




---

### `domStorageEnabled`

Boolean value to control whether DOM Storage is enabled. Used only in
Android.


| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `javaScriptEnabled`

Boolean value to enable JavaScript in the `WebView`. Used on Android only
as JavaScript is enabled by default on iOS. The default value is `true`.


| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `mixedContentMode`

Specifies the mixed content mode. i.e WebView will allow a secure origin to load content from any other origin.

Possible values for `mixedContentMode` are:

- `'never'` (default) - WebView will not allow a secure origin to load content from an insecure origin.
- `'always'` - WebView will allow a secure origin to load content from any other origin, even if that origin is insecure.
- `'compatibility'` -  WebView will attempt to be compatible with the approach of a modern web browser with regard to mixed content.


| Type | Required | Platform |
| - | - | - |
| enum('never', 'always', 'compatibility') | No | Android  |




---

### `thirdPartyCookiesEnabled`

Boolean value to enable third party cookies in the `WebView`. Used on
Android Lollipop and above only as third party cookies are enabled by
default on Android Kitkat and below and on iOS. The default value is `true`.


| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `userAgent`

Sets the user-agent for the `WebView`.


| Type | Required | Platform |
| - | - | - |
| string | No | Android  |




---

### `allowsInlineMediaPlayback`

Boolean that determines whether HTML5 videos play inline or use the
native full-screen controller. The default value is `false`.

**NOTE** : In order for video to play inline, not only does this
property need to be set to `true`, but the video element in the HTML
document must also include the `webkit-playsinline` attribute.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `bounces`

Boolean value that determines whether the web view bounces
when it reaches the edge of the content. The default value is `true`.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `contentInset`

The amount by which the web view content is inset from the edges of
the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.


| Type | Required | Platform |
| - | - | - |
| object: {top: number, left: number, bottom: number, right: number} | No | iOS  |




---

### `dataDetectorTypes`

Determines the types of data converted to clickable URLs in the web view's content.
By default only phone numbers are detected.

You can provide one type or an array of many types.

Possible values for `dataDetectorTypes` are:

- `'phoneNumber'`
- `'link'`
- `'address'`
- `'calendarEvent'`
- `'none'`
- `'all'`



| Type | Required | Platform |
| - | - | - |
| enum('phoneNumber', 'link', 'address', 'calendarEvent', 'none', 'all'), array of enum('phoneNumber', 'link', 'address', 'calendarEvent', 'none', 'all') | No | iOS  |




---

### `scrollEnabled`

Boolean value that determines whether scrolling is enabled in the
`WebView`. The default value is `true`.


| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |




---

### `url`

**Deprecated.** Use the `source` prop instead.



| Type | Required |
| - | - |
| string | No |




---

### `html`

**Deprecated.** Use the `source` prop instead.



| Type | Required |
| - | - |
| string | No |






## Methods

### `extraNativeComponentConfig()`

```javascript
WebView.extraNativeComponentConfig()
```



