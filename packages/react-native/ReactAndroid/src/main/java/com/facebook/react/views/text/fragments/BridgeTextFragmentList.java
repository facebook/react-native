package com.facebook.react.views.text.fragments;

import com.facebook.react.bridge.ReadableArray;

public class BridgeTextFragmentList implements TextFragmentList {
  private final ReadableArray mFragments;

  public BridgeTextFragmentList(ReadableArray fragments) {
    this.mFragments = fragments;
  }

  @Override
  public TextFragment getFragment(int index) {
    return new BridgeTextFragment(mFragments.getMap(index));
  }

  @Override
  public int getCount() {
    return mFragments.size();
  }
}
