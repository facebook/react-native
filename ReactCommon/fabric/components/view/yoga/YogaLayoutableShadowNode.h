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

class YogaLayoutableShadowNode : public LayoutableShadowNode {
 public:
  using UnsharedList = better::small_vector<
      YogaLayoutableShadowNode *,
      kShadowNodeChildrenSmallVectorSize>;

  static ShadowNodeTraits BaseTraits();

#pragma mark - Constructors

  YogaLayoutableShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits);

  YogaLayoutableShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment);

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  void appendChild(ShadowNode::Shared const &child);

  void updateYogaChildren();

  void updateYogaProps();

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
  void layoutTree(
      LayoutContext layoutContext,
      LayoutConstraints layoutConstraints) override;

  void layoutChildren(LayoutContext layoutContext) override;

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

 private:
  /*
   * Appends `child`'s Yoga node to the own Yoga node.
   * Complements `ShadowNode::appendChild(...)` functionality from Yoga
   * perspective.
   */
  void appendChildYogaNode(YogaLayoutableShadowNode const &child);

  YogaLayoutableShadowNode &cloneAndReplaceChild(
      YogaLayoutableShadowNode &child,
      int suggestedIndex);

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
      YGMeasureMode heightMode,
      void *layoutContext);
};

template <>
inline YogaLayoutableShadowNode const &
traitCast<YogaLayoutableShadowNode const &>(ShadowNode const &shadowNode) {
  bool castable =
      shadowNode.getTraits().check(ShadowNodeTraits::Trait::YogaLayoutableKind);
  assert(
      castable ==
      (dynamic_cast<YogaLayoutableShadowNode const *>(&shadowNode) != nullptr));
  assert(castable);
  (void)castable;
  return static_cast<YogaLayoutableShadowNode const &>(shadowNode);
}

template <>
inline YogaLayoutableShadowNode const *
traitCast<YogaLayoutableShadowNode const *>(ShadowNode const *shadowNode) {
  bool castable = shadowNode->getTraits().check(
      ShadowNodeTraits::Trait::YogaLayoutableKind);
  assert(
      castable ==
      (dynamic_cast<YogaLayoutableShadowNode const *>(shadowNode) != nullptr));
  if (!castable) {
    return nullptr;
  }
  return static_cast<YogaLayoutableShadowNode const *>(shadowNode);
}

} // namespace react
} // namespace facebook
