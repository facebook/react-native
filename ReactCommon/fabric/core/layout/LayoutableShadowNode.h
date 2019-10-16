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
#include <react/core/Sealable.h>
#include <react/core/ShadowNode.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Transform.h>

namespace facebook {
namespace react {

struct LayoutConstraints;
struct LayoutContext;

/*
 * Describes all sufficient layout API (in approach-agnostic way)
 * which makes a concurrent layout possible.
 */
class LayoutableShadowNode : public virtual Sealable {
 public:
  using UnsharedList = better::
      small_vector<LayoutableShadowNode *, kShadowNodeChildrenSmallVectorSize>;

  virtual ~LayoutableShadowNode() noexcept = default;

  /*
   * Measures the node (and node content, probably recursively) with
   * given constrains and relying on possible layout.
   * Default implementation returns zero size.
   */
  virtual Size measure(LayoutConstraints layoutConstraints) const;

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
  virtual LayoutMetrics getLayoutMetrics() const;

  /*
   * Returns `true` if the node represents only information necessary for
   * layout computation and can be safely removed from view hierarchy.
   * Default implementation returns `false`.
   */
  virtual bool isLayoutOnly() const;

  /*
   * Returns a transform object that represents transformations that will/should
   * be applied on top of regular layout metrics by mounting layer.
   * The `transform` value modifies a coordinate space of a layout system.
   * Default implementation returns `Identity` transform.
   */
  virtual Transform getTransform() const;

  /*
   * Returns layout metrics relatively to the given ancestor node.
   */
  LayoutMetrics getRelativeLayoutMetrics(
      const LayoutableShadowNode &ancestorLayoutableShadowNode) const;

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
  virtual LayoutableShadowNode::UnsharedList getLayoutableChildNodes()
      const = 0;

  /*
   * In case layout algorithm needs to mutate this (probably sealed) node,
   * it has to clone and replace it in the hierarchy before to do so.
   */
  virtual LayoutableShadowNode *cloneAndReplaceChild(
      LayoutableShadowNode *child,
      int suggestedIndex = -1) = 0;

  /*
   * Sets layout metrics for the shadow node.
   * Returns true if the metrics are different from previous ones.
   */
  virtual bool setLayoutMetrics(LayoutMetrics layoutMetrics);

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif

 private:
  LayoutMetrics layoutMetrics_{};
};

} // namespace react
} // namespace facebook
