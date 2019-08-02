package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.NoPropsNoEventsNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.NoPropsNoEventsNativeComponentViewManagerInterface;

public class NoPropsNoEventsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements NoPropsNoEventsNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "NoPropsNoEventsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    NoPropsNoEventsNativeComponentViewManagerDelegate delegate =
        new NoPropsNoEventsNativeComponentViewManagerDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }
}
