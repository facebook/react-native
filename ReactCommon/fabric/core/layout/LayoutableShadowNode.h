/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cmath>
#include <vector>
#include <memory>

#include <fabric/core/LayoutMetrics.h>
#include <fabric/core/Sealable.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

struct LayoutConstraints;
struct LayoutContext;

/*
 * Describes all sufficient layout API (in approach-agnostic way)
 * which makes a concurrent layout possible.
 */
class LayoutableShadowNode:
  public virtual Sealable {

public:

  /*
   * Measures the node (and node content, propbably recursivly) with
   * given constrains and relying on possible layout.
   * Default implementation returns zero size.
   */
  virtual Size measure(LayoutConstraints layoutConstraints) const;

  /*
   * Computes layout recusively.
   * Additional environmental constraints might be provided via `layoutContext`
   * argument.
   * Default implementation basically calls `layoutChildren()` and then `layout()`
   * (recursively), and provides some obvious performance optimization.
   */
  virtual void layout(LayoutContext layoutContext);

  /*
   * Returns layout metrics computed during previous layout pass.
   */
  virtual LayoutMetrics getLayoutMetrics() const;

protected:

  /*
   * Clean or Dirty layout state:
   * Indicates whether all nodes (and possibly their subtrees) along the path
   * to the root node should be re-layouted.
   */
  virtual void cleanLayout();
  virtual void dirtyLayout();
  virtual bool getIsLayoutClean() const;

  /*
   * Indicates does the shadow node (or any descendand node of the node)
   * get a new layout metrics during a previous layout pass.
   */
  virtual void setHasNewLayout(bool hasNewLayout);
  virtual bool getHasNewLayout() const;

  /*
   * Applies layout for all children;
   * does not call anything in recusive manner *by desing*.
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
  virtual std::vector<LayoutableShadowNode *> getLayoutableChildNodes() const = 0;

  /*
   * In case layout algorithm needs to mutate this (probably sealed) node,
   * it has to clone and replace it in the hierarchy before to do so.
   */
  virtual LayoutableShadowNode *cloneAndReplaceChild(LayoutableShadowNode *child, int suggestedIndex = -1) = 0;

  /*
   * Sets layout metrics for the shadow node.
   * Returns true if the metrics are different from previous ones.
   */
  virtual bool setLayoutMetrics(LayoutMetrics layoutMetrics);

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const;

private:
  LayoutMetrics layoutMetrics_ {};
  bool hasNewLayout_ {false};
  bool isLayoutClean_ {false};
};

} // namespace react
} // namespace facebook
