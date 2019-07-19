package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.MultiNativePropNativeComponentDelegate;
import com.facebook.react.viewmanagers.MultiNativePropNativeComponentInterface;

public class MultiNativePropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements MultiNativePropNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "MultiNativePropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    MultiNativePropNativeComponentDelegate delegate =
        new MultiNativePropNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setThumbImage(ViewGroup view, ReadableMap value) {}

  @Override
  public void setColor(ViewGroup view, Integer value) {}

  @Override
  public void setThumbTintColor(ViewGroup view, Integer value) {}

  @Override
  public void setPoint(ViewGroup view, ReadableMap value) {}
}
