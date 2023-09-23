package com.facebook.react.views.text.fragments;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.views.text.TextAttributeProps;

public class BridgeTextFragment implements TextFragment {
  private final ReadableMap mFragment;

  public BridgeTextFragment(ReadableMap fragment) {
    this.mFragment = fragment;
  }

  @Override
  public TextAttributeProps getTextAttributeProps() {
    return TextAttributeProps.fromReadableMap(new ReactStylesDiffMap(mFragment.getMap("textAttributes")));
  }

  @Override
  public String getString() {
    return mFragment.getString("string");
  }

  @Override
  public boolean hasReactTag() {
    return mFragment.hasKey("reactTag");
  }

  @Override
  public int getReactTag() {
    return mFragment.getInt("reactTag");
  }

  @Override
  public boolean hasIsAttachment() {
    return mFragment.hasKey(ViewProps.IS_ATTACHMENT);
  }

  @Override
  public boolean isAttachment() {
    return mFragment.getBoolean(ViewProps.IS_ATTACHMENT);
  }

  @Override
  public double getWidth() {
    return mFragment.getDouble(ViewProps.WIDTH);
  }

  @Override
  public double getHeight() {
    return mFragment.getDouble(ViewProps.HEIGHT);
  }
}
