/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewProps.h"

#include <react/renderer/components/scrollview/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/utils/CoreFeatures.h>

#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

ScrollViewProps::ScrollViewProps(
    const PropsParserContext& context,
    const ScrollViewProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      alwaysBounceHorizontal(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.alwaysBounceHorizontal
              : convertRawProp(
                    context,
                    rawProps,
                    "alwaysBounceHorizontal",
                    sourceProps.alwaysBounceHorizontal,
                    {})),
      alwaysBounceVertical(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.alwaysBounceVertical
              : convertRawProp(
                    context,
                    rawProps,
                    "alwaysBounceVertical",
                    sourceProps.alwaysBounceVertical,
                    {})),
      bounces(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.bounces
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "bounces",
                                                       sourceProps.bounces,
                                                       true)),
      bouncesZoom(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.bouncesZoom
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "bouncesZoom",
                                                       sourceProps.bouncesZoom,
                                                       true)),
      canCancelContentTouches(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.canCancelContentTouches
              : convertRawProp(
                    context,
                    rawProps,
                    "canCancelContentTouches",
                    sourceProps.canCancelContentTouches,
                    true)),
      centerContent(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.centerContent
              : convertRawProp(
                    context,
                    rawProps,
                    "centerContent",
                    sourceProps.centerContent,
                    {})),
      automaticallyAdjustContentInsets(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.automaticallyAdjustContentInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "automaticallyAdjustContentInsets",
                    sourceProps.automaticallyAdjustContentInsets,
                    {})),
      automaticallyAdjustsScrollIndicatorInsets(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.automaticallyAdjustsScrollIndicatorInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "automaticallyAdjustsScrollIndicatorInsets",
                    sourceProps.automaticallyAdjustsScrollIndicatorInsets,
                    true)),
      decelerationRate(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.decelerationRate
              : convertRawProp(
                    context,
                    rawProps,
                    "decelerationRate",
                    sourceProps.decelerationRate,
                    (Float)0.998)),
      endDraggingSensitivityMultiplier(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.endDraggingSensitivityMultiplier
              : convertRawProp(
                    context,
                    rawProps,
                    "endDraggingSensitivityMultiplier",
                    sourceProps.endDraggingSensitivityMultiplier,
                    1)),
      enableSyncOnScroll(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.enableSyncOnScroll
              : convertRawProp(
                    context,
                    rawProps,
                    "enableSyncOnScroll",
                    sourceProps.enableSyncOnScroll,
                    false)),
      directionalLockEnabled(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.directionalLockEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "directionalLockEnabled",
                    sourceProps.directionalLockEnabled,
                    {})),
      indicatorStyle(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.indicatorStyle
              : convertRawProp(
                    context,
                    rawProps,
                    "indicatorStyle",
                    sourceProps.indicatorStyle,
                    {})),
      keyboardDismissMode(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.keyboardDismissMode
              : convertRawProp(
                    context,
                    rawProps,
                    "keyboardDismissMode",
                    sourceProps.keyboardDismissMode,
                    {})),
      maintainVisibleContentPosition(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.maintainVisibleContentPosition
              : convertRawProp(
                    context,
                    rawProps,
                    "maintainVisibleContentPosition",
                    sourceProps.maintainVisibleContentPosition,
                    {})),
      maximumZoomScale(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.maximumZoomScale
              : convertRawProp(
                    context,
                    rawProps,
                    "maximumZoomScale",
                    sourceProps.maximumZoomScale,
                    (Float)1.0)),
      minimumZoomScale(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.minimumZoomScale
              : convertRawProp(
                    context,
                    rawProps,
                    "minimumZoomScale",
                    sourceProps.minimumZoomScale,
                    (Float)1.0)),
      scrollEnabled(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.scrollEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "scrollEnabled",
                    sourceProps.scrollEnabled,
                    true)),
      pagingEnabled(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.pagingEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "pagingEnabled",
                    sourceProps.pagingEnabled,
                    {})),
      pinchGestureEnabled(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.pinchGestureEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "pinchGestureEnabled",
                    sourceProps.pinchGestureEnabled,
                    true)),
      scrollsToTop(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.scrollsToTop
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "scrollsToTop",
                                                       sourceProps.scrollsToTop,
                                                       true)),
      showsHorizontalScrollIndicator(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.showsHorizontalScrollIndicator
              : convertRawProp(
                    context,
                    rawProps,
                    "showsHorizontalScrollIndicator",
                    sourceProps.showsHorizontalScrollIndicator,
                    true)),
      showsVerticalScrollIndicator(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.showsVerticalScrollIndicator
              : convertRawProp(
                    context,
                    rawProps,
                    "showsVerticalScrollIndicator",
                    sourceProps.showsVerticalScrollIndicator,
                    true)),
      persistentScrollbar(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.persistentScrollbar
              : convertRawProp(
                    context,
                    rawProps,
                    "persistentScrollbar",
                    sourceProps.persistentScrollbar,
                    true)),
      horizontal(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.horizontal
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "horizontal",
                                                       sourceProps.horizontal,
                                                       true)),
      scrollEventThrottle(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.scrollEventThrottle
              : convertRawProp(
                    context,
                    rawProps,
                    "scrollEventThrottle",
                    sourceProps.scrollEventThrottle,
                    {})),
      zoomScale(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.zoomScale
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "zoomScale",
                                                       sourceProps.zoomScale,
                                                       (Float)1.0)),
      contentInset(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.contentInset
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "contentInset",
                                                       sourceProps.contentInset,
                                                       {})),
      contentOffset(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.contentOffset
              : convertRawProp(
                    context,
                    rawProps,
                    "contentOffset",
                    sourceProps.contentOffset,
                    {})),
      scrollIndicatorInsets(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.scrollIndicatorInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "scrollIndicatorInsets",
                    sourceProps.scrollIndicatorInsets,
                    {})),
      snapToInterval(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.snapToInterval
              : convertRawProp(
                    context,
                    rawProps,
                    "snapToInterval",
                    sourceProps.snapToInterval,
                    {})),
      snapToAlignment(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.snapToAlignment
              : convertRawProp(
                    context,
                    rawProps,
                    "snapToAlignment",
                    sourceProps.snapToAlignment,
                    {})),
      disableIntervalMomentum(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.disableIntervalMomentum
              : convertRawProp(
                    context,
                    rawProps,
                    "disableIntervalMomentum",
                    sourceProps.disableIntervalMomentum,
                    {})),
      snapToOffsets(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.snapToOffsets
              : convertRawProp(
                    context,
                    rawProps,
                    "snapToOffsets",
                    sourceProps.snapToOffsets,
                    {})),
      snapToStart(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.snapToStart
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "snapToStart",
                                                       sourceProps.snapToStart,
                                                       true)),
      snapToEnd(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.snapToEnd
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "snapToEnd",
                                                       sourceProps.snapToEnd,
                                                       true)),
      contentInsetAdjustmentBehavior(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.contentInsetAdjustmentBehavior
              : convertRawProp(
                    context,
                    rawProps,
                    "contentInsetAdjustmentBehavior",
                    sourceProps.contentInsetAdjustmentBehavior,
                    {ContentInsetAdjustmentBehavior::Never})),
      scrollToOverflowEnabled(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.scrollToOverflowEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "scrollToOverflowEnabled",
                    sourceProps.scrollToOverflowEnabled,
                    {})),
      isInvertedVirtualizedList(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.isInvertedVirtualizedList
              : convertRawProp(
                    context,
                    rawProps,
                    "isInvertedVirtualizedList",
                    sourceProps.isInvertedVirtualizedList,
                    {})) {}

void ScrollViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  ViewProps::setProp(context, hash, propName, value);

  static auto defaults = ScrollViewProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(alwaysBounceHorizontal);
    RAW_SET_PROP_SWITCH_CASE_BASIC(alwaysBounceVertical);
    RAW_SET_PROP_SWITCH_CASE_BASIC(bounces);
    RAW_SET_PROP_SWITCH_CASE_BASIC(bouncesZoom);
    RAW_SET_PROP_SWITCH_CASE_BASIC(canCancelContentTouches);
    RAW_SET_PROP_SWITCH_CASE_BASIC(centerContent);
    RAW_SET_PROP_SWITCH_CASE_BASIC(automaticallyAdjustContentInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(automaticallyAdjustsScrollIndicatorInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(decelerationRate);
    RAW_SET_PROP_SWITCH_CASE_BASIC(directionalLockEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(indicatorStyle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardDismissMode);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maintainVisibleContentPosition);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maximumZoomScale);
    RAW_SET_PROP_SWITCH_CASE_BASIC(minimumZoomScale);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(enableSyncOnScroll);
    RAW_SET_PROP_SWITCH_CASE_BASIC(endDraggingSensitivityMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(pagingEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(pinchGestureEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollsToTop);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showsHorizontalScrollIndicator);
    RAW_SET_PROP_SWITCH_CASE_BASIC(persistentScrollbar);
    RAW_SET_PROP_SWITCH_CASE_BASIC(horizontal);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollEventThrottle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(zoomScale);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentInset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentOffset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollIndicatorInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToInterval);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToAlignment);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableIntervalMomentum);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToOffsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToStart);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToEnd);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentInsetAdjustmentBehavior);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollToOverflowEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(isInvertedVirtualizedList);
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ScrollViewProps::getDebugProps() const {
  auto defaultScrollViewProps = ScrollViewProps{};

  return ViewProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "alwaysBounceHorizontal",
              alwaysBounceHorizontal,
              defaultScrollViewProps.alwaysBounceHorizontal),
          debugStringConvertibleItem(
              "alwaysBounceVertical",
              alwaysBounceVertical,
              defaultScrollViewProps.alwaysBounceVertical),
          debugStringConvertibleItem(
              "bounces", bounces, defaultScrollViewProps.bounces),
          debugStringConvertibleItem(
              "bouncesZoom", bouncesZoom, defaultScrollViewProps.bouncesZoom),
          debugStringConvertibleItem(
              "canCancelContentTouches",
              canCancelContentTouches,
              defaultScrollViewProps.canCancelContentTouches),
          debugStringConvertibleItem(
              "centerContent",
              centerContent,
              defaultScrollViewProps.centerContent),
          debugStringConvertibleItem(
              "automaticallyAdjustContentInsets",
              automaticallyAdjustContentInsets,
              defaultScrollViewProps.automaticallyAdjustContentInsets),
          debugStringConvertibleItem(
              "automaticallyAdjustsScrollIndicatorInsets",
              automaticallyAdjustsScrollIndicatorInsets,
              defaultScrollViewProps.automaticallyAdjustsScrollIndicatorInsets),
          debugStringConvertibleItem(
              "decelerationRate",
              decelerationRate,
              defaultScrollViewProps.decelerationRate),
          debugStringConvertibleItem(
              "directionalLockEnabled",
              directionalLockEnabled,
              defaultScrollViewProps.directionalLockEnabled),
          debugStringConvertibleItem(
              "indicatorStyle",
              indicatorStyle,
              defaultScrollViewProps.indicatorStyle),
          debugStringConvertibleItem(
              "keyboardDismissMode",
              keyboardDismissMode,
              defaultScrollViewProps.keyboardDismissMode),
          debugStringConvertibleItem(
              "maintainVisibleContentPosition",
              maintainVisibleContentPosition,
              defaultScrollViewProps.maintainVisibleContentPosition),
          debugStringConvertibleItem(
              "maximumZoomScale",
              maximumZoomScale,
              defaultScrollViewProps.maximumZoomScale),
          debugStringConvertibleItem(
              "minimumZoomScale",
              minimumZoomScale,
              defaultScrollViewProps.minimumZoomScale),
          debugStringConvertibleItem(
              "scrollEnabled",
              scrollEnabled,
              defaultScrollViewProps.scrollEnabled),
          debugStringConvertibleItem(
              "pagingEnabled",
              pagingEnabled,
              defaultScrollViewProps.pagingEnabled),
          debugStringConvertibleItem(
              "pinchGestureEnabled",
              pinchGestureEnabled,
              defaultScrollViewProps.pinchGestureEnabled),
          debugStringConvertibleItem(
              "scrollsToTop",
              scrollsToTop,
              defaultScrollViewProps.scrollsToTop),
          debugStringConvertibleItem(
              "showsHorizontalScrollIndicator",
              showsHorizontalScrollIndicator,
              defaultScrollViewProps.showsHorizontalScrollIndicator),
          debugStringConvertibleItem(
              "showsVerticalScrollIndicator",
              showsVerticalScrollIndicator,
              defaultScrollViewProps.showsVerticalScrollIndicator),
          debugStringConvertibleItem(
              "persistentScrollbar",
              persistentScrollbar,
              defaultScrollViewProps.persistentScrollbar),
          debugStringConvertibleItem(
              "horizontal", horizontal, defaultScrollViewProps.horizontal),
          debugStringConvertibleItem(
              "scrollEventThrottle",
              scrollEventThrottle,
              defaultScrollViewProps.scrollEventThrottle),
          debugStringConvertibleItem(
              "zoomScale", zoomScale, defaultScrollViewProps.zoomScale),
          debugStringConvertibleItem(
              "contentInset",
              contentInset,
              defaultScrollViewProps.contentInset),
          debugStringConvertibleItem(
              "contentOffset",
              contentOffset,
              defaultScrollViewProps.contentOffset),
          debugStringConvertibleItem(
              "scrollIndicatorInsets",
              scrollIndicatorInsets,
              defaultScrollViewProps.scrollIndicatorInsets),
          debugStringConvertibleItem(
              "snapToInterval",
              snapToInterval,
              defaultScrollViewProps.snapToInterval),
          debugStringConvertibleItem(
              "snapToAlignment",
              snapToAlignment,
              defaultScrollViewProps.snapToAlignment),
          debugStringConvertibleItem(
              "disableIntervalMomentum",
              disableIntervalMomentum,
              defaultScrollViewProps.disableIntervalMomentum),
          debugStringConvertibleItem(
              "snapToStart", snapToStart, defaultScrollViewProps.snapToStart),
          debugStringConvertibleItem(
              "snapToEnd", snapToEnd, defaultScrollViewProps.snapToEnd),
          debugStringConvertibleItem(
              "isInvertedVirtualizedList",
              snapToEnd,
              defaultScrollViewProps.isInvertedVirtualizedList)};
}
#endif

} // namespace facebook::react
