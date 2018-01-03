/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Helper for view managers to handle commands like 'scrollTo'.
 * Shared by {@link ReactScrollViewManager} and {@link ReactHorizontalScrollViewManager}.
 */
public class ReactScrollViewCommandHelper {

  public static final int COMMAND_SCROLL_TO = 1;
  public static final int COMMAND_SCROLL_TO_END = 2;
  public static final int COMMAND_FLASH_SCROLL_INDICATORS = 3;

  /**
   * Prior to users being able to specify a duration when calling "scrollTo",
   * they could specify an "animate" boolean, which would use Android's
   * "smoothScrollTo" method, which defaulted to a 250 millisecond
   * animation:
   * https://developer.android.com/reference/android/widget/Scroller.html#startScroll
   */
  public static final int LEGACY_ANIMATION_DURATION = 250;

  public interface ScrollCommandHandler<T> {
    void scrollTo(T scrollView, ScrollToCommandData data);
    void scrollToEnd(T scrollView, ScrollToEndCommandData data);
    void flashScrollIndicators(T scrollView);
  }

  public static class ScrollToCommandData {

    public final int mDestX, mDestY, mDuration;

    ScrollToCommandData(int destX, int destY, int duration) {
      mDestX = destX;
      mDestY = destY;
      mDuration = duration;
    }
  }

  public static class ScrollToEndCommandData {

    public final int mDuration;

    ScrollToEndCommandData(int duration) {
      mDuration = duration;
    }
  }

  public static Map<String,Integer> getCommandsMap() {
    return MapBuilder.of(
        "scrollTo",
        COMMAND_SCROLL_TO,
        "scrollToEnd",
        COMMAND_SCROLL_TO_END,
        "flashScrollIndicators",
        COMMAND_FLASH_SCROLL_INDICATORS);
  }

  public static <T> void receiveCommand(
      ScrollCommandHandler<T> viewManager,
      T scrollView,
      int commandType,
      @Nullable ReadableArray args) {
    Assertions.assertNotNull(viewManager);
    Assertions.assertNotNull(scrollView);
    Assertions.assertNotNull(args);
    switch (commandType) {
      case COMMAND_SCROLL_TO: {
        int destX = Math.round(PixelUtil.toPixelFromDIP(args.getDouble(0)));
        int destY = Math.round(PixelUtil.toPixelFromDIP(args.getDouble(1)));

        // TODO(dannycochran) If the duration argument is specified and non-zero, use it,
        // otherwise use the legacy "animated" boolean. Eventually this can be removed
        // in favor of just looking at "duration".
        int duration = 0;
        if (args.size() == 4 && args.getDouble(3) > 0) {
          duration = (int) Math.round(args.getDouble(3));
        } else if (args.getBoolean(2)) {
          duration = LEGACY_ANIMATION_DURATION;
        }
        viewManager.scrollTo(scrollView, new ScrollToCommandData(destX, destY, duration));
        return;
      }
      case COMMAND_SCROLL_TO_END: {
        // TODO(dannycochran) If the duration argument is specified and non-zero, use it,
        // otherwise use the legacy "animated" boolean. Eventually this can be removed
        // in favor of just looking at "duration".
        int duration = 0;
        if (args.size() == 2 && args.getDouble(1) > 0) {
          duration = (int) Math.round(args.getDouble(1));
        } else if (args.getBoolean(0)) {
          duration = LEGACY_ANIMATION_DURATION;
        }
        viewManager.scrollToEnd(scrollView, new ScrollToEndCommandData(duration));
        return;
      }
      case COMMAND_FLASH_SCROLL_INDICATORS:
        viewManager.flashScrollIndicators(scrollView);
        return;

      default:
        throw new IllegalArgumentException(String.format(
            "Unsupported command %d received by %s.",
            commandType,
            viewManager.getClass().getSimpleName()));
    }
  }
}
