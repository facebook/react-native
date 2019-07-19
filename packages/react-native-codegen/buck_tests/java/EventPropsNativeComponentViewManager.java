package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.EventPropsNativeComponentDelegate;
import com.facebook.react.viewmanagers.EventPropsNativeComponentInterface;

public class EventPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EventPropsNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "EventPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EventPropsNativeComponentDelegate delegate = new EventPropsNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}
}
