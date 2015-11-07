package com.facebook.react.views.viewpager;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;

import java.util.Map;

import javax.annotation.Nullable;

/**
 * Helper for view manager to handle commands like 'setPage'.
 */
public class ReactViewPagerCommandHelper {
  public static final int COMMAND_SET_PAGE = 1;
  public static final int COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2;

  public interface PagerCommandHandler<T> {
    void setPage(T viewPager, int page);
    void setPageWithoutAnimation(T viewPager, int page);
  }

  public static Map<String,Integer> getCommandsMap() {
    return MapBuilder.of(
        "setPage",
        COMMAND_SET_PAGE,
        "setPageWithoutAnimation",
        COMMAND_SET_PAGE_WITHOUT_ANIMATION);
  }

  public static <T> void receiveCommand(
      PagerCommandHandler<T> viewManager,
      T viewPager,
      int commandType,
      @Nullable ReadableArray args) {
    Assertions.assertNotNull(viewManager);
    Assertions.assertNotNull(viewPager);
    Assertions.assertNotNull(args);
    switch (commandType) {
      case COMMAND_SET_PAGE: {
        viewManager.setPage(viewPager, args.getInt(0));
        return;
      }
      case COMMAND_SET_PAGE_WITHOUT_ANIMATION: {
        viewManager.setPageWithoutAnimation(viewPager, args.getInt(0));
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
