package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.InterfaceOnlyNativeComponentDelegate;
import com.facebook.react.viewmanagers.InterfaceOnlyNativeComponentInterface;

public class InterfaceOnlyNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements InterfaceOnlyNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "InterfaceOnlyNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    InterfaceOnlyNativeComponentDelegate delegate =
        new InterfaceOnlyNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setAccessibilityHint(ViewGroup view, String value) {}
}
