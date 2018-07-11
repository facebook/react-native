/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <stdio.h>
#include "YGConfig.h"
#include "YGLayout.h"
#include "YGStyle.h"
#include "Yoga-internal.h"

struct YGNode {
 private:
  void* context_;
  YGPrintFunc print_;
  bool hasNewLayout_;
  YGNodeType nodeType_;
  YGMeasureFunc measure_;
  YGBaselineFunc baseline_;
  YGDirtiedFunc dirtied_;
  YGStyle style_;
  YGLayout layout_;
  uint32_t lineIndex_;
  YGNodeRef owner_;
  YGVector children_;
  YGConfigRef config_;
  bool isDirty_;
  std::array<YGValue, 2> resolvedDimensions_;

  YGFloatOptional relativePosition(
      const YGFlexDirection& axis,
      const float& axisSize) const;

 public:
  YGNode();
  ~YGNode();
  explicit YGNode(const YGConfigRef newConfig);
  YGNode(const YGNode& node);
  YGNode& operator=(const YGNode& node);
  YGNode(
      void* context,
      YGPrintFunc print,
      bool hasNewLayout,
      YGNodeType nodeType,
      YGMeasureFunc measure,
      YGBaselineFunc baseline,
      YGDirtiedFunc dirtied,
      YGStyle style,
      const YGLayout& layout,
      uint32_t lineIndex,
      YGNodeRef owner,
      const YGVector& children,
      YGConfigRef config,
      bool isDirty,
      std::array<YGValue, 2> resolvedDimensions);

  // Getters
  void* getContext() const {
    return context_;
  }

  YGPrintFunc getPrintFunc() const {
    return print_;
  }

  bool getHasNewLayout() const {
    return hasNewLayout_;
  }
  
  YGNodeType getNodeType() const {
    return nodeType_;
  }
  
  YGMeasureFunc getMeasure() const {
    return measure_;
  }
  
  YGBaselineFunc getBaseline() const {
    return baseline_;
  }
  
  YGDirtiedFunc getDirtied() const {
    return dirtied_;
  }
  
  // For Performance reasons passing as reference.
  YGStyle& getStyle() {
    return style_;
  }

  const YGStyle& getStyle() const {
    return style_;
  }

  // For Performance reasons passing as reference.
  YGLayout& getLayout() {
    return layout_;
  }

  const YGLayout& getLayout() const {
    return layout_;
  }
  
  uint32_t getLineIndex() const {
    return lineIndex_;
  }
  
  // returns the YGNodeRef that owns this YGNode. An owner is used to identify
  // the YogaTree that a YGNode belongs to.
  // This method will return the parent of the YGNode when a YGNode only belongs
  // to one YogaTree or nullptr when the YGNode is shared between two or more
  // YogaTrees.
  YGNodeRef getOwner() const {
    return owner_;
  }
  
  // Deprecated, use getOwner() instead.
  YGNodeRef getParent() const {
    return getOwner();
  }
  
  YGVector getChildren() const {
    return children_;
  }
  
  uint32_t getChildrenCount() const {
    return static_cast<uint32_t>(children_.size());
  }
  
  YGNodeRef getChild(uint32_t index) const {
    return children_.at(index);
  }

  YGConfigRef getConfig() const {
    return config_;
  }
  
  bool isDirty() const {
    return isDirty_;
  }
  
  std::array<YGValue, 2> getResolvedDimensions() const {
    return resolvedDimensions_;
  }
  
  YGValue getResolvedDimension(int index) const {
    return resolvedDimensions_[index];
  }

