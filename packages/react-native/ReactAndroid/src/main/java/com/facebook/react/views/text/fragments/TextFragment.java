package com.facebook.react.views.text.fragments;

import com.facebook.react.views.text.TextAttributeProps;

public interface TextFragment {
  TextAttributeProps getTextAttributeProps();

  String getString();

  boolean hasReactTag();

  int getReactTag();

  boolean hasIsAttachment();

  boolean isAttachment();

  double getWidth();

  double getHeight();
}
