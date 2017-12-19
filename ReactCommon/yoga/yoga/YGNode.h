/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <stdio.h>

#include "Yoga-internal.h"

struct YGNode {
 private:
  void* context_;
  YGPrintFunc print_;
  bool hasNewLayout_;
  YGNodeType nodeType_;
  YGMeasureFunc measure_;
  YGBaselineFunc baseline_;
  YGStyle style_;
  YGLayout layout_;
  uint32_t lineIndex_;
  YGNodeRef parent_;
  YGVector children_;
  YGNodeRef nextChild_;
  YGConfigRef config_;
  bool isDirty_;
  std::array<YGValue, 2> resolvedDimensions_;

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
      YGStyle style,
      YGLayout layout,
      uint32_t lineIndex,
      YGNodeRef parent,
      YGVector children,
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
  YGStyle getStyle() const;
  YGLayout getLayout() const;
  YGLayout& getLayoutRef(); // TODO remove its use
  uint32_t getLineIndex() const;
  YGNodeRef getParent() const;
  YGVector getChildren() const;
  YGNodeRef getChild(uint32_t index) const;
  YGNodeRef getNextChild() const;
  YGConfigRef getConfig() const;
  bool isDirty() const;
  std::array<YGValue, 2> getResolvedDimensions() const;
  YGValue getResolvedDimension(int index);

  // Setters

  void setContext(void* context);
  void setPrintFunc(YGPrintFunc printFunc);
  void setHasNewLayout(bool hasNewLayout);
  void setNodeType(YGNodeType nodeTye);
  void setMeasureFunc(YGMeasureFunc measureFunc);
  void setBaseLineFunc(YGBaselineFunc baseLineFunc);
  void setStyle(YGStyle style);
  void setStyleFlexDirection(YGFlexDirection direction);
  void setStyleAlignContent(YGAlign alignContent);
  void setLayout(YGLayout layout);
  void setLineIndex(uint32_t lineIndex);
  void setParent(YGNodeRef parent);
  void setChildren(YGVector children);
  void setNextChild(YGNodeRef nextChild);
  void setConfig(YGConfigRef config);
  void setDirty(bool isDirty);
  void setLayoutLastParentDirection(YGDirection direction);
  void setLayoutComputedFlexBasis(float computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, int index);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float dimension, int index);

  // Other methods
  YGValue marginLeadingValue(const YGFlexDirection axis) const;
  YGValue marginTrailingValue(const YGFlexDirection axis) const;
  YGValue resolveFlexBasisPtr() const;
  void resolveDimension();
  void clearChildren();
  void replaceChild(YGNodeRef child, uint32_t index);
  void insertChild(YGNodeRef child, uint32_t index);
  /// Removes the first occurrence of child
  bool removeChild(YGNodeRef child);
  void removeChild(uint32_t index);
  void setLayoutDirection(YGDirection direction);
  void setLayoutMargin(float margin, int index);
  void setLayoutBorder(float border, int index);
  void setLayoutPadding(float padding, int index);
  void setLayoutPosition(float position, int index);

  // Static methods
  static const YGNode& defaultValue();
};
