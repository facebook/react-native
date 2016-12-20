# Nodes

Nodes is an experimental, alternate version of
[UIImplementation](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/uimanager/UIImplementation.java) for ReactNative on Android. It has two main advantages over the existing `UIImplementation`:

1. Support for `overflow:visible` on Android.
2. More efficient generation of view hierarchies.

The intention is to ultimately replace the existing `UIImplementation` on
Android with Nodes (after all the issues are ironed out).

## How to test

In a subclass of `ReactNativeHost`, add this:

```java
@Override
protected UIImplementationProvider getUIImplementationProvider() {
  return new FlatUIImplementationProvider();
}
```

## How it Works

The existing
[UIImplementation](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/uimanager/UIImplementation.java) maps all non-layout tags to `View`s (resulting in an almost 1:1 mapping of tags
to Views, with the exception of some optimizations for layout only tags that
don't draw content). Nodes, on the other hand, maps react tags to a set of
`DrawCommand`s. In other words, an `<image>` tag will often be mapped to a
`Drawable` instead of an `ImageView` and a `<text>` tag will be mapped to a
`Layout` instead of a `TextView`. This helps flatten the resulting `View`
hierarchy.

There are situations where `DrawCommand`s are promoted to `View`s:

1. Existing Android components that are wrapped by React Native (for example, 
`ViewPager`, `ScrollView`, etc).
2. When using a `View` is more optimal (for example, `opacity`, to avoid
unnecessary invalidations).
3. To facilitate the implementation of certain features (accessibility,
transforms, etc).

This means that existing custom `ViewManager`s should continue to work as they
did with the existing `UIImplementation`.

## Limitations and Known Issues

- `LayoutAnimation`s are not yet supported
- `zIndex` is not yet supported
