/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/scrollview/primitives.h>
#include <react/components/view/ViewProps.h>

namespace facebook {
namespace react {

// TODO (T28334063): Consider for codegen.
class ScrollViewProps final : public ViewProps {
 public:
  ScrollViewProps() = default;
  ScrollViewProps(ScrollViewProps const &sourceProps, RawProps const &rawProps);

#pragma mark - Props

  bool const alwaysBounceHorizontal{};
  bool const alwaysBounceVertical{};
  bool const bounces{true};
  bool const bouncesZoom{true};
  bool const canCancelContentTouches{true};
  bool const centerContent{};
  bool const automaticallyAdjustContentInsets{};
  Float const decelerationRate{0.998};
  bool const directionalLockEnabled{};
  ScrollViewIndicatorStyle const indicatorStyle{};
  ScrollViewKeyboardDismissMode const keyboardDismissMode{};
  Float const maximumZoomScale{1.0};
  Float const minimumZoomScale{1.0};
  bool const scrollEnabled{true};
  bool const pagingEnabled{};
  bool const pinchGestureEnabled{true};
  bool const scrollsToTop{true};
  bool const showsHorizontalScrollIndicator{true};
  bool const showsVerticalScrollIndicator{true};
  Float const scrollEventThrottle{};
  Float const zoomScale{1.0};
  EdgeInsets const contentInset{};
  Point const contentOffset{};
  EdgeInsets const scrollIndicatorInsets{};
  Float const snapToInterval{};
  ScrollViewSnapToAlignment const snapToAlignment{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook
