/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/LayoutPrimitives.h>
#include <fabric/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * Describes results of layout process for partucular shadow node.
 */
struct LayoutMetrics {
  Rect frame;
  EdgeInsets contentInsets {0};
  EdgeInsets borderWidth {0};
  DisplayType displayType {DisplayType::Flex};
  LayoutDirection layoutDirection {LayoutDirection::Undefined};
  Float pointScaleFactor {1.0};

  Rect getContentFrame() const {
    return Rect {
      Point {contentInsets.left, contentInsets.top},
      Size {frame.size.width - contentInsets.left - contentInsets.right, frame.size.height - contentInsets.top - contentInsets.bottom}
    };
  }

  bool operator ==(const LayoutMetrics& rhs) const {
    return
      std::tie(this->frame, this->contentInsets, this->borderWidth, this->displayType, this->layoutDirection) ==
      std::tie(rhs.frame, rhs.contentInsets, rhs.borderWidth, rhs.displayType, rhs.layoutDirection);
  }

  bool operator !=(const LayoutMetrics& rhs) const {
    return !(*this == rhs);
  }
};

} // namespace react
} // namespace facebook
