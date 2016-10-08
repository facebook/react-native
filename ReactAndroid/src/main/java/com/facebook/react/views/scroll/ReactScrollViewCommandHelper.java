/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import javax.annotation.Nullable;

import java.util.Map;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.MapBuilder;

/**
 * Helper for view managers to handle commands like 'scrollTo'.
 * Shared by {@link ReactScrollViewManager} and {@link ReactHorizontalScrollViewManager}.
 */
public class ReactScrollViewCommandHelper {

  public static final int COMMAND_SCROLL_TO = 1;

  public interface ScrollCommandHandler<T> {
    void scrollTo(T scrollView, ScrollToCommandData data);
  }

  public static class ScrollToCommandData {

    public final int mDestX, mDestY;
    public final boolean mAnimated;

    ScrollToCommandData(int destX, int destY, boolean animated) {
      mDestX = destX;
      mDestY = destY;
      mAnimated = animated;
    }
  }

  public static Map<String,Integer> getCommandsMap() {
    return MapBuilder.of(
        "scrollTo",
        COMMAND_SCROLL_TO);
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
        boolean animated = args.getBoolean(2);
        viewManager.scrollTo(scrollView, new ScrollToCommandData(destX, destY, animated));
        return;
      }
      default:
        throw new IllegalArgumentException(String.format(
            "Unsupported command %d received by %s.",
            commandType,
            viewManager.getClass().getSimpleName()));
    }
  }
}
