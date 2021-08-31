/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
      alwaysBounceHorizontal(convertRawProp(
          context,
          rawProps,
          "alwaysBounceHorizontal",
          sourceProps.alwaysBounceHorizontal,
          {})),
      alwaysBounceVertical(convertRawProp(
          context,
          rawProps,
          "alwaysBounceVertical",
          sourceProps.alwaysBounceVertical,
          {})),
      bounces(convertRawProp(
          context,
          rawProps,
          "bounces",
          sourceProps.bounces,
          true)),
      bouncesZoom(convertRawProp(
          context,
          rawProps,
          "bouncesZoom",
          sourceProps.bouncesZoom,
          true)),
      canCancelContentTouches(convertRawProp(
          context,
          rawProps,
          "canCancelContentTouches",
          sourceProps.canCancelContentTouches,
          true)),
      centerContent(convertRawProp(
          context,
          rawProps,
          "centerContent",
          sourceProps.centerContent,
          {})),
      automaticallyAdjustContentInsets(convertRawProp(
          context,
          rawProps,
          "automaticallyAdjustContentInsets",
          sourceProps.automaticallyAdjustContentInsets,
          {})),
      automaticallyAdjustsScrollIndicatorInsets(convertRawProp(
          context,
          rawProps,
          "automaticallyAdjustsScrollIndicatorInsets",
          sourceProps.automaticallyAdjustsScrollIndicatorInsets,
          true)),
      decelerationRate(convertRawProp(
          context,
          rawProps,
          "decelerationRate",
          sourceProps.decelerationRate,
          (Float)0.998)),
      directionalLockEnabled(convertRawProp(
          context,
          rawProps,
          "directionalLockEnabled",
          sourceProps.directionalLockEnabled,
          {})),
      indicatorStyle(convertRawProp(
          context,
          rawProps,
          "indicatorStyle",
          sourceProps.indicatorStyle,
          {})),
      keyboardDismissMode(convertRawProp(
          context,
          rawProps,
          "keyboardDismissMode",
          sourceProps.keyboardDismissMode,
          {})),
      maximumZoomScale(convertRawProp(
          context,
          rawProps,
          "maximumZoomScale",
          sourceProps.maximumZoomScale,
          (Float)1.0)),
      minimumZoomScale(convertRawProp(
          context,
          rawProps,
          "minimumZoomScale",
          sourceProps.minimumZoomScale,
          (Float)1.0)),
      scrollEnabled(convertRawProp(
          context,
          rawProps,
          "scrollEnabled",
          sourceProps.scrollEnabled,
          true)),
      pagingEnabled(convertRawProp(
          context,
          rawProps,
          "pagingEnabled",
          sourceProps.pagingEnabled,
          {})),
      pinchGestureEnabled(convertRawProp(
          context,
          rawProps,
          "pinchGestureEnabled",
          sourceProps.pinchGestureEnabled,
          true)),
      scrollsToTop(convertRawProp(
          context,
          rawProps,
          "scrollsToTop",
          sourceProps.scrollsToTop,
          true)),
      showsHorizontalScrollIndicator(convertRawProp(
          context,
          rawProps,
          "showsHorizontalScrollIndicator",
          sourceProps.showsHorizontalScrollIndicator,
          true)),
      showsVerticalScrollIndicator(convertRawProp(
          context,
          rawProps,
          "showsVerticalScrollIndicator",
          sourceProps.showsVerticalScrollIndicator,
          true)),
      scrollEventThrottle(convertRawProp(
          context,
          rawProps,
          "scrollEventThrottle",
          sourceProps.scrollEventThrottle,
          {})),
      zoomScale(convertRawProp(
          context,
          rawProps,
          "zoomScale",
          sourceProps.zoomScale,
          (Float)1.0)),
      contentInset(convertRawProp(
          context,
          rawProps,
          "contentInset",
          sourceProps.contentInset,
          {})),
      contentOffset(convertRawProp(
          context,
          rawProps,
          "contentOffset",
          sourceProps.contentOffset,
          {})),
      scrollIndicatorInsets(convertRawProp(
          context,
          rawProps,
          "scrollIndicatorInsets",
          sourceProps.scrollIndicatorInsets,
          {})),
      snapToInterval(convertRawProp(
          context,
          rawProps,
          "snapToInterval",
          sourceProps.snapToInterval,
          {})),
      snapToAlignment(convertRawProp(
          context,
          rawProps,
          "snapToAlignment",
          sourceProps.snapToAlignment,
          {})),
      disableIntervalMomentum(convertRawProp(
          context,
          rawProps,
          "disableIntervalMomentum",
          sourceProps.disableIntervalMomentum,
          {})),
      snapToOffsets(convertRawProp(
          context,
          rawProps,
          "snapToOffsets",
          sourceProps.snapToOffsets,
          {})),
      snapToStart(convertRawProp(
          context,
          rawProps,
          "snapToStart",
          sourceProps.snapToStart,
          true)),
      snapToEnd(convertRawProp(
          context,
          rawProps,
          "snapToEnd",
          sourceProps.snapToEnd,
          true)),
      contentInsetAdjustmentBehavior(convertRawProp(
          context,
          rawProps,
          "contentInsetAdjustmentBehavior",
          sourceProps.contentInsetAdjustmentBehavior,
          {ContentInsetAdjustmentBehavior::Never})),
      scrollToOverflowEnabled(convertRawProp(
          context,
          rawProps,
          "scrollToOverflowEnabled",
          sourceProps.scrollToOverflowEnabled,
          {})) {}

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
