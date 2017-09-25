---
id: custom-webview-android
title: Custom WebView
layout: docs
category: Guides (Android)
permalink: docs/custom-webview-android.html
banner: ejected
next: headless-js-android
previous: native-components-android
---

While the built-in web view has a lot of features, it is not possible to handle every use-case in React Native. You can, however, extend the web view with native code without forking React Native or duplicating all the existing web view code.

Before you do this, you should be familiar with the concepts in [native UI components](native-components-android). You should also familiarise yourself with the [native code for web views](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/views/webview/ReactWebViewManager.java), as you will have to use this as a reference when implementing new features—although a deep understanding is not required.

## Native Code

To get started, you'll need to create a subclass of `ReactWebViewManager`, `ReactWebView`, and `ReactWebViewClient`. In your view manager, you'll then need to override:

* `createReactWebViewInstance`
* `getName`
* `addEventEmitters`

```java
@ReactModule(name = CustomWebViewManager.REACT_CLASS)
public class CustomWebViewManager extends ReactWebViewManager {
  /* This name must match what we're referring to in JS */
  protected static final String REACT_CLASS = "RCTCustomWebView";

  protected static class CustomWebViewClient extends ReactWebViewClient { }

  protected static class CustomWebView extends ReactWebView {
    public CustomWebView(ThemedReactContext reactContext) {
      super(reactContext);
    }
  }

  @Override
  protected ReactWebView createReactWebViewInstance(ThemedReactContext reactContext) {
    return new CustomWebView(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected void addEventEmitters(ThemedReactContext reactContext, WebView view) {
    view.setWebViewClient(new CustomWebViewClient());
  }
}
```

You'll need to follow the usual steps to [register the module](docs/native-modules-android.html#register-the-module).

### Adding New Properties

To add a new property, you'll need to add it to `CustomWebView`, and then expose it in `CustomWebViewManager`.

```java
public class CustomWebViewManager extends ReactWebViewManager {
  ...

  protected static class CustomWebView extends ReactWebView {
    public CustomWebView(ThemedReactContext reactContext) {
      super(reactContext);
    }

    protected @Nullable String mFinalUrl;

    public void setFinalUrl(String url) {
        mFinalUrl = url;
    }

    public String getFinalUrl() {
        return mFinalUrl;
    }
  }

  ...

  @ReactProp(name = "finalUrl")
  public void setFinalUrl(WebView view, String url) {
    ((CustomWebView) view).setFinalUrl(url);
  }
}
```

### Adding New Events

For events, you'll first need to make create event subclass.

```java
// NavigationCompletedEvent.java
public class NavigationCompletedEvent extends Event<NavigationCompletedEvent> {
  private WritableMap mParams;

  public NavigationCompletedEvent(int viewTag, WritableMap params) {
    super(viewTag);
    this.mParams = params;
  }

  @Override
  public String getEventName() {
    return "navigationCompleted";
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    init(getViewTag());
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), mParams);
  }
}
```

You can trigger the event in your web view client. You can hook existing handlers if your events are based on them.

You should refer to  [ReactWebViewManager.java](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/views/webview/ReactWebViewManager.java) in the React Native codebase to see what handlers are available and how they are implemented. You can extend any methods here to provide extra functionality.

```java
public class NavigationCompletedEvent extends Event<NavigationCompletedEvent> {
  private WritableMap mParams;

  public NavigationCompletedEvent(int viewTag, WritableMap params) {
    super(viewTag);
    this.mParams = params;
  }

  @Override
  public String getEventName() {
    return "navigationCompleted";
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    init(getViewTag());
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), mParams);
  }
}

// CustomWebViewManager.java
protected static class CustomWebViewClient extends ReactWebViewClient {
  @Override
  public boolean shouldOverrideUrlLoading(WebView view, String url) {
    boolean shouldOverride = super.shouldOverrideUrlLoading(view, url);
    String finalUrl = ((CustomWebView) view).getFinalUrl();

    if (!shouldOverride && url != null && finalUrl != null && new String(url).equals(finalUrl)) {
      final WritableMap params = Arguments.createMap();
      dispatchEvent(view, new NavigationCompletedEvent(view.getId(), params));
    }

    return shouldOverride;
  }
}
```

Finally, you'll need to expose the events in `CustomWebViewManager` through `getExportedCustomDirectEventTypeConstants`. Note that currently, the default implementation returns `null`, but this may change in the future.

```java
public class CustomWebViewManager extends ReactWebViewManager {
  ...

  @Override
  public @Nullable
  Map getExportedCustomDirectEventTypeConstants() {
    Map<String, Object> export = super.getExportedCustomDirectEventTypeConstants();
    if (export == null) {
      export = MapBuilder.newHashMap();
    }
    export.put("navigationCompleted", MapBuilder.of("registrationName", "onNavigationCompleted"));
    return export;
  }
}
```

## JavaScript Interface

To use your custom web view, you'll need to create a class for it. Your class must:

* Export all the prop types from `WebView.propTypes`
* Return a `WebView` component with the prop `nativeConfig.component` set to your native component (see below)

To get your native component, you must use `requireNativeComponent`: the same as for regular custom components. However, you must pass in an extra third argument, `WebView.extraNativeComponentConfig`. This third argument contains prop types that are only required for native code.

```js
import React, { Component, PropTypes } from 'react';
import { WebView, requireNativeComponent } from 'react-native';

export default class CustomWebView extends Component {
  static propTypes = WebView.propTypes

  render() {
    return (
      <WebView
        {...this.props}
        nativeConfig={{ component: RCTCustomWebView }}
      />
    );
  }
}

const RCTCustomWebView = requireNativeComponent(
  'RCTCustomWebView',
  CustomWebView,
  WebView.extraNativeComponentConfig
);
```

If you want to add custom props to your native component, you can use `nativeConfig.props` on the web view.

For events, the event handler must always be set to a function. This means it isn't safe to use the event handler directly from `this.props`, as the user might not have provided one. The standard approach is to create a event handler in your class, and then invoking the event handler given in `this.props` if it exists.

If you are unsure how something should be implemented from the JS side, look at [WebView.android.js](https://github.com/facebook/react-native/blob/master/Libraries/Components/WebView/WebView.android.js) in the React Native source.

```js
export default class CustomWebView extends Component {
  static propTypes = {
    ...WebView.propTypes,
    finalUrl: PropTypes.string,
    onNavigationCompleted: PropTypes.func,
  };

  static defaultProps = {
    finalUrl: 'about:blank',
  };

  _onNavigationCompleted = (event) => {
    const { onNavigationCompleted } = this.props;
    onNavigationCompleted && onNavigationCompleted(event);
  }

  render() {
    return (
      <WebView
        {...this.props}
        nativeConfig={{
          component: RCTCustomWebView,
          props: {
            finalUrl: this.props.finalUrl,
            onNavigationCompleted: this._onNavigationCompleted,
          }
        }}
      />
    );
  }
}
```

Just like for regular native components, you must provide all your prop types in the component to have them forwarded on to the native component. However, if you have some prop types that are only used internally in component, you can add them to the `nativeOnly` property of the third argument previously mentioned. For event handlers, you have to use the value `true` instead of a regular prop type.

For example, if you wanted to add an internal event handler called `onScrollToBottom`, you would use,

```js
const RCTCustomWebView = requireNativeComponent(
  'RCTCustomWebView',
  CustomWebView,
  {
    ...WebView.extraNativeComponentConfig,
    nativeOnly: {
      ...WebView.extraNativeComponentConfig.nativeOnly,
      onScrollToBottom: true,
    },
  }
);
```
