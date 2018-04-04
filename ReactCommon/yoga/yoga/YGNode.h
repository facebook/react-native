/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <stdio.h>
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
  YGNodeRef nextChild_;
  YGConfigRef config_;
  bool isDirty_;
  std::array<YGValue, 2> resolvedDimensions_;

  float relativePosition(const YGFlexDirection axis, const float axisSize);

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
      YGNodeRef nextChild,
      YGConfigRef config,
      bool isDirty,
      std::array<YGValue, 2> resolvedDimensions);

  // Getters
  void* getContext() const;
  YGPrintFunc getPrintFunc() const;
  bool getHasNewLayout() const;
  YGNodeType getNodeType() const;
  YGMeasureFunc getMeasure() const;
  YGBaselineFunc getBaseline() const;
  YGDirtiedFunc getDirtied() const;
  // For Performance reasons passing as reference.
  YGStyle& getStyle();
  // For Performance reasons passing as reference.
  YGLayout& getLayout();
  uint32_t getLineIndex() const;
  // returns the YGNodeRef that owns this YGNode. An owner is used to identify
  // the YogaTree that a YGNode belongs to.
  // This method will return the parent of the YGNode when a YGNode only belongs
  // to one YogaTree or nullptr when the YGNode is shared between two or more
  // YogaTrees.
  YGNodeRef getOwner() const;
  YGVector getChildren() const;
  uint32_t getChildrenCount() const;
  YGNodeRef getChild(uint32_t index) const;
  YGNodeRef getNextChild() const;
  YGConfigRef getConfig() const;
  bool isDirty() const;
  std::array<YGValue, 2> getResolvedDimensions() const;
  YGValue getResolvedDimension(int index);

  // Methods related to positions, margin, padding and border
  YGFloatOptional getLeadingPosition(const YGFlexDirection& axis,
      const float& axisSize) const;
  bool isLeadingPositionDefined(const YGFlexDirection axis) const;
  bool isTrailingPosDefined(const YGFlexDirection axis) const;
  float getTrailingPosition(const YGFlexDirection axis, const float axisSize) const;
  float getLeadingMargin(const YGFlexDirection axis, const float widthSize) const;
  float getTrailingMargin(const YGFlexDirection axis, const float widthSize) const;
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
  float getMarginForAxis(const YGFlexDirection axis, const float widthSize) const;
  // Setters

  void setContext(void* context);
  void setPrintFunc(YGPrintFunc printFunc);
  void setHasNewLayout(bool hasNewLayout);
  void setNodeType(YGNodeType nodeTye);
  void setMeasureFunc(YGMeasureFunc measureFunc);
  void setBaseLineFunc(YGBaselineFunc baseLineFunc);
  void setDirtiedFunc(YGDirtiedFunc dirtiedFunc);
  void setStyle(const YGStyle& style);
  void setStyleFlexDirection(YGFlexDirection direction);
  void setStyleAlignContent(YGAlign alignContent);
  void setLayout(const YGLayout& layout);
  void setLineIndex(uint32_t lineIndex);
  void setOwner(YGNodeRef owner);
  void setChildren(const YGVector& children);
  void setNextChild(YGNodeRef nextChild);
  void setConfig(YGConfigRef config);
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
