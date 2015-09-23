---
id: native-components-android
title: Native UI Components
layout: docs
category: Guides (Android)
permalink: docs/native-components-android.html
next: running-on-device-android
---

There are tons of native UI widgets out there ready to be used in the latest apps - some of them are part of the platform, others are available as third-party libraries, and still more might be in use in your very own portfolio. React Native has several of the most critical platform components already wrapped, like `ScrollView` and `TextInput`, but not all of them, and certainly not ones you might have written yourself for a previous app. Fortunately, it's quite easy to wrap up these existing components for seamless integration with your React Native application.

Like the native module guide, this too is a more advanced guide that assumes you are somewhat familiar with Android SDK programming. This guide will show you how to build a native UI component, walking you through the implementation of a subset of the existing `ImageView `component available in the core React Native library.

## ImageView example

For this example we are going to walk through the implementation requirements to allow the use of ImageViews in JavaScript.

Native views are created and manipulated by extending `ViewManager` or more commonly `SimpleViewManager` . A `SimpleViewManager` is convenient in this case because it applies common properties such as background color, opacity, and Flexbox layout. An example of when you would use `ViewManager` instead is when wrapping a component with FrameLayout, such as ProgressBar.

These subclasses are essentially singletons - only one instance of each is created by the bridge. They vend native views to the `NativeViewHierarchyManager`, which delegates back to them to set and update the properties of the views as necessary. The `ViewManagers` are also typically the delegates for the views, sending events back to JavaScript via the bridge.

Vending a view is simple:

1. Create the ViewManager subclass.
2. Annotate the view properties with `@UIProp`
3. Implement the `createViewInstance` method
4. Implement the `updateView` method
5. Register the manager in `createViewManagers` of the applications package.
6. Implement the JavaScript module

## 1. Create the `ViewManager` subclass

In this example we create view manager class `ReactImageManager` that extends `SimpleViewManager` of type `ReactImageView`. `ReactImageView` is the type of object managed by the manager, this will be the custom native view. Name returned by `getName` is used to reference the native view type from JavaScript.

```java
...

public class ReactImageManager extends SimpleViewManager<ReactImageView> {

  public static final String REACT_CLASS = "RCTImageView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }
```

## 2. Annotate the view properties

Properties that are to be reflected in JavaScript are annotated with `@UIProp`. The types currently supported are `BOOLEAN`, `NUMBER`, `STRING`, `MAP` and `ARRAY`. Each property is declared as a public static final String and its assigned value will be the name of the property in JavaScript.

```java
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_SRC = "src";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_BORDER_RADIUS = "borderRadius";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_RESIZE_MODE = ViewProps.RESIZE_MODE;
```

## 3. Implement method `createViewInstance`

Views are created in the `createViewInstance` method, the view should initialize itself in its default state, any properties will be set via a follow up call to `updateView.`

```java
  @Override
  public ReactImageView createViewInstance(ThemedReactContext context) {
    return new ReactImageView(context, Fresco.newDraweeControllerBuilder(), mCallerContext);
  }
```

## 4. Implement method `updateView`

Setting properties on a view is not handled by automatically calling setter methods as it is on iOS; for Android, you manually invoke the setters via the `updateView` of your `ViewManager`. Values are fetched from the `CatalystStylesDiffMap` and dispatched to the `View` instance as required. It is up to a combination of `updateView` and the `View` class to check the validity of the properties and behave accordingly.

```java
  @Override
  public void updateView(final ReactImageView view,
                         final CatalystStylesDiffMap props) {
    super.updateView(view, props);

    if (props.hasKey(PROP_RESIZE_MODE)) {
      view.setScaleType(
        ImageResizeMode.toScaleType(props.getString(PROP_RESIZE_MODE)));
    }
    if (props.hasKey(PROP_SRC)) {
       view.setSource(props.getString(PROP_SRC));
    }
    if (props.hasKey(PROP_BORDER_RADIUS)) {
      view.setBorderRadius(props.getFloat(PROP_BORDER_RADIUS, 0.0f));
    }
    view.maybeUpdateView();
  }
}
```

## 5. Register the `ViewManager`

The final Java step is to register the ViewManager to the application, this happens in a similar way to [Native Modules](native-modules-android.html), via the applications package member function `createViewManagers.`

```java
  @Override
  public List<ViewManager> createViewManagers(
                            ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
      new ReactImageManager()
    );
  }
```

## 6. Implement the JavaScript module

The very final step is to create the JavaScript module that defines the interface layer between Java and JavaScript for the users of your new view. Much of the effort is handled by internal React code in Java and JavaScript and all that is left for you is to describe the `propTypes`.

```js
// ImageView.js

var { requireNativeComponent } = require('react-native');

var iface = {
  name: 'ImageView',
  propTypes: {
    src: PropTypes.string,
    borderRadius: PropTypes.number,
    resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch']),
  },
};

module.exports = requireNativeComponent('RCTImageView', iface);
```

`requireNativeComponent` commonly takes two parameters, the first is the name of the native view and the second is an object that describes the component interface. The component interface should declare a friendly `name` for use in debug messages and must declare the `propTypes` reflected by the Native View. The `propTypes` are used for checking the validity of a user's use of the native view.  Note that if you need your JavaScript component to do more than just specify a name and propTypes, like do custom event handling, you can wrap the native component in a normal react component.  In that case, you want to pass in the wrapper component instead of `iface` to `requireNativeComponent`.  This is illustrated in the `MyCustomView` example below.

# Events

So now we know how to expose native view components that we can control easily from JS, but how do we deal with events from the user, like pinch-zooms or panning? When a native event occurs the native code should issue an event to the JavaScript representation of the View, and the two views are linked with the value returned from the `getId()` method.

```java
class MyCustomView extends View {
   ...
   public void onReceiveNativeEvent() {
      WritableMap event = Arguments.createMap();
      event.putString("message", "MyMessage");
      ReactContext reactContext = (ReactContext)getContext();
      reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
          getId(),
          "topChange",
          event);
    }
}
```

The event name `topChange` maps to the `onChange` callback prop in JavaScript (mappings are in `UIManagerModuleConstants.java`). This callback is invoked with the raw event, which we typically process in the wrapper component to make a simpler API:

```js
// MyCustomView.js

class MyCustomView extends React.Component {
  constructor() {
    this._onChange = this._onChange.bind(this);
  }
  _onChange(event: Event) {
    if (!this.props.onChangeMessage) {
      return;
    }
    this.props.onChangeMessage(event.nativeEvent.message);
  }
  render() {
    return <RCTMyCustomView {...this.props} onChange={this._onChange} />;
  }
}
MyCustomView.propTypes = {
  /**
   * Callback that is called continuously when the user is dragging the map.
   */
  onChangeMessage: React.PropTypes.func,
  ...
};

var RCTMyCustomView = requireNativeComponent(`RCTMyCustomView`, MyCustomView, {
  nativeOnly: {onChange: true}
});
```

Note the use of `nativeOnly` above.  Sometimes you'll have some special properties that you need to expose for the native component, but don't actually want them as part of the API for the associated React component.  For example, `Switch` has a custom `onChange` handler for the raw native event, and exposes an `onValueChange` handler property that is invoked with just the boolean value rather than the raw event (similar to `onChangeMessage` in the example above).  Since you don't want these native only properties to be part of the API, you don't want to put them in `propTypes`, but if you don't you'll get an error.  The solution is simply to call them out via the `nativeOnly` option.
