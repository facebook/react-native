/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

namespace facebook {
namespace react {

enum class ScrollViewSnapToAlignment { Start, Center, End };

enum class ScrollViewIndicatorStyle { Default, Black, White };

enum class ScrollViewKeyboardDismissMode { None, OnDrag, Interactive };

enum class ContentInsetAdjustmentBehavior {
  Never,
  Automatic,
  ScrollableAxes,
  Always
};

class ScrollViewMaintainVisibleContentPosition final {
 public:
  int minIndexForVisible{0};
  std::optional<int> autoscrollToTopThreshold{};

  bool operator==(const ScrollViewMaintainVisibleContentPosition &rhs) const {
    return std::tie(this->minIndexForVisible, this->autoscrollToTopThreshold) ==
        std::tie(rhs.minIndexForVisible, rhs.autoscrollToTopThreshold);
  }

  bool operator!=(const ScrollViewMaintainVisibleContentPosition &rhs) const {
    return !(*this == rhs);
  }
};

} // namespace react
} // namespace facebook