  // Methods related to positions, margin, padding and border
  YGFloatOptional getLeadingPosition(const YGFlexDirection& axis,
      const float& axisSize) const;
  bool isLeadingPositionDefined(const YGFlexDirection& axis) const;
  bool isTrailingPosDefined(const YGFlexDirection& axis) const;
  YGFloatOptional getTrailingPosition(
      const YGFlexDirection& axis,
      const float& axisSize) const;
  YGFloatOptional getLeadingMargin(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  YGFloatOptional getTrailingMargin(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  float getLeadingBorder(const YGFlexDirection& flexDirection) const;
  float getTrailingBorder(const YGFlexDirection& flexDirection) const;
  YGFloatOptional getLeadingPadding(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  YGFloatOptional getTrailingPadding(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  YGFloatOptional getLeadingPaddingAndBorder(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  YGFloatOptional getTrailingPaddingAndBorder(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  YGFloatOptional getMarginForAxis(
      const YGFlexDirection& axis,
      const float& widthSize) const;
  // Setters

  void setContext(void* context) {
    context_ = context;
  }

  void setPrintFunc(YGPrintFunc printFunc) {
    print_ = printFunc;
  }

  void setHasNewLayout(bool hasNewLayout) {
    hasNewLayout_ = hasNewLayout;
  }
  
  void setNodeType(YGNodeType nodeType) {
    nodeType_ = nodeType;
  }

  void setStyleFlexDirection(YGFlexDirection direction) {
    style_.flexDirection = direction;
  }

  void setStyleAlignContent(YGAlign alignContent) {
    style_.alignContent = alignContent;
  }

  void setMeasureFunc(YGMeasureFunc measureFunc);

  void setBaseLineFunc(YGBaselineFunc baseLineFunc) {
    baseline_ = baseLineFunc;
  }

  void setDirtiedFunc(YGDirtiedFunc dirtiedFunc) {
    dirtied_ = dirtiedFunc;
  }

  void setStyle(const YGStyle& style) {
    style_ = style;
  }
  
  void setLayout(const YGLayout& layout) {
    layout_ = layout;
  }
  
  void setLineIndex(uint32_t lineIndex) {
    lineIndex_ = lineIndex;
  }
  
  void setOwner(YGNodeRef owner) {
    owner_ = owner;
  }

  void setChildren(const YGVector& children) {
    children_ = children;
  }

  // TODO: rvalue override for setChildren
  
  void setConfig(YGConfigRef config) {
    config_ = config;
  }

  void setDirty(bool isDirty);
  void setLayoutLastOwnerDirection(YGDirection direction);
  void setLayoutComputedFlexBasis(const YGFloatOptional& computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, int index);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimension, int index);
  void setLayoutDirection(YGDirection direction);
  void setLayoutMargin(float margin, int index);
  void setLayoutBorder(float border, int index);
  void setLayoutPadding(float padding, int index);
  void setLayoutPosition(float position, int index);
  void setPosition(
      const YGDirection direction,
      const float mainSize,
      const float crossSize,
      const float ownerWidth);
  void setAndPropogateUseLegacyFlag(bool useLegacyFlag);
  void setLayoutDoesLegacyFlagAffectsLayout(bool doesLegacyFlagAffectsLayout);
  void setLayoutDidUseLegacyFlag(bool didUseLegacyFlag);
  void markDirtyAndPropogateDownwards();

  // Other methods
  YGValue marginLeadingValue(const YGFlexDirection axis) const;
  YGValue marginTrailingValue(const YGFlexDirection axis) const;
  YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  YGDirection resolveDirection(const YGDirection ownerDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(YGNodeRef oldChild, YGNodeRef newChild);
  void replaceChild(YGNodeRef child, uint32_t index);
  void insertChild(YGNodeRef child, uint32_t index);
  /// Removes the first occurrence of child
  bool removeChild(YGNodeRef child);
  void removeChild(uint32_t index);

  void cloneChildrenIfNeeded();
  void markDirtyAndPropogate();
  float resolveFlexGrow();
  float resolveFlexShrink();
  bool isNodeFlexible();
  bool didUseLegacyFlag();
  bool isLayoutTreeEqualToNode(const YGNode& node) const;
};
