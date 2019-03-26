/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <yoga/YGNode.h>

#include <fabric/components/view/YogaStylableProps.h>
#include <fabric/core/LayoutableShadowNode.h>
#include <fabric/core/Sealable.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class YogaLayoutableShadowNode:
  public LayoutableShadowNode,
  public virtual DebugStringConvertible,
  public virtual Sealable {

public:

#pragma mark - Constructors

  YogaLayoutableShadowNode();

  YogaLayoutableShadowNode(const YogaLayoutableShadowNode &layoutableShadowNode);

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  /*
   * Appends `child`'s Yoga node to the own Yoga node.
   * Complements `ShadowNode::appendChild(...)` functionality from Yoga perspective.
   */
  void appendChild(YogaLayoutableShadowNode *child);

  /*
   * Sets Yoga children based on collection of `YogaLayoutableShadowNode` instances.
   * Complements `ShadowNode::setChildren(...)` functionality from Yoga perspective.
   */
  void setChildren(std::vector<YogaLayoutableShadowNode *> children);

  /*
   * Sets Yoga styles based on given `YogaStylableProps`.
   */
  void setProps(const YogaStylableProps &props);

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

  std::vector<LayoutableShadowNode *> getLayoutableChildNodes() const override;

protected:
  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable YGNode yogaNode_;

  /*
   * Yoga config associated (only) with this particular node.
   */
  YGConfig yogaConfig_;

private:
  static void initializeYogaConfig(YGConfig &config);
  static YGNode *yogaNodeCloneCallbackConnector(YGNode *oldYogaNode, YGNode *parentYogaNode, int childIndex);
  static YGSize yogaNodeMeasureCallbackConnector(YGNode *yogaNode, float width, YGMeasureMode widthMode, float height, YGMeasureMode heightMode);
};

} // namespace react
} // namespace facebook
