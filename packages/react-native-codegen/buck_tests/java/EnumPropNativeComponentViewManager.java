package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.EnumPropNativeComponentDelegate;
import com.facebook.react.viewmanagers.EnumPropNativeComponentInterface;

public class EnumPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EnumPropNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "EnumPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EnumPropNativeComponentDelegate delegate = new EnumPropNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setAlignment(ViewGroup view, String value) {}
}
