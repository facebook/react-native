package com.facebook.react.views.text.fragments;

import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.views.text.TextAttributeProps;

import static com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_HEIGHT;
import static com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_IS_ATTACHMENT;
import static com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_REACT_TAG;
import static com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_STRING;
import static com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_TEXT_ATTRIBUTES;
import static com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_WIDTH;

public class MapBufferTextFragment implements TextFragment {
  private final MapBuffer fragment;

  public MapBufferTextFragment(MapBuffer fragment) {
    this.fragment = fragment;
  }

  @Override
  public TextAttributeProps getTextAttributeProps() {
    return TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES));
  }

  @Override
  public String getString() {
    return fragment.getString(FR_KEY_STRING);
  }

  @Override
  public boolean hasReactTag() {
    return fragment.contains(FR_KEY_REACT_TAG);
  }

  @Override
  public int getReactTag() {
    return fragment.getInt(FR_KEY_REACT_TAG);
  }

  @Override
  public boolean hasIsAttachment() {
    return fragment.contains(FR_KEY_IS_ATTACHMENT);
  }

  @Override
  public boolean isAttachment() {
    return fragment.getBoolean(FR_KEY_IS_ATTACHMENT);
  }

  @Override
  public double getWidth() {
    return fragment.getDouble(FR_KEY_WIDTH);
  }

  @Override
  public double getHeight() {
    return fragment.getDouble(FR_KEY_HEIGHT);
  }
}
