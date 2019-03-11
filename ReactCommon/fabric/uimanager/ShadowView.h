// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <react/core/LayoutMetrics.h>
#include <react/core/LocalData.h>
#include <react/core/Props.h>
#include <react/core/ReactPrimitives.h>
#include <react/core/ShadowNode.h>
#include <react/events/EventEmitter.h>

namespace facebook {
namespace react {

/*
 * Describes a view that can be mounted.
 */
struct ShadowView final {
  ShadowView() = default;
  ShadowView(const ShadowView &shadowView) = default;

  /*
   * Constructs a `ShadowView` from given `ShadowNode`.
   */
  explicit ShadowView(const ShadowNode &shadowNode);

  ShadowView &operator=(const ShadowView &other) = default;

  bool operator==(const ShadowView &rhs) const;
  bool operator!=(const ShadowView &rhs) const;

  ComponentName componentName = "";
  ComponentHandle componentHandle = 0;
  Tag tag = -1;
  SharedProps props = {};
  SharedEventEmitter eventEmitter = {};
  LayoutMetrics layoutMetrics = EmptyLayoutMetrics;
  SharedLocalData localData = {};
};

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 */
struct ShadowViewNodePair final {
  const ShadowView shadowView;
  const ShadowNode &shadowNode;

  /*
   * The stored pointer to `ShadowNode` represents an indentity of the pair.
   */
  bool operator==(const ShadowViewNodePair &rhs) const;
  bool operator!=(const ShadowViewNodePair &rhs) const;
};

using ShadowViewNodePairList = std::vector<ShadowViewNodePair>;

} // namespace react
} // namespace facebook
