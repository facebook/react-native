package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.ColorPropNativeComponentDelegate;
import com.facebook.react.viewmanagers.ColorPropNativeComponentInterface;

public class ColorPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements ColorPropNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "ColorPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    ColorPropNativeComponentDelegate delegate = new ColorPropNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setTintColor(ViewGroup view, Integer value) {}
}
