/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.graphics.Color;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;
import java.util.ArrayList;
import java.util.List;

/**
 * View manager for {@link ReactHorizontalScrollView} components.
 *
 * <p>Note that {@link ReactScrollView} and {@link ReactHorizontalScrollView} are exposed to JS as a
 * single ScrollView component, configured via the {@code horizontal} boolean property.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModule(name = ReactHorizontalScrollViewManager.REACT_CLASS)
public class ReactHorizontalScrollViewManager extends ViewGroupManager<ReactHorizontalScrollView>
    implements ReactScrollViewCommandHelper.ScrollCommandHandler<ReactHorizontalScrollView> {

  public static final String REACT_CLASS = "AndroidHorizontalScrollView";

  private static final int[] SPACING_TYPES = {
    Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };

  private @Nullable FpsListener mFpsListener = null;

  public ReactHorizontalScrollViewManager() {
    this(null);
  }

  public ReactHorizontalScrollViewManager(@Nullable FpsListener fpsListener) {
    mFpsListener = fpsListener;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactHorizontalScrollView createViewInstance(ThemedReactContext context) {
    return new ReactHorizontalScrollView(context, mFpsListener);
  }

  @Override
  public @Nullable Object updateState(
      ReactHorizontalScrollView view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    view.setStateWrapper(stateWrapper);
    return null;
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public void setScrollEnabled(ReactHorizontalScrollView view, boolean value) {
    view.setScrollEnabled(value);
  }

  @ReactProp(name = "showsHorizontalScrollIndicator", defaultBoolean = true)
  public void setShowsHorizontalScrollIndicator(ReactHorizontalScrollView view, boolean value) {
    view.setHorizontalScrollBarEnabled(value);
  }

  @ReactProp(name = "decelerationRate")
  public void setDecelerationRate(ReactHorizontalScrollView view, float decelerationRate) {
    view.setDecelerationRate(decelerationRate);
  }

  @ReactProp(name = "disableIntervalMomentum")
  public void setDisableIntervalMomentum(
      ReactHorizontalScrollView view, boolean disableIntervalMomentum) {
    view.setDisableIntervalMomentum(disableIntervalMomentum);
  }

  @ReactProp(name = "snapToInterval")
  public void setSnapToInterval(ReactHorizontalScrollView view, float snapToInterval) {
    // snapToInterval needs to be exposed as a float because of the Javascript interface.
    float density = PixelUtil.getDisplayMetricDensity();
    view.setSnapInterval((int) (snapToInterval * density));
  }

  @ReactProp(name = "snapToAlignment")
  public void setSnapToAlignment(ReactHorizontalScrollView view, String alignment) {
    view.setSnapToAlignment(ReactScrollViewHelper.parseSnapToAlignment(alignment));
  }

  @ReactProp(name = "snapToOffsets")
  public void setSnapToOffsets(
      ReactHorizontalScrollView view, @Nullable ReadableArray snapToOffsets) {
    if (snapToOffsets == null || snapToOffsets.size() == 0) {
      view.setSnapOffsets(null);
      return;
    }

    float density = PixelUtil.getDisplayMetricDensity();
    List<Integer> offsets = new ArrayList<Integer>();
    for (int i = 0; i < snapToOffsets.size(); i++) {
      offsets.add((int) (snapToOffsets.getDouble(i) * density));
    }
    view.setSnapOffsets(offsets);
  }

  @ReactProp(name = "snapToStart")
  public void setSnapToStart(ReactHorizontalScrollView view, boolean snapToStart) {
    view.setSnapToStart(snapToStart);
  }

  @ReactProp(name = "snapToEnd")
  public void setSnapToEnd(ReactHorizontalScrollView view, boolean snapToEnd) {
    view.setSnapToEnd(snapToEnd);
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(
      ReactHorizontalScrollView view, boolean removeClippedSubviews) {
    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  /**
   * Computing momentum events is potentially expensive since we post a runnable on the UI thread to
   * see when it is done. We only do that if {@param sendMomentumEvents} is set to true. This is
   * handled automatically in js by checking if there is a listener on the momentum events.
   *
   * @param view
   * @param sendMomentumEvents
   */
  @ReactProp(name = "sendMomentumEvents")
  public void setSendMomentumEvents(ReactHorizontalScrollView view, boolean sendMomentumEvents) {
    view.setSendMomentumEvents(sendMomentumEvents);
  }

  /**
   * Tag used for logging scroll performance on this scroll view. Will force momentum events to be
   * turned on (see setSendMomentumEvents).
   *
   * @param view
   * @param scrollPerfTag
   */
  @ReactProp(name = "scrollPerfTag")
  public void setScrollPerfTag(ReactHorizontalScrollView view, String scrollPerfTag) {
    view.setScrollPerfTag(scrollPerfTag);
  }

  @ReactProp(name = "pagingEnabled")
  public void setPagingEnabled(ReactHorizontalScrollView view, boolean pagingEnabled) {
    view.setPagingEnabled(pagingEnabled);
  }

  /** Controls overScroll behaviour */
  @ReactProp(name = "overScrollMode")
  public void setOverScrollMode(ReactHorizontalScrollView view, String value) {
    view.setOverScrollMode(ReactScrollViewHelper.parseOverScrollMode(value));
  }

  @ReactProp(name = "nestedScrollEnabled")
  public void setNestedScrollEnabled(ReactHorizontalScrollView view, boolean value) {
    ViewCompat.setNestedScrollingEnabled(view, value);
  }

  @Override
  public void receiveCommand(
      ReactHorizontalScrollView scrollView, int commandId, @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void receiveCommand(
      ReactHorizontalScrollView scrollView, String commandId, @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void flashScrollIndicators(ReactHorizontalScrollView scrollView) {
    scrollView.flashScrollIndicators();
  }

  @Override
  public void scrollTo(
      ReactHorizontalScrollView scrollView, ReactScrollViewCommandHelper.ScrollToCommandData data) {
    scrollView.abortAnimation();
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(data.mDestX, data.mDestY);
    } else {
      scrollView.scrollTo(data.mDestX, data.mDestY);
    }
  }

  @Override
  public void scrollToEnd(
      ReactHorizontalScrollView scrollView,
      ReactScrollViewCommandHelper.ScrollToEndCommandData data) {
    // ScrollView always has one child - the scrollable area. However, it's possible today that we
    // execute this method as view command before the child view is mounted. Here we will retry the
    // view commands as a workaround.
    @Nullable View child = scrollView.getChildAt(0);
    if (child == null) {
      throw new RetryableMountingLayerException(
          "scrollToEnd called on HorizontalScrollView without child");
    }
    int right = child.getWidth() + scrollView.getPaddingRight();
    scrollView.abortAnimation();
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(right, scrollView.getScrollY());
    } else {
      scrollView.scrollTo(right, scrollView.getScrollY());
    }
  }

  /**
   * When set, fills the rest of the scrollview with a color to avoid setting a background and
   * creating unnecessary overdraw.
   *
   * @param view
   * @param color
   */
  @ReactProp(name = "endFillColor", defaultInt = Color.TRANSPARENT, customType = "Color")
  public void setBottomFillColor(ReactHorizontalScrollView view, int color) {
    view.setEndFillColor(color);
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_RADIUS,
        ViewProps.BORDER_TOP_LEFT_RADIUS,
        ViewProps.BORDER_TOP_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS
      },
      defaultFloat = Float.NaN)
  public void setBorderRadius(ReactHorizontalScrollView view, int index, float borderRadius) {
    @Nullable
    LengthPercentage radius =
        Float.isNaN(borderRadius)
            ? null
            : new LengthPercentage(borderRadius, LengthPercentageType.POINT);
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius);
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactHorizontalScrollView view, @Nullable String borderStyle) {
    @Nullable
    BorderStyle parsedBorderStyle =
        borderStyle == null ? null : BorderStyle.fromString(borderStyle);
    BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle);
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_WIDTH,
        ViewProps.BORDER_LEFT_WIDTH,
        ViewProps.BORDER_RIGHT_WIDTH,
        ViewProps.BORDER_TOP_WIDTH,
        ViewProps.BORDER_BOTTOM_WIDTH,
      },
      defaultFloat = Float.NaN)
  public void setBorderWidth(ReactHorizontalScrollView view, int index, float width) {
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width);
  }

  @ReactPropGroup(
      names = {
        "borderColor",
        "borderLeftColor",
        "borderRightColor",
        "borderTopColor",
        "borderBottomColor"
      },
      customType = "Color")
  public void setBorderColor(ReactHorizontalScrollView view, int index, @Nullable Integer color) {
    BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.ALL, color);
  }

  @ReactProp(name = "overflow")
  public void setOverflow(ReactHorizontalScrollView view, @Nullable String overflow) {
    view.setOverflow(overflow);
  }

  @ReactProp(name = "persistentScrollbar")
  public void setPersistentScrollbar(ReactHorizontalScrollView view, boolean value) {
    view.setScrollbarFadingEnabled(!value);
  }

  @ReactProp(name = "fadingEdgeLength")
  public void setFadingEdgeLength(ReactHorizontalScrollView view, int value) {
    if (value > 0) {
      view.setHorizontalFadingEdgeEnabled(true);
      view.setFadingEdgeLength(value);
    } else {
      view.setHorizontalFadingEdgeEnabled(false);
      view.setFadingEdgeLength(0);
    }
  }

  @ReactProp(name = "contentOffset")
  public void setContentOffset(ReactHorizontalScrollView view, ReadableMap value) {
    if (value != null) {
      double x = value.hasKey("x") ? value.getDouble("x") : 0;
      double y = value.hasKey("y") ? value.getDouble("y") : 0;
      view.scrollTo((int) PixelUtil.toPixelFromDIP(x), (int) PixelUtil.toPixelFromDIP(y));
    } else {
      view.scrollTo(0, 0);
    }
  }

  @ReactProp(name = "maintainVisibleContentPosition")
  public void setMaintainVisibleContentPosition(ReactHorizontalScrollView view, ReadableMap value) {
    if (value != null) {
      view.setMaintainVisibleContentPosition(
          MaintainVisibleScrollPositionHelper.Config.fromReadableMap(value));
    } else {
      view.setMaintainVisibleContentPosition(null);
    }
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public void setPointerEvents(ReactHorizontalScrollView view, @Nullable String pointerEventsStr) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr));
  }

  @ReactProp(name = "scrollEventThrottle")
  public void setScrollEventThrottle(ReactHorizontalScrollView view, int scrollEventThrottle) {
    view.setScrollEventThrottle(scrollEventThrottle);
  }

  @ReactProp(name = "horizontal")
  public void setHorizontal(ReactHorizontalScrollView view, boolean horizontal) {
    // Do Nothing: Align with static ViewConfigs
  }
}
