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

  virtual bool operator==(const ARTElement &rhs) const = 0;
  virtual bool operator!=(const ARTElement &rhs) const = 0;
  friend bool operator==(ListOfShared e1, ListOfShared e2) {
    bool equals = e1.size() == e2.size();
    for (int i = 0; i < equals && e1.size(); i++) {
      // Pointer equality - this will work if both are pointing at the same
      // object, or both are nullptr
      if (e1[i] == e2[i]) {
        continue;
      }

      // Get pointers from both
      // If one is null, we know they can't both be null because of the above
      // check
      auto ptr1 = e1[i].get();
      auto ptr2 = e2[i].get();
      if (ptr1 == nullptr || ptr2 == nullptr) {
        equals = false;
        break;
      }

      // Dereference and compare objects
      if (*ptr1 != *ptr2) {
        equals = false;
        break;
      }
    }

    return equals;
  };

#ifdef ANDROID
  virtual folly::dynamic getDynamic() const = 0;
#endif
};

} // namespace react
} // namespace facebook
