/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewProps.h"

#include <react/renderer/components/scrollview/conversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/renderer/graphics/conversions.h>

#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

ScrollViewProps::ScrollViewProps(
    const PropsParserContext &context,
    ScrollViewProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      alwaysBounceHorizontal(
          Props::enablePropIteratorSetter
              ? sourceProps.alwaysBounceHorizontal
              : convertRawProp(
                    context,
                    rawProps,
                    "alwaysBounceHorizontal",
                    sourceProps.alwaysBounceHorizontal,
                    {})),
      alwaysBounceVertical(
          Props::enablePropIteratorSetter
              ? sourceProps.alwaysBounceVertical
              : convertRawProp(
                    context,
                    rawProps,
                    "alwaysBounceVertical",
                    sourceProps.alwaysBounceVertical,
                    {})),
      bounces(
          Props::enablePropIteratorSetter ? sourceProps.bounces
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "bounces",
                                                sourceProps.bounces,
                                                true)),
      bouncesZoom(
          Props::enablePropIteratorSetter ? sourceProps.bouncesZoom
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "bouncesZoom",
                                                sourceProps.bouncesZoom,
                                                true)),
      canCancelContentTouches(
          Props::enablePropIteratorSetter
              ? sourceProps.canCancelContentTouches
              : convertRawProp(
                    context,
                    rawProps,
                    "canCancelContentTouches",
                    sourceProps.canCancelContentTouches,
                    true)),
      centerContent(
          Props::enablePropIteratorSetter ? sourceProps.centerContent
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "centerContent",
                                                sourceProps.centerContent,
                                                {})),
      automaticallyAdjustContentInsets(
          Props::enablePropIteratorSetter
              ? sourceProps.automaticallyAdjustContentInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "automaticallyAdjustContentInsets",
                    sourceProps.automaticallyAdjustContentInsets,
                    {})),
      automaticallyAdjustsScrollIndicatorInsets(
          Props::enablePropIteratorSetter
              ? sourceProps.automaticallyAdjustsScrollIndicatorInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "automaticallyAdjustsScrollIndicatorInsets",
                    sourceProps.automaticallyAdjustsScrollIndicatorInsets,
                    true)),
      decelerationRate(
          Props::enablePropIteratorSetter ? sourceProps.decelerationRate
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "decelerationRate",
                                                sourceProps.decelerationRate,
                                                (Float)0.998)),
      directionalLockEnabled(
          Props::enablePropIteratorSetter
              ? sourceProps.directionalLockEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "directionalLockEnabled",
                    sourceProps.directionalLockEnabled,
                    {})),
      indicatorStyle(
          Props::enablePropIteratorSetter ? sourceProps.indicatorStyle
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "indicatorStyle",
                                                sourceProps.indicatorStyle,
                                                {})),
      keyboardDismissMode(
          Props::enablePropIteratorSetter ? sourceProps.keyboardDismissMode
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "keyboardDismissMode",
                                                sourceProps.keyboardDismissMode,
                                                {})),
      maximumZoomScale(
          Props::enablePropIteratorSetter ? sourceProps.maximumZoomScale
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "maximumZoomScale",
                                                sourceProps.maximumZoomScale,
                                                (Float)1.0)),
      minimumZoomScale(
          Props::enablePropIteratorSetter ? sourceProps.minimumZoomScale
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "minimumZoomScale",
                                                sourceProps.minimumZoomScale,
                                                (Float)1.0)),
      scrollEnabled(
          Props::enablePropIteratorSetter ? sourceProps.scrollEnabled
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "scrollEnabled",
                                                sourceProps.scrollEnabled,
                                                true)),
      pagingEnabled(
          Props::enablePropIteratorSetter ? sourceProps.pagingEnabled
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "pagingEnabled",
                                                sourceProps.pagingEnabled,
                                                {})),
      pinchGestureEnabled(
          Props::enablePropIteratorSetter ? sourceProps.pinchGestureEnabled
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "pinchGestureEnabled",
                                                sourceProps.pinchGestureEnabled,
                                                true)),
      scrollsToTop(
          Props::enablePropIteratorSetter ? sourceProps.scrollsToTop
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "scrollsToTop",
                                                sourceProps.scrollsToTop,
                                                true)),
      showsHorizontalScrollIndicator(
          Props::enablePropIteratorSetter
              ? sourceProps.showsHorizontalScrollIndicator
              : convertRawProp(
                    context,
                    rawProps,
                    "showsHorizontalScrollIndicator",
                    sourceProps.showsHorizontalScrollIndicator,
                    true)),
      showsVerticalScrollIndicator(
          Props::enablePropIteratorSetter
              ? sourceProps.showsVerticalScrollIndicator
              : convertRawProp(
                    context,
                    rawProps,
                    "showsVerticalScrollIndicator",
                    sourceProps.showsVerticalScrollIndicator,
                    true)),
      scrollEventThrottle(
          Props::enablePropIteratorSetter ? sourceProps.scrollEventThrottle
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "scrollEventThrottle",
                                                sourceProps.scrollEventThrottle,
                                                {})),
      zoomScale(
          Props::enablePropIteratorSetter ? sourceProps.zoomScale
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "zoomScale",
                                                sourceProps.zoomScale,
                                                (Float)1.0)),
      contentInset(
          Props::enablePropIteratorSetter ? sourceProps.contentInset
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "contentInset",
                                                sourceProps.contentInset,
                                                {})),
      contentOffset(
          Props::enablePropIteratorSetter ? sourceProps.contentOffset
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "contentOffset",
                                                sourceProps.contentOffset,
                                                {})),
      scrollIndicatorInsets(
          Props::enablePropIteratorSetter
              ? sourceProps.scrollIndicatorInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "scrollIndicatorInsets",
                    sourceProps.scrollIndicatorInsets,
                    {})),
      snapToInterval(
          Props::enablePropIteratorSetter ? sourceProps.snapToInterval
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "snapToInterval",
                                                sourceProps.snapToInterval,
                                                {})),
      snapToAlignment(
          Props::enablePropIteratorSetter ? sourceProps.snapToAlignment
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "snapToAlignment",
                                                sourceProps.snapToAlignment,
                                                {})),
      disableIntervalMomentum(
          Props::enablePropIteratorSetter
              ? sourceProps.disableIntervalMomentum
              : convertRawProp(
                    context,
                    rawProps,
                    "disableIntervalMomentum",
                    sourceProps.disableIntervalMomentum,
                    {})),
      snapToOffsets(
          Props::enablePropIteratorSetter ? sourceProps.snapToOffsets
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "snapToOffsets",
                                                sourceProps.snapToOffsets,
                                                {})),
      snapToStart(
          Props::enablePropIteratorSetter ? sourceProps.snapToStart
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "snapToStart",
                                                sourceProps.snapToStart,
                                                true)),
      snapToEnd(
          Props::enablePropIteratorSetter ? sourceProps.snapToEnd
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "snapToEnd",
                                                sourceProps.snapToEnd,
                                                true)),
      contentInsetAdjustmentBehavior(
          Props::enablePropIteratorSetter
              ? sourceProps.contentInsetAdjustmentBehavior
              : convertRawProp(
                    context,
                    rawProps,
                    "contentInsetAdjustmentBehavior",
                    sourceProps.contentInsetAdjustmentBehavior,
                    {ContentInsetAdjustmentBehavior::Never})),
      scrollToOverflowEnabled(
          Props::enablePropIteratorSetter
              ? sourceProps.scrollToOverflowEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "scrollToOverflowEnabled",
                    sourceProps.scrollToOverflowEnabled,
                    {})) {}

void ScrollViewProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  ViewProps::setProp(context, hash, propName, value);
  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(alwaysBounceHorizontal, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(alwaysBounceVertical, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(bounces, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(bouncesZoom, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(canCancelContentTouches, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(centerContent, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(automaticallyAdjustContentInsets, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(
        automaticallyAdjustsScrollIndicatorInsets, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(decelerationRate, (Float)0.998);
    RAW_SET_PROP_SWITCH_CASE_BASIC(directionalLockEnabled, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(indicatorStyle, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardDismissMode, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(maximumZoomScale, (Float)1.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(minimumZoomScale, (Float)1.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollEnabled, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(pagingEnabled, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(pinchGestureEnabled, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollsToTop, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showsHorizontalScrollIndicator, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showsVerticalScrollIndicator, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollEventThrottle, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(zoomScale, (Float)1.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentInset, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentOffset, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollIndicatorInsets, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToInterval, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToAlignment, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableIntervalMomentum, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToOffsets, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToStart, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToEnd, true);
    RAW_SET_PROP_SWITCH_CASE_BASIC(
        contentInsetAdjustmentBehavior, ContentInsetAdjustmentBehavior::Never);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollToOverflowEnabled, {});
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
              "snapToEnd", snapToEnd, defaultScrollViewProps.snapToEnd)};
}
#endif

} // namespace react
} // namespace facebook
