/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewProps.h"

#include <fabric/graphics/conversions.h>
#include <fabric/scrollview/conversions.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

#include <fabric/core/propsConversions.h>

namespace facebook {
namespace react {

ScrollViewProps::ScrollViewProps(const ScrollViewProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  alwaysBounceHorizontal(convertRawProp(rawProps, "alwaysBounceHorizontal", sourceProps.alwaysBounceHorizontal)),
  alwaysBounceVertical(convertRawProp(rawProps, "alwaysBounceVertical", sourceProps.alwaysBounceVertical)),
  bounces(convertRawProp(rawProps, "bounces", sourceProps.bounces)),
  bouncesZoom(convertRawProp(rawProps, "bouncesZoom", sourceProps.bouncesZoom)),
  canCancelContentTouches(convertRawProp(rawProps, "canCancelContentTouches", sourceProps.canCancelContentTouches)),
  centerContent(convertRawProp(rawProps, "centerContent", sourceProps.centerContent)),
  automaticallyAdjustContentInsets(convertRawProp(rawProps, "automaticallyAdjustContentInsets", sourceProps.automaticallyAdjustContentInsets)),
  decelerationRate(convertRawProp(rawProps, "decelerationRate", sourceProps.decelerationRate)),
  directionalLockEnabled(convertRawProp(rawProps, "directionalLockEnabled", sourceProps.directionalLockEnabled)),
  indicatorStyle(convertRawProp(rawProps, "indicatorStyle", sourceProps.indicatorStyle)),
  keyboardDismissMode(convertRawProp(rawProps, "keyboardDismissMode", sourceProps.keyboardDismissMode)),
  maximumZoomScale(convertRawProp(rawProps, "maximumZoomScale", sourceProps.maximumZoomScale)),
  minimumZoomScale(convertRawProp(rawProps, "minimumZoomScale", sourceProps.minimumZoomScale)),
  scrollEnabled(convertRawProp(rawProps, "scrollEnabled", sourceProps.scrollEnabled)),
  pagingEnabled(convertRawProp(rawProps, "pagingEnabled", sourceProps.pagingEnabled)),
  pinchGestureEnabled(convertRawProp(rawProps, "pinchGestureEnabled", sourceProps.pinchGestureEnabled)),
  scrollsToTop(convertRawProp(rawProps, "scrollsToTop", sourceProps.scrollsToTop)),
  showsHorizontalScrollIndicator(convertRawProp(rawProps, "showsHorizontalScrollIndicator", sourceProps.showsHorizontalScrollIndicator)),
  showsVerticalScrollIndicator(convertRawProp(rawProps, "showsVerticalScrollIndicator", sourceProps.showsVerticalScrollIndicator)),
  scrollEventThrottle(convertRawProp(rawProps, "scrollEventThrottle", sourceProps.scrollEventThrottle)),
  zoomScale(convertRawProp(rawProps, "zoomScale", sourceProps.zoomScale)),
  contentInset(convertRawProp(rawProps, "contentInset", sourceProps.contentInset)),
  scrollIndicatorInsets(convertRawProp(rawProps, "scrollIndicatorInsets", sourceProps.scrollIndicatorInsets)),
  snapToInterval(convertRawProp(rawProps, "snapToInterval", sourceProps.snapToInterval)),
  snapToAlignment(convertRawProp(rawProps, "snapToAlignment", sourceProps.snapToAlignment)) {}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ScrollViewProps::getDebugProps() const {
  ScrollViewProps defaultScrollViewProps;

  return
    ViewProps::getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("alwaysBounceHorizontal", alwaysBounceHorizontal, defaultScrollViewProps.alwaysBounceHorizontal),
      debugStringConvertibleItem("alwaysBounceVertical", alwaysBounceVertical, defaultScrollViewProps.alwaysBounceVertical),
      debugStringConvertibleItem("bounces", bounces, defaultScrollViewProps.bounces),
      debugStringConvertibleItem("bouncesZoom", bouncesZoom, defaultScrollViewProps.bouncesZoom),
      debugStringConvertibleItem("canCancelContentTouches", canCancelContentTouches, defaultScrollViewProps.canCancelContentTouches),
      debugStringConvertibleItem("centerContent", centerContent, defaultScrollViewProps.centerContent),
      debugStringConvertibleItem("automaticallyAdjustContentInsets", automaticallyAdjustContentInsets, defaultScrollViewProps.automaticallyAdjustContentInsets),
      debugStringConvertibleItem("decelerationRate", decelerationRate, defaultScrollViewProps.decelerationRate),
      debugStringConvertibleItem("directionalLockEnabled", directionalLockEnabled, defaultScrollViewProps.directionalLockEnabled),
      debugStringConvertibleItem("indicatorStyle", indicatorStyle, defaultScrollViewProps.indicatorStyle),
      debugStringConvertibleItem("keyboardDismissMode", keyboardDismissMode, defaultScrollViewProps.keyboardDismissMode),
      debugStringConvertibleItem("maximumZoomScale", maximumZoomScale, defaultScrollViewProps.maximumZoomScale),
      debugStringConvertibleItem("minimumZoomScale", minimumZoomScale, defaultScrollViewProps.minimumZoomScale),
      debugStringConvertibleItem("scrollEnabled", scrollEnabled, defaultScrollViewProps.scrollEnabled),
      debugStringConvertibleItem("pagingEnabled", pagingEnabled, defaultScrollViewProps.pagingEnabled),
      debugStringConvertibleItem("pinchGestureEnabled", pinchGestureEnabled, defaultScrollViewProps.pinchGestureEnabled),
      debugStringConvertibleItem("scrollsToTop", scrollsToTop, defaultScrollViewProps.scrollsToTop),
      debugStringConvertibleItem("showsHorizontalScrollIndicator", showsHorizontalScrollIndicator, defaultScrollViewProps.showsHorizontalScrollIndicator),
      debugStringConvertibleItem("showsVerticalScrollIndicator", showsVerticalScrollIndicator, defaultScrollViewProps.showsVerticalScrollIndicator),
      debugStringConvertibleItem("scrollEventThrottle", scrollEventThrottle, defaultScrollViewProps.scrollEventThrottle),
      debugStringConvertibleItem("zoomScale", zoomScale, defaultScrollViewProps.zoomScale),
      debugStringConvertibleItem("contentInset", contentInset, defaultScrollViewProps.contentInset),
      debugStringConvertibleItem("scrollIndicatorInsets", scrollIndicatorInsets, defaultScrollViewProps.scrollIndicatorInsets),
      debugStringConvertibleItem("snapToInterval", snapToInterval, defaultScrollViewProps.snapToInterval),
      debugStringConvertibleItem("snapToAlignment", snapToAlignment, defaultScrollViewProps.snapToAlignment),
    };
}

} // namespace react
} // namespace facebook
