/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <yoga/YGNode.h>

#include <react/components/view/YogaStylableProps.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/core/Sealable.h>
#include <react/core/ShadowNode.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

class YogaLayoutableShadowNode : public LayoutableShadowNode,
                                 public virtual DebugStringConvertible,
                                 public virtual Sealable {
 public:
  using UnsharedList = better::small_vector<
      YogaLayoutableShadowNode *,
      kShadowNodeChildrenSmallVectorSize>;

#pragma mark - Constructors

  YogaLayoutableShadowNode(bool isLeaf);

  YogaLayoutableShadowNode(
      YogaLayoutableShadowNode const &layoutableShadowNode);

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  /*
   * Appends `child`'s Yoga node to the own Yoga node.
   * Complements `ShadowNode::appendChild(...)` functionality from Yoga
   * perspective.
   */
  void appendChild(YogaLayoutableShadowNode *child);

  /*
   * Sets Yoga children based on collection of `YogaLayoutableShadowNode`
   * instances. Complements `ShadowNode::setChildren(...)` functionality from
   * Yoga perspective.
   */
  void setChildren(YogaLayoutableShadowNode::UnsharedList children);

  /*
   * Sets Yoga styles based on given `YogaStylableProps`.
   */
  void setProps(const YogaStylableProps &props);

  /*
   * Sets layoutable size of node.
   */
  void setSize(Size size) const;

  void setPadding(RectangleEdges<Float> padding) const;

  /*
   * Sets position type of Yoga node (relative, absolute).
   */
  void setPositionType(YGPositionType positionType) const;

#pragma mark - LayoutableShadowNode

  void cleanLayout() override;
  void dirtyLayout() override;
  bool getIsLayoutClean() const override;

  void setHasNewLayout(bool hasNewLayout) override;
  bool getHasNewLayout() const override;

  /*
   * Computes layout using Yoga layout engine.
   * See `LayoutableShadowNode` for more details.
   */
  void layout(LayoutContext layoutContext) override;

  void layoutChildren(LayoutContext layoutContext) override;

  LayoutableShadowNode::UnsharedList getLayoutableChildNodes() const override;

 protected:
  /*
   * Yoga config associated (only) with this particular node.
   */
  YGConfig yogaConfig_;

  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable YGNode yogaNode_;

  /*
   * Forces associated YGNode to be a leaf.
   * Adding a child `ShadowNode` will not add `YGNode` associated with it as a
   * child to the stored `YGNode`.
   */
  bool const isLeaf_;

 private:
  static YGConfig &initializeYogaConfig(YGConfig &config);
  static YGNode *yogaNodeCloneCallbackConnector(
      YGNode *oldYogaNode,
      YGNode *parentYogaNode,
      int childIndex);
  static YGSize yogaNodeMeasureCallbackConnector(
      YGNode *yogaNode,
      float width,
      YGMeasureMode widthMode,
      float height,
      YGMeasureMode heightMode);
};

} // namespace react
} // namespace facebook
