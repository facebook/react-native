package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.BooleanPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.BooleanPropNativeComponentViewManagerInterface;

public class BooleanPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements BooleanPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "BooleanPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    BooleanPropNativeComponentViewManagerDelegate<ViewGroup, BooleanPropNativeComponentViewManager>
        delegate = new BooleanPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}
}
