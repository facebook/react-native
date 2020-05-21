/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/Element.h>
#include <react/components/art/primitives.h>
#include <react/graphics/Geometry.h>
#include <functional>
#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Group element
 */
class Group : public Element {
 public:
  using Shared = std::shared_ptr<const Group>;
  Group(
      Float opacity,
      std::vector<Float> transform,
      Element::ListOfShared elements,
      std::vector<Float> clipping)
      : Element(ARTElement::Group, opacity, transform),
        elements(elements),
        clipping(clipping){};
  Group() = default;
  virtual ~Group(){};

  Element::ListOfShared elements{};

  std::vector<Float> clipping{};

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
