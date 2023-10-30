/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdio.h>
#include <cstdint>
#include <vector>

#include <yoga/Yoga.h>

#include <yoga/config/Config.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Errata.h>
#include <yoga/enums/MeasureMode.h>
#include <yoga/enums/NodeType.h>
#include <yoga/node/LayoutResults.h>
#include <yoga/style/CompactValue.h>
#include <yoga/style/Style.h>

// Tag struct used to form the opaque YGNodeRef for the public C API
struct YGNode {};

namespace facebook::yoga {

class YG_EXPORT Node : public ::YGNode {
 private:
  bool hasNewLayout_ : 1 = true;
  bool isReferenceBaseline_ : 1 = false;
  bool isDirty_ : 1 = false;
  NodeType nodeType_ : bitCount<NodeType>() = NodeType::Default;
  void* context_ = nullptr;
  YGMeasureFunc measureFunc_ = {nullptr};
  YGBaselineFunc baselineFunc_ = {nullptr};
  YGPrintFunc printFunc_ = {nullptr};
  YGDirtiedFunc dirtiedFunc_ = nullptr;
  Style style_ = {};
  LayoutResults layout_ = {};
  size_t lineIndex_ = 0;
  Node* owner_ = nullptr;
  std::vector<Node*> children_ = {};
  const Config* config_;
  std::array<YGValue, 2> resolvedDimensions_ = {
      {YGValueUndefined, YGValueUndefined}};

  float relativePosition(
      FlexDirection axis,
      Direction direction,
      const float axisSize) const;

  YGEdge getInlineStartEdgeUsingErrata(
      FlexDirection flexDirection,
      Direction direction) const;
  YGEdge getInlineEndEdgeUsingErrata(
      FlexDirection flexDirection,
      Direction direction) const;

  void useWebDefaults() {
    style_.flexDirection() = FlexDirection::Row;
    style_.alignContent() = Align::Stretch;
  }

  // DANGER DANGER DANGER!
  // If the node assigned to has children, we'd either have to deallocate
  // them (potentially incorrect) or ignore them (danger of leaks). Only ever
  // use this after checking that there are no children.
  // DO NOT CHANGE THE VISIBILITY OF THIS METHOD!
  Node& operator=(Node&&) = default;

 public:
  Node();
  explicit Node(const Config* config);
  ~Node() = default; // cleanup of owner/children relationships in YGNodeFree

  Node(Node&&);

  // Does not expose true value semantics, as children are not cloned eagerly.
  // Should we remove this?
  Node(const Node& node) = default;

  // assignment means potential leaks of existing children, or alternatively
  // freeing unowned memory, double free, or freeing stack memory.
  Node& operator=(const Node&) = delete;

  // Getters
  void* getContext() const {
    return context_;
  }

  void print();

  bool getHasNewLayout() const {
    return hasNewLayout_;
  }

  NodeType getNodeType() const {
    return nodeType_;
  }

  bool hasMeasureFunc() const noexcept {
    return measureFunc_ != nullptr;
  }

  YGSize measure(float, MeasureMode, float, MeasureMode);

  bool hasBaselineFunc() const noexcept {
    return baselineFunc_ != nullptr;
  }

  float baseline(float width, float height) const;

  bool hasErrata(Errata errata) const {
    return config_->hasErrata(errata);
  }

  YGDirtiedFunc getDirtiedFunc() const {
    return dirtiedFunc_;
  }

  // For Performance reasons passing as reference.
  Style& getStyle() {
    return style_;
  }

  const Style& getStyle() const {
    return style_;
  }

  // For Performance reasons passing as reference.
  LayoutResults& getLayout() {
    return layout_;
  }

  const LayoutResults& getLayout() const {
    return layout_;
  }

  size_t getLineIndex() const {
    return lineIndex_;
  }

  bool isReferenceBaseline() const {
    return isReferenceBaseline_;
  }

  // returns the Node that owns this Node. An owner is used to identify
  // the YogaTree that a Node belongs to. This method will return the parent
  // of the Node when a Node only belongs to one YogaTree or nullptr when
  // the Node is shared between two or more YogaTrees.
  Node* getOwner() const {
    return owner_;
  }

  // Deprecated, use getOwner() instead.
  Node* getParent() const {
    return getOwner();
  }

  const std::vector<Node*>& getChildren() const {
    return children_;
  }

  Node* getChild(size_t index) const {
    return children_.at(index);
  }

  size_t getChildCount() const {
    return children_.size();
  }

  const Config* getConfig() const {
    return config_;
  }

