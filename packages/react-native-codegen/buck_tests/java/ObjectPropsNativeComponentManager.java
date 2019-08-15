package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.ObjectPropsNativeComponentManagerDelegate;
import com.facebook.react.viewmanagers.ObjectPropsNativeComponentManagerInterface;

public class ObjectPropsNativeComponentManager extends SimpleViewManager<ViewGroup>
    implements ObjectPropsNativeComponentManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "ObjectPropsNativeComponent";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    ObjectPropsNativeComponentManagerDelegate<ViewGroup, ObjectPropsNativeComponentManager>
        delegate = new ObjectPropsNativeComponentManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setObjectProp(ViewGroup view, ReadableMap value) {}

  @Override
  public void setObjectArrayProp(ViewGroup view, ReadableMap value) {}

  @Override
  public void setObjectPrimitiveRequiredProp(ViewGroup view, ReadableMap value) {}
}
