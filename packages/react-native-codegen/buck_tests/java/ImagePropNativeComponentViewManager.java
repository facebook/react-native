package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.ImagePropNativeComponentDelegate;
import com.facebook.react.viewmanagers.ImagePropNativeComponentInterface;

public class ImagePropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements ImagePropNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "ImagePropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    ImagePropNativeComponentDelegate delegate = new ImagePropNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setThumbImage(ViewGroup view, ReadableMap value) {}
}
