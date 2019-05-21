// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <better/small_vector.h>
#include <folly/Hash.h>
#include <react/core/EventEmitter.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/LocalData.h>
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
  ShadowView(const ShadowView &shadowView) = default;
  ShadowView(ShadowView &&shadowView) noexcept = default;

  ~ShadowView(){};

  /*
   * Constructs a `ShadowView` from given `ShadowNode`.
   */
  explicit ShadowView(const ShadowNode &shadowNode);

  ShadowView &operator=(const ShadowView &other) = default;
  ShadowView &operator=(ShadowView &&other) = default;

  bool operator==(const ShadowView &rhs) const;
  bool operator!=(const ShadowView &rhs) const;

  ComponentName componentName = "";
  ComponentHandle componentHandle = 0;
  Tag tag = -1; // Tag does not change during the lifetime of a shadow view.
  SharedProps props = {};
  SharedEventEmitter eventEmitter = {};
  LayoutMetrics layoutMetrics = EmptyLayoutMetrics;
  SharedLocalData localData = {};
  State::Shared state = {};
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowView const &object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowView const &object,
    DebugStringConvertibleOptions options = {});

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
        shadowView.localData,
        shadowView.state);
  }
};

} // namespace std
