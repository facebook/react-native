package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.ImagePropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.ImagePropNativeComponentViewManagerInterface;

public class ImagePropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements ImagePropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "ImagePropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    ImagePropNativeComponentViewManagerDelegate<ViewGroup, ImagePropNativeComponentViewManager>
        delegate = new ImagePropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setThumbImage(ViewGroup view, ReadableMap value) {}
}
