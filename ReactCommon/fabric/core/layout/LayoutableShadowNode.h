/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cmath>
#include <memory>
#include <vector>

#include <better/small_vector.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/Transform.h>

namespace facebook {
namespace react {

struct LayoutConstraints;
struct LayoutContext;

/*
 * Describes all sufficient layout API (in approach-agnostic way)
 * which makes a concurrent layout possible.
 */
class LayoutableShadowNode : public ShadowNode {
 public:
  LayoutableShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits);

  LayoutableShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment);

  static ShadowNodeTraits BaseTraits();

  class LayoutInspectingPolicy final {
   public:
    bool includeTransform{true};
  };

  using UnsharedList = better::
      small_vector<LayoutableShadowNode *, kShadowNodeChildrenSmallVectorSize>;

  /*
   * Returns layout metrics of a node represented as `descendantNodeFamily`
   * computed relatively to given `ancestorNode`. Returns `EmptyLayoutMetrics`
   * if the nodes don't form an ancestor-descender relationship in the same
   * tree.
   */
  static LayoutMetrics computeRelativeLayoutMetrics(
      ShadowNodeFamily const &descendantNodeFamily,
      LayoutableShadowNode const &ancestorNode,
      LayoutInspectingPolicy policy);

  /*
   * Performs layout of the tree starting from this node. Usually is being
   * called on the root node.
   * Default implementation does nothing.
   */
  virtual void layoutTree(
      LayoutContext layoutContext,
      LayoutConstraints layoutConstraints);

  /*
   * Measures the node (and node content, probably recursively) with
   * given constrains and relying on possible layout.
   * Default implementation returns zero size.
   */
  virtual Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const;

  /*
   * Measures the node with given `layoutContext` and `layoutConstraints`.
   * The size of nested content and the padding should be included, the margin
   * should *not* be included. Default implementation returns zero size.
   */
  virtual Size measure(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const;

  /*
   * Computes layout recursively.
   * Additional environmental constraints might be provided via `layoutContext`
   * argument.
   * Default implementation basically calls `layoutChildren()` and then
   * `layout()` (recursively), and provides some obvious performance
   * optimization.
   */
  virtual void layout(LayoutContext layoutContext);

  /*
   * Returns layout metrics computed during previous layout pass.
   */
  LayoutMetrics getLayoutMetrics() const;

  /*
   * Returns a transform object that represents transformations that will/should
   * be applied on top of regular layout metrics by mounting layer.
   * The `transform` value modifies a coordinate space of a layout system.
   * Default implementation returns `Identity` transform.
   */
  virtual Transform getTransform() const;

  /*
   * Returns layout metrics relatively to the given ancestor node.
   * Uses `computeRelativeLayoutMetrics()` under the hood.
   */
  LayoutMetrics getRelativeLayoutMetrics(
      ShadowNodeFamily const &descendantNodeFamily,
      LayoutInspectingPolicy policy) const;

  /*
   * Returns layout metrics relatively to the given ancestor node.
   */
  LayoutMetrics getRelativeLayoutMetrics(
      LayoutableShadowNode const &ancestorLayoutableShadowNode,
      LayoutInspectingPolicy policy) const;

  /*
   * Sets layout metrics for the shadow node.
   * Returns true if the metrics are different from previous ones.
   */
  bool setLayoutMetrics(LayoutMetrics layoutMetrics);

  /*
   * Returns the ShadowNode that is rendered at the Point received as a
   * parameter.
   */
  static ShadowNode::Shared findNodeAtPoint(
      ShadowNode::Shared node,
      Point point);

 protected:
  /*
   * Clean or Dirty layout state:
   * Indicates whether all nodes (and possibly their subtrees) along the path
   * to the root node should be re-laid out.
   */
  virtual void cleanLayout() = 0;
  virtual void dirtyLayout() = 0;
  virtual bool getIsLayoutClean() const = 0;

  /*
   * Indicates does the shadow node (or any descendand node of the node)
   * get a new layout metrics during a previous layout pass.
   */
  virtual void setHasNewLayout(bool hasNewLayout) = 0;
  virtual bool getHasNewLayout() const = 0;

  /*
   * Applies layout for all children;
   * does not call anything in recursive manner *by desing*.
   */
  virtual void layoutChildren(LayoutContext layoutContext);

  /*
   * Unifed methods to access text layout metrics.
   */
  virtual Float firstBaseline(Size size) const;
  virtual Float lastBaseline(Size size) const;

  /*
   * Returns layoutable children to interate on.
   */
  LayoutableShadowNode::UnsharedList getLayoutableChildNodes() const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif

 private:
  LayoutMetrics layoutMetrics_;
};

template <>
inline LayoutableShadowNode const &traitCast<LayoutableShadowNode const &>(
    ShadowNode const &shadowNode) {
  bool castable =
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::LayoutableKind);
  assert(
      castable ==
      (dynamic_cast<LayoutableShadowNode const *>(&shadowNode) != nullptr));
  assert(castable);
  (void)castable;
  return static_cast<LayoutableShadowNode const &>(shadowNode);
}

template <>
inline LayoutableShadowNode const *traitCast<LayoutableShadowNode const *>(
    ShadowNode const *shadowNode) {
  if (!shadowNode) {
    return nullptr;
  }
  bool castable =
      shadowNode->getTraits().check(ShadowNodeTraits::Trait::LayoutableKind);
  assert(
      castable ==
      (dynamic_cast<LayoutableShadowNode const *>(shadowNode) != nullptr));
  if (!castable) {
    return nullptr;
  }
  return static_cast<LayoutableShadowNode const *>(shadowNode);
}

} // namespace react
} // namespace facebook
