/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Hash.h>
#include <folly/Optional.h>
#include <react/components/art/primitives.h>
#include <react/core/Sealable.h>
#include <react/core/ShadowNode.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Geometry.h>
#include <react/mounting/ShadowView.h>
#include <functional>
#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of base ART Element
 */
class ARTElement {
 public:
  using Shared = std::shared_ptr<const ARTElement>;
  using ListOfShared = better::small_vector<ARTElement::Shared, 0>;

  ARTElement() = default;
  ARTElement(
      ARTElementType elementType,
      Float opacity,
      std::vector<Float> transform)
      : elementType(elementType), opacity(opacity), transform(transform){};
  virtual ~ARTElement(){};

  ARTElementType elementType;
  Float opacity;
  std::vector<Float> transform;

#ifdef ANDROID
  virtual folly::dynamic getDynamic() const = 0;
#endif
};

} // namespace react
} // namespace facebook
