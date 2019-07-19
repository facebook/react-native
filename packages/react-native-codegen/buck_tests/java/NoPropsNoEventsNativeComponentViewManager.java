package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.NoPropsNoEventsNativeComponentDelegate;
import com.facebook.react.viewmanagers.NoPropsNoEventsNativeComponentInterface;

public class NoPropsNoEventsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements NoPropsNoEventsNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "NoPropsNoEventsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    NoPropsNoEventsNativeComponentDelegate delegate =
        new NoPropsNoEventsNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }
}
