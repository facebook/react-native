package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.BooleanPropNativeComponentDelegate;
import com.facebook.react.viewmanagers.BooleanPropNativeComponentInterface;

public class BooleanPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements BooleanPropNativeComponentInterface<ViewGroup> {
  public static final String REACT_CLASS = "BooleanPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    BooleanPropNativeComponentDelegate delegate =
        new BooleanPropNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}
}
