package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.EdgeInsetsPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.EdgeInsetsPropNativeComponentViewManagerInterface;

public class EdgeInsetsPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EdgeInsetsPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "EdgeInsetsPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EdgeInsetsPropNativeComponentViewManagerDelegate<
            ViewGroup, EdgeInsetsPropNativeComponentViewManager>
        delegate = new EdgeInsetsPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setContentInset(ViewGroup view, ReadableMap value) {}
}
