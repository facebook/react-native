package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.EventNestedObjectPropsNativeComponentDelegate;
import com.facebook.react.viewmanagers.EventNestedObjectPropsNativeComponentInterface;

public class EventNestedObjectPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EventNestedObjectPropsNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "EventNestedObjectPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EventNestedObjectPropsNativeComponentDelegate delegate =
        new EventNestedObjectPropsNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}
}
