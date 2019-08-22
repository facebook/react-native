package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.EventPropsNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.EventPropsNativeComponentViewManagerInterface;

public class EventPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EventPropsNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "EventPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EventPropsNativeComponentViewManagerDelegate<ViewGroup, EventPropsNativeComponentViewManager>
        delegate = new EventPropsNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}
}