  bool isDirty() const {
    return isDirty_;
  }

  std::array<YGValue, 2> getResolvedDimensions() const {
    return resolvedDimensions_;
  }

  YGValue getResolvedDimension(Dimension dimension) const {
    return resolvedDimensions_[static_cast<size_t>(dimension)];
  }

  static CompactValue computeEdgeValueForColumn(
      const Style::Edges& edges,
      YGEdge edge);

  static CompactValue computeEdgeValueForRow(
      const Style::Edges& edges,
      YGEdge rowEdge,
      YGEdge edge);

  // Methods related to positions, margin, padding and border
  bool isInlineStartPositionDefined(FlexDirection axis, Direction direction)
      const;
  bool isInlineEndPositionDefined(FlexDirection axis, Direction direction)
      const;
  float getInlineStartPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const;
  float getInlineEndPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const;
  float getInlineStartMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getInlineEndMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getFlexStartBorder(FlexDirection flexDirection, Direction direction)
      const;
  float getInlineStartBorder(FlexDirection flexDirection, Direction direction)
      const;
  float getFlexEndBorder(FlexDirection flexDirection, Direction direction)
      const;
  float getInlineEndBorder(FlexDirection flexDirection, Direction direction)
      const;
  float getFlexStartPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getInlineStartPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getFlexEndPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getInlineEndPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getFlexStartPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getInlineStartPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getFlexEndPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getInlineEndPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize) const;
  float getMarginForAxis(FlexDirection axis, float widthSize) const;
  float getGapForAxis(FlexDirection axis) const;
  // Setters

  void setContext(void* context) {
    context_ = context;
  }

  void setPrintFunc(YGPrintFunc printFunc) {
    printFunc_ = printFunc;
  }

  void setHasNewLayout(bool hasNewLayout) {
    hasNewLayout_ = hasNewLayout;
  }

  void setNodeType(NodeType nodeType) {
    nodeType_ = nodeType;
  }

  void setMeasureFunc(YGMeasureFunc measureFunc);

  void setBaselineFunc(YGBaselineFunc baseLineFunc) {
    baselineFunc_ = baseLineFunc;
  }

  void setDirtiedFunc(YGDirtiedFunc dirtiedFunc) {
    dirtiedFunc_ = dirtiedFunc;
  }

  void setStyle(const Style& style) {
    style_ = style;
  }

  void setLayout(const LayoutResults& layout) {
    layout_ = layout;
  }

  void setLineIndex(size_t lineIndex) {
    lineIndex_ = lineIndex;
  }

  void setIsReferenceBaseline(bool isReferenceBaseline) {
    isReferenceBaseline_ = isReferenceBaseline;
  }

  void setOwner(Node* owner) {
    owner_ = owner;
  }

  void setChildren(const std::vector<Node*>& children) {
    children_ = children;
  }

  // TODO: rvalue override for setChildren

  void setConfig(Config* config);

  void setDirty(bool isDirty);
  void setLayoutLastOwnerDirection(Direction direction);
  void setLayoutComputedFlexBasis(const FloatOptional computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, Dimension dimension);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimensionValue, Dimension dimension);
  void setLayoutDirection(Direction direction);
  void setLayoutMargin(float margin, YGEdge edge);
  void setLayoutBorder(float border, YGEdge edge);
  void setLayoutPadding(float padding, YGEdge edge);
  void setLayoutPosition(float position, YGEdge edge);
  void setPosition(
      const Direction direction,
      const float mainSize,
      const float crossSize,
      const float ownerWidth);
  void markDirtyAndPropagateDownwards();

  // Other methods
  YGValue getFlexStartMarginValue(FlexDirection axis) const;
  YGValue marginTrailingValue(FlexDirection axis) const;
  YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  Direction resolveDirection(const Direction ownerDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(Node* oldChild, Node* newChild);
  void replaceChild(Node* child, size_t index);
  void insertChild(Node* child, size_t index);
  /// Removes the first occurrence of child
  bool removeChild(Node* child);
  void removeChild(size_t index);

  void cloneChildrenIfNeeded();
  void markDirtyAndPropagate();
  float resolveFlexGrow() const;
  float resolveFlexShrink() const;
  bool isNodeFlexible();
  void reset();
};

inline Node* resolveRef(const YGNodeRef ref) {
  return static_cast<Node*>(ref);
}

inline const Node* resolveRef(const YGNodeConstRef ref) {
  return static_cast<const Node*>(ref);
}

} // namespace facebook::yoga
