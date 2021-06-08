package com.facebook.react.views.scroll;

import androidx.annotation.Nullable;

public class ReactScrollViewMaintainVisibleContentPositionData {
  public final int minIndexForVisible;

  public final @Nullable Integer autoScrollToTopThreshold;

  ReactScrollViewMaintainVisibleContentPositionData(
      int minIndexForVisible, @Nullable Integer autoScrollToTopThreshold) {
    this.minIndexForVisible = minIndexForVisible;
    this.autoScrollToTopThreshold = autoScrollToTopThreshold;
  }
}
