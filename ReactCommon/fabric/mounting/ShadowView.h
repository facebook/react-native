/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/small_vector.h>
#include <folly/Hash.h>
#include <react/core/EventEmitter.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/Props.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

/*
 * Describes a view that can be mounted.
 */
struct ShadowView final {
  ShadowView() = default;
  ShadowView(ShadowView const &shadowView) = default;
  ShadowView(ShadowView &&shadowView) noexcept = default;

  /*
   * Constructs a `ShadowView` from given `ShadowNode`.
   */
  explicit ShadowView(ShadowNode const &shadowNode);

  ShadowView &operator=(ShadowView const &other) = default;
  ShadowView &operator=(ShadowView &&other) = default;

  bool operator==(ShadowView const &rhs) const;
  bool operator!=(ShadowView const &rhs) const;

  ComponentName componentName{};
  ComponentHandle componentHandle{};
  Tag tag{};
  Props::Shared props{};
  EventEmitter::Shared eventEmitter{};
  LayoutMetrics layoutMetrics{EmptyLayoutMetrics};
  State::Shared state{};
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowView const &object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowView const &object,
    DebugStringConvertibleOptions options);

#endif

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 */
struct ShadowViewNodePair final {
  using List = better::
      small_vector<ShadowViewNodePair, kShadowNodeChildrenSmallVectorSize>;

  ShadowView shadowView;
  ShadowNode const *shadowNode;

  /*
   * The stored pointer to `ShadowNode` represents an indentity of the pair.
   */
  bool operator==(const ShadowViewNodePair &rhs) const;
  bool operator!=(const ShadowViewNodePair &rhs) const;
};

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::ShadowView> {
  size_t operator()(const facebook::react::ShadowView &shadowView) const {
    return folly::hash::hash_combine(
        0,
        shadowView.componentHandle,
        shadowView.tag,
        shadowView.props,
        shadowView.eventEmitter,
        shadowView.state);
  }
};

} // namespace std
