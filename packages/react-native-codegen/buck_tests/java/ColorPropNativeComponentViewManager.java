package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.ColorPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.ColorPropNativeComponentViewManagerInterface;

public class ColorPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements ColorPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "ColorPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    ColorPropNativeComponentViewManagerDelegate<ViewGroup, ColorPropNativeComponentViewManager>
        delegate = new ColorPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setTintColor(ViewGroup view, Integer value) {}
}
