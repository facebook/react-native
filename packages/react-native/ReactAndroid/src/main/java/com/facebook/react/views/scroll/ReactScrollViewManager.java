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
import com.facebook.react.common.MapBuilder;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * View manager for {@link ReactScrollView} components.
 *
 * <p>Note that {@link ReactScrollView} and {@link ReactHorizontalScrollView} are exposed to JS as a
 * single ScrollView component, configured via the {@code horizontal} boolean property.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ReactModule(name = ReactScrollViewManager.REACT_CLASS)
public class ReactScrollViewManager extends ViewGroupManager<ReactScrollView>
    implements ReactScrollViewCommandHelper.ScrollCommandHandler<ReactScrollView> {

  public static final String REACT_CLASS = "RCTScrollView";

  private static final int[] SPACING_TYPES = {
    Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };

  private @Nullable FpsListener mFpsListener = null;

  public ReactScrollViewManager() {
    this(null);
  }

  public ReactScrollViewManager(@Nullable FpsListener fpsListener) {
    mFpsListener = fpsListener;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactScrollView createViewInstance(ThemedReactContext context) {
    return new ReactScrollView(context, mFpsListener);
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public void setScrollEnabled(ReactScrollView view, boolean value) {
    view.setScrollEnabled(value);

    // Set focusable to match whether scroll is enabled. This improves keyboarding
    // experience by not making scrollview a tab stop when you cannot interact with it.
    view.setFocusable(value);
  }

  @ReactProp(name = "showsVerticalScrollIndicator", defaultBoolean = true)
  public void setShowsVerticalScrollIndicator(ReactScrollView view, boolean value) {
    view.setVerticalScrollBarEnabled(value);
  }

  @ReactProp(name = "decelerationRate")
  public void setDecelerationRate(ReactScrollView view, float decelerationRate) {
    view.setDecelerationRate(decelerationRate);
  }

  @ReactProp(name = "disableIntervalMomentum")
  public void setDisableIntervalMomentum(ReactScrollView view, boolean disableIntervalMomentum) {
    view.setDisableIntervalMomentum(disableIntervalMomentum);
  }

  @ReactProp(name = "snapToInterval")
  public void setSnapToInterval(ReactScrollView view, float snapToInterval) {
    // snapToInterval needs to be exposed as a float because of the Javascript interface.
    float density = PixelUtil.getDisplayMetricDensity();
    view.setSnapInterval((int) (snapToInterval * density));
  }

  @ReactProp(name = "snapToOffsets")
  public void setSnapToOffsets(ReactScrollView view, @Nullable ReadableArray snapToOffsets) {
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

  @ReactProp(name = "snapToAlignment")
  public void setSnapToAlignment(ReactScrollView view, @Nullable String alignment) {
    view.setSnapToAlignment(ReactScrollViewHelper.parseSnapToAlignment(alignment));
  }

  @ReactProp(name = "snapToStart")
  public void setSnapToStart(ReactScrollView view, boolean snapToStart) {
    view.setSnapToStart(snapToStart);
  }

  @ReactProp(name = "snapToEnd")
  public void setSnapToEnd(ReactScrollView view, boolean snapToEnd) {
    view.setSnapToEnd(snapToEnd);
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(ReactScrollView view, boolean removeClippedSubviews) {
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
  public void setSendMomentumEvents(ReactScrollView view, boolean sendMomentumEvents) {
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
  public void setScrollPerfTag(ReactScrollView view, @Nullable String scrollPerfTag) {
    view.setScrollPerfTag(scrollPerfTag);
  }

  @ReactProp(name = "pagingEnabled")
  public void setPagingEnabled(ReactScrollView view, boolean pagingEnabled) {
    view.setPagingEnabled(pagingEnabled);
  }

  /**
   * When set, fills the rest of the scrollview with a color to avoid setting a background and
   * creating unnecessary overdraw.
   *
   * @param view
   * @param color
   */
  @ReactProp(name = "endFillColor", defaultInt = Color.TRANSPARENT, customType = "Color")
  public void setBottomFillColor(ReactScrollView view, int color) {
    view.setEndFillColor(color);
  }

  /** Controls overScroll behaviour */
  @ReactProp(name = "overScrollMode")
  public void setOverScrollMode(ReactScrollView view, @Nullable String value) {
    view.setOverScrollMode(ReactScrollViewHelper.parseOverScrollMode(value));
  }

  @ReactProp(name = "nestedScrollEnabled")
  public void setNestedScrollEnabled(ReactScrollView view, boolean value) {
    ViewCompat.setNestedScrollingEnabled(view, value);
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return ReactScrollViewCommandHelper.getCommandsMap();
  }

  @Override
  public void receiveCommand(
      ReactScrollView scrollView, int commandId, @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void receiveCommand(
      ReactScrollView scrollView, String commandId, @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void flashScrollIndicators(ReactScrollView scrollView) {
    scrollView.flashScrollIndicators();
  }

  @Override
  public void scrollTo(
      ReactScrollView scrollView, ReactScrollViewCommandHelper.ScrollToCommandData data) {
    scrollView.abortAnimation();
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(data.mDestX, data.mDestY);
    } else {
      scrollView.scrollTo(data.mDestX, data.mDestY);
    }
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
  public void setBorderRadius(ReactScrollView view, int index, float borderRadius) {
    @Nullable
    LengthPercentage radius =
        Float.isNaN(borderRadius)
            ? null
            : new LengthPercentage(borderRadius, LengthPercentageType.POINT);
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius);
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactScrollView view, @Nullable String borderStyle) {
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
  public void setBorderWidth(ReactScrollView view, int index, float width) {
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
  public void setBorderColor(ReactScrollView view, int index, @Nullable Integer color) {
    BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.ALL, color);
  }

  @ReactProp(name = "overflow")
  public void setOverflow(ReactScrollView view, @Nullable String overflow) {
    view.setOverflow(overflow);
  }

  @Override
  public void scrollToEnd(
      ReactScrollView scrollView, ReactScrollViewCommandHelper.ScrollToEndCommandData data) {
    // ScrollView always has one child - the scrollable area. However, it's possible today that we
    // execute this method as view command before the child view is mounted. Here we will retry the
    // view commands as a workaround.
    View child = scrollView.getChildAt(0);
    if (child == null) {
      throw new RetryableMountingLayerException("scrollToEnd called on ScrollView without child");
    }

    // ScrollView always has one child - the scrollable area
    int bottom = child.getHeight() + scrollView.getPaddingBottom();
    scrollView.abortAnimation();
    if (data.mAnimated) {
      scrollView.reactSmoothScrollTo(scrollView.getScrollX(), bottom);
    } else {
      scrollView.scrollTo(scrollView.getScrollX(), bottom);
    }
  }

  @ReactProp(name = "persistentScrollbar")
  public void setPersistentScrollbar(ReactScrollView view, boolean value) {
    view.setScrollbarFadingEnabled(!value);
  }

  @ReactProp(name = "fadingEdgeLength")
  public void setFadingEdgeLength(ReactScrollView view, int value) {
    if (value > 0) {
      view.setVerticalFadingEdgeEnabled(true);
      view.setFadingEdgeLength(value);
    } else {
      view.setVerticalFadingEdgeEnabled(false);
      view.setFadingEdgeLength(0);
    }
  }

  @ReactProp(name = "contentOffset", customType = "Point")
  public void setContentOffset(ReactScrollView view, ReadableMap value) {
    view.setContentOffset(value);
  }

  @ReactProp(name = "maintainVisibleContentPosition")
  public void setMaintainVisibleContentPosition(ReactScrollView view, ReadableMap value) {
    if (value != null) {
      view.setMaintainVisibleContentPosition(
          MaintainVisibleScrollPositionHelper.Config.fromReadableMap(value));
    } else {
      view.setMaintainVisibleContentPosition(null);
    }
  }

  @Override
  public @Nullable Object updateState(
      ReactScrollView view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    view.setStateWrapper(stateWrapper);
    return null;
  }

  @Override
  public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(createExportedCustomDirectEventTypeConstants());
    return eventTypeConstants;
  }

  public static Map<String, Object> createExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.SCROLL),
            MapBuilder.of("registrationName", "onScroll"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.BEGIN_DRAG),
            MapBuilder.of("registrationName", "onScrollBeginDrag"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.END_DRAG),
            MapBuilder.of("registrationName", "onScrollEndDrag"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.MOMENTUM_BEGIN),
            MapBuilder.of("registrationName", "onMomentumScrollBegin"))
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.MOMENTUM_END),
            MapBuilder.of("registrationName", "onMomentumScrollEnd"))
        .build();
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public void setPointerEvents(ReactScrollView view, @Nullable String pointerEventsStr) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr));
  }

  @ReactProp(name = "scrollEventThrottle")
  public void setScrollEventThrottle(ReactScrollView view, int scrollEventThrottle) {
    view.setScrollEventThrottle(scrollEventThrottle);
  }

  @ReactProp(name = "horizontal")
  public void setHorizontal(ReactScrollView view, boolean horizontal) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactProp(name = "isInvertedVirtualizedList")
  public void setIsInvertedVirtualizedList(ReactScrollView view, boolean applyFix) {
    // Usually when inverting the scroll view we are using scaleY: -1 on the list
    // and on the parent container. HOWEVER, starting from android API 33 there is
    // a bug that can cause an ANR due to that. Thus we are using different transform
    // commands to circumvent the ANR. This however causes the vertical scrollbar to
    // be on the wrong side. Thus we are moving it to the other side, when the list
    // is inverted.
    // See also:
    //  - https://github.com/facebook/react-native/issues/35350
    //  - https://issuetracker.google.com/issues/287304310
    if (applyFix) {
      view.setVerticalScrollbarPosition(View.SCROLLBAR_POSITION_LEFT);
    } else {
      view.setVerticalScrollbarPosition(View.SCROLLBAR_POSITION_DEFAULT);
    }
  }
}
