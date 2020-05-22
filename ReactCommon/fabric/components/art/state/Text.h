/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/Element.h>
#include <react/components/art/Shape.h>
#include <react/components/art/primitives.h>
#include <react/graphics/Geometry.h>
#include <functional>

#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Text Element
 */
class Text : public Shape {
 public:
  using Shared = std::shared_ptr<const Text>;
  Text(
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
      : Shape(
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
        frame(frame){};
  Text() = default;
  virtual ~Text(){};

  ARTTextAlignment alignment{ARTTextAlignment::Default};
  ARTTextFrame frame{};

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
