package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.PointPropNativeComponentDelegate;
import com.facebook.react.viewmanagers.PointPropNativeComponentInterface;

public class PointPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements PointPropNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "PointPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    PointPropNativeComponentDelegate delegate = new PointPropNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setStartPoint(ViewGroup view, ReadableMap value) {}
}
