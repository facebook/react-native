/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTElement.h>
#include <react/components/art/ARTShape.h>
#include <react/components/art/primitives.h>
#include <react/graphics/Geometry.h>
#include <functional>

#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Text Element
 */
class ARTText : public ARTShape {
 public:
  using ARTShared = std::shared_ptr<const ARTText>;
  ARTText(
      Float opacity,
      std::vector<Float> transform,
      std::vector<Float> d,
      std::vector<Float> stroke,
      std::vector<Float> strokeDash,
      std::vector<Float> fill,
      Float strokeWidth,
      int strokeCap,
      int strokeJoin,
      ARTTextAlignment alignment,
      ARTTextFrame frame)
      : ARTShape(
            opacity,
            transform,
            d,
            stroke,
            strokeDash,
            fill,
            strokeWidth,
            strokeCap,
            strokeJoin),
        alignment(alignment),
        frame(frame) {
    elementType = ARTElementType::Text;
  };
  ARTText() = default;
  virtual ~ARTText(){};

  bool operator==(const ARTElement &rhs) const override;
  bool operator!=(const ARTElement &rhs) const override;

  ARTTextAlignment alignment{ARTTextAlignment::Default};
  ARTTextFrame frame{};

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
