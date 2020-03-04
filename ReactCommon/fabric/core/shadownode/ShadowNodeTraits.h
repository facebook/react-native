/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace facebook {
namespace react {

/*
 * A set of predefined traits associated with a particular `ShadowNode` class
 * and an instance of that class. Used for efficient checking for interface
 * conformance for and storing important flags.
 */
class ShadowNodeTraits {
 public:
  /*
   * Underlying type for the traits.
   * The first 16 bits are reserved for Core.
   */
  enum Trait : int32_t {
    None = 0,

    // Note:
    // Not all traits are used yet (but all will be used in the near future).

    // Inherits `LayoutableShadowNode`.
    LayoutableKind = 1 << 0,

    // Inherits `YogaLayoutableShadowNode`.
    YogaLayoutableKind = 1 << 1,

    // Inherits `ConcreteViewShadowNode<>` template.
    ViewKind = 1 << 2,

    // Inherits `BaseTextShadowNode`.
    TextKind = 1 << 3,

    // Used when calculating relative layout in
    // LayoutableShadowNode::getRelativeLayoutMetrics. This trait marks node as
    // root, so when calculating relative layout, the calculation will not
    // traverse beyond this node. See T61257516 for details.
    RootNodeKind = 1 << 4,

    // `ViewShadowNode` (exact!) class.
    View = 1 << 5,

    // Inherits `YogaLayoutableShadowNode` and enforces that the `YGNode` is a
    // leaf.
    LeafYogaNode = 1 << 10,

    // Inherits `LayoutableShadowNode` and calls `measure()`.
    HasMeasure = 1 << 11,

    // Indicates that the `ShadowNode` must form a stacking context (a level
    // of the hierarchy; `ShadowView`s formed by descendants the node will be
    // descendants of a `ShadowView` formed by the node).
    FormsStackingContext = 1 << 13,

    // Indicates that the node must form a `ShadowView`.
    FormsView = 1 << 14,

    // Internal to `ShadowNode`; do not use it outside.
    // Indicates that `children` list is shared between nodes and need
    // to be cloned before the first mutation.
    ChildrenAreShared = 1 << 15,
  };

  /*
   * Sets, unsets, and checks individual traits.
   */
  inline void set(Trait trait) {
    traits_ = ShadowNodeTraits::Trait(traits_ | trait);
  }

  inline void unset(Trait trait) {
    traits_ = ShadowNodeTraits::Trait(traits_ & ~trait);
  }

  inline bool check(Trait traits) const {
    return ShadowNodeTraits::Trait(traits_ & traits) == traits;
  }

 private:
  Trait traits_{Trait::None};
};

} // namespace react
} // namespace facebook
