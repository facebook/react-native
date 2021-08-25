/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTElement.h>
#include <react/components/art/ARTGroup.h>
#include <react/core/Props.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Geometry.h>
#include <memory>

namespace facebook {
namespace react {

class ARTGroupProps;

class ARTGroupProps : public Props {
 public:
  ARTGroupProps() = default;
  ARTGroupProps(const ARTGroupProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  Float opacity{1.0};
  std::vector<Float> transform{};
  std::vector<Float> clipping{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook
