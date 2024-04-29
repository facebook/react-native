/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/Size.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/*
 * State for <ScrollView> component.
 */
class ScrollViewState final {
 public:
  ScrollViewState(
      Point contentOffset,
      Rect contentBoundingRect,
      int scrollAwayPaddingTop);
  ScrollViewState() = default;

  Point contentOffset;
  Rect contentBoundingRect;
  int scrollAwayPaddingTop;

  /*
   * Returns size of scrollable area.
   */
  Size getContentSize() const;

#ifdef ANDROID
  ScrollViewState(const ScrollViewState& previousState, folly::dynamic data)
      : contentOffset(
            {(Float)data["contentOffsetLeft"].getDouble(),
             (Float)data["contentOffsetTop"].getDouble()}),
        contentBoundingRect({}),
        scrollAwayPaddingTop((Float)data["scrollAwayPaddingTop"].getDouble()){};

  folly::dynamic getDynamic() const {
    return folly::dynamic::object("contentOffsetLeft", contentOffset.x)(
        "contentOffsetTop", contentOffset.y)(
        "scrollAwayPaddingTop", scrollAwayPaddingTop);
  };
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };
#endif
};

} // namespace facebook::react
