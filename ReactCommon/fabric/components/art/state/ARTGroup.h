/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTElement.h>
#include <react/components/art/primitives.h>
#include <react/graphics/Geometry.h>
#include <functional>
#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Group element
 */
class ARTGroup : public ARTElement {
 public:
  using Shared = std::shared_ptr<const ARTElement>;
  ARTGroup(
      Float opacity,
      std::vector<Float> transform,
      ARTGroup::ListOfShared elements,
      std::vector<Float> clipping)
      : ARTElement(ARTElementType::Group, opacity, transform),
        elements(elements),
        clipping(clipping){};
  ARTGroup() = default;
  virtual ~ARTGroup(){};

  ARTElement::ListOfShared elements{};

  std::vector<Float> clipping{};

  bool operator==(const ARTElement &rhs) const override;
  bool operator!=(const ARTElement &rhs) const override;

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
