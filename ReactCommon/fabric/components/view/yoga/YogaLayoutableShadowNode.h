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
   * Return true if child's yogaNode's owner is this->yogaNode_. Otherwise
   * returns false.
   */
  bool doesOwn(YogaLayoutableShadowNode const &child) const;

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
      YGMeasureMode heightMode);

  /*
   * Walks though shadow node hierarchy and reassign following values:
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   * This is neccesarry to be backwards compatible with Paper, it swaps the
   * values as well in https://fburl.com/diffusion/kl7bjr3h
   */
  static void swapLeftAndRightInTree(
      YogaLayoutableShadowNode const &shadowNode);
  /*
   * In shadow node passed as argument, reassigns following values
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   */
  static void swapLeftAndRightInViewProps(
      YogaLayoutableShadowNode const &shadowNode);
  /*
   * In yoga node passed as argument, reassigns following values
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   */
  static void swapLeftAndRightInYogaStyleProps(
      YogaLayoutableShadowNode const &shadowNode);
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
  if (!shadowNode) {
    return nullptr;
  }
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
