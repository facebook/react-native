package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.EventNestedObjectPropsNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.EventNestedObjectPropsNativeComponentViewManagerInterface;

public class EventNestedObjectPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EventNestedObjectPropsNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "EventNestedObjectPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EventNestedObjectPropsNativeComponentViewManagerDelegate<
            ViewGroup, EventNestedObjectPropsNativeComponentViewManager>
        delegate = new EventNestedObjectPropsNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}
}
