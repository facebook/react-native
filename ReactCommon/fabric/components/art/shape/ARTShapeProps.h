/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Geometry.h>
#include <memory>

#include <react/core/Props.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class ARTShapeProps;

class ARTShapeProps : public Props {
 public:
  ARTShapeProps() = default;
  ARTShapeProps(const ARTShapeProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  Float opacity{1.0};
  std::vector<Float> transform{};
  std::vector<Float> d{};
  std::vector<Float> stroke{};
  std::vector<Float> strokeDash{};
  std::vector<Float> fill{};
  Float strokeWidth{1.0};
  int strokeCap{1};
  int strokeJoin{1};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook
