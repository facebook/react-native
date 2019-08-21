package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.PointPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.PointPropNativeComponentViewManagerInterface;

public class PointPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements PointPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "PointPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    PointPropNativeComponentViewManagerDelegate<ViewGroup, PointPropNativeComponentViewManager>
        delegate = new PointPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setStartPoint(ViewGroup view, ReadableMap value) {}
}
