package com.facebook.react.views.text.fragments;

import com.facebook.react.common.mapbuffer.MapBuffer;

public class MapBufferTextFragmentList implements TextFragmentList {
  private final MapBuffer mFragments;

  public MapBufferTextFragmentList(MapBuffer fragments) {
    this.mFragments = fragments;
  }

  @Override
  public TextFragment getFragment(int index) {
    return new MapBufferTextFragment(mFragments.getMapBuffer(index));
  }

  @Override
  public int getCount() {
    return mFragments.getCount();
  }
}
