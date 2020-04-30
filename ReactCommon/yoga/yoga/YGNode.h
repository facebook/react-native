/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <cstdint>
#include <stdio.h>
#include "BitUtils.h"
#include "CompactValue.h"
#include "YGConfig.h"
#include "YGLayout.h"
#include "YGStyle.h"
#include "YGMacros.h"
#include "Yoga-internal.h"

YGConfigRef YGConfigGetDefault();

struct YOGA_EXPORT YGNode {
  using MeasureWithContextFn =
      YGSize (*)(YGNode*, float, YGMeasureMode, float, YGMeasureMode, void*);
  using BaselineWithContextFn = float (*)(YGNode*, float, float, void*);
  using PrintWithContextFn = void (*)(YGNode*, void*);

private:
  static constexpr size_t hasNewLayout_ = 0;
  static constexpr size_t isReferenceBaseline_ = 1;
  static constexpr size_t isDirty_ = 2;
  static constexpr size_t nodeType_ = 3;
  static constexpr size_t measureUsesContext_ = 4;
  static constexpr size_t baselineUsesContext_ = 5;
  static constexpr size_t printUsesContext_ = 6;
  static constexpr size_t useWebDefaults_ = 7;

  void* context_ = nullptr;
  uint8_t flags = 1;
  uint8_t reserved_ = 0;
  union {
    YGMeasureFunc noContext;
    MeasureWithContextFn withContext;
  } measure_ = {nullptr};
  union {
    YGBaselineFunc noContext;
    BaselineWithContextFn withContext;
  } baseline_ = {nullptr};
  union {
    YGPrintFunc noContext;
    PrintWithContextFn withContext;
  } print_ = {nullptr};
  YGDirtiedFunc dirtied_ = nullptr;
  YGStyle style_ = {};
  YGLayout layout_ = {};
  uint32_t lineIndex_ = 0;
  YGNodeRef owner_ = nullptr;
  YGVector children_ = {};
  YGConfigRef config_;
  std::array<YGValue, 2> resolvedDimensions_ = {
      {YGValueUndefined, YGValueUndefined}};

  YGFloatOptional relativePosition(
      const YGFlexDirection axis,
      const float axisSize) const;

  void setMeasureFunc(decltype(measure_));
  void setBaselineFunc(decltype(baseline_));

  void useWebDefaults() {
    facebook::yoga::detail::setBooleanData(flags, useWebDefaults_, true);
    style_.flexDirection() = YGFlexDirectionRow;
    style_.alignContent() = YGAlignStretch;
  }

  // DANGER DANGER DANGER!
  // If the the node assigned to has children, we'd either have to deallocate
  // them (potentially incorrect) or ignore them (danger of leaks). Only ever
  // use this after checking that there are no children.
  // DO NOT CHANGE THE VISIBILITY OF THIS METHOD!
  YGNode& operator=(YGNode&&) = default;

  using CompactValue = facebook::yoga::detail::CompactValue;

public:
  YGNode() : YGNode{YGConfigGetDefault()} {}
  explicit YGNode(const YGConfigRef config) : config_{config} {
    if (config->useWebDefaults) {
      useWebDefaults();
    }
  };
  ~YGNode() = default; // cleanup of owner/children relationships in YGNodeFree

  YGNode(YGNode&&);

  // Does not expose true value semantics, as children are not cloned eagerly.
  // Should we remove this?
  YGNode(const YGNode& node) = default;

  // for RB fabric
  YGNode(const YGNode& node, YGConfigRef config);

  // assignment means potential leaks of existing children, or alternatively
  // freeing unowned memory, double free, or freeing stack memory.
  YGNode& operator=(const YGNode&) = delete;

  // Getters
  void* getContext() const { return context_; }

  uint8_t& reserved() { return reserved_; }
  uint8_t reserved() const { return reserved_; }

  void print(void*);

  bool getHasNewLayout() const {
    return facebook::yoga::detail::getBooleanData(flags, hasNewLayout_);
  }

  YGNodeType getNodeType() const {
    return facebook::yoga::detail::getEnumData<YGNodeType>(flags, nodeType_);
  }

  bool hasMeasureFunc() const noexcept { return measure_.noContext != nullptr; }

  YGSize measure(float, YGMeasureMode, float, YGMeasureMode, void*);

  bool hasBaselineFunc() const noexcept {
    return baseline_.noContext != nullptr;
  }

  float baseline(float width, float height, void* layoutContext);

  YGDirtiedFunc getDirtied() const { return dirtied_; }

  // For Performance reasons passing as reference.
  YGStyle& getStyle() { return style_; }

  const YGStyle& getStyle() const { return style_; }

  // For Performance reasons passing as reference.
  YGLayout& getLayout() { return layout_; }

  const YGLayout& getLayout() const { return layout_; }

  uint32_t getLineIndex() const { return lineIndex_; }

  bool isReferenceBaseline() {
    return facebook::yoga::detail::getBooleanData(flags, isReferenceBaseline_);
  }

  // returns the YGNodeRef that owns this YGNode. An owner is used to identify
  // the YogaTree that a YGNode belongs to. This method will return the parent
  // of the YGNode when a YGNode only belongs to one YogaTree or nullptr when
  // the YGNode is shared between two or more YogaTrees.
  YGNodeRef getOwner() const { return owner_; }

  // Deprecated, use getOwner() instead.
  YGNodeRef getParent() const { return getOwner(); }

  const YGVector& getChildren() const { return children_; }

  // Applies a callback to all children, after cloning them if they are not
  // owned.
  template <typename T>
  void iterChildrenAfterCloningIfNeeded(T callback, void* cloneContext) {
    int i = 0;
    for (YGNodeRef& child : children_) {
      if (child->getOwner() != this) {
        child = config_->cloneNode(child, this, i, cloneContext);
        child->setOwner(this);
      }
      i += 1;

      callback(child, cloneContext);
    }
  }

  YGNodeRef getChild(uint32_t index) const { return children_.at(index); }

  YGConfigRef getConfig() const { return config_; }

  bool isDirty() const {
    return facebook::yoga::detail::getBooleanData(flags, isDirty_);
  }

  std::array<YGValue, 2> getResolvedDimensions() const {
    return resolvedDimensions_;
  }

  YGValue getResolvedDimension(int index) const {
    return resolvedDimensions_[index];
  }

  // Methods related to positions, margin, padding and border
  YGFloatOptional getLeadingPosition(
      const YGFlexDirection axis,
      const float axisSize) const;
  bool isLeadingPositionDefined(const YGFlexDirection axis) const;
  bool isTrailingPosDefined(const YGFlexDirection axis) const;
  YGFloatOptional getTrailingPosition(
      const YGFlexDirection axis,
      const float axisSize) const;
  YGFloatOptional getLeadingMargin(
      const YGFlexDirection axis,
      const float widthSize) const;
  YGFloatOptional getTrailingMargin(
      const YGFlexDirection axis,
      const float widthSize) const;
  float getLeadingBorder(const YGFlexDirection flexDirection) const;
  float getTrailingBorder(const YGFlexDirection flexDirection) const;
  YGFloatOptional getLeadingPadding(
      const YGFlexDirection axis,
      const float widthSize) const;
  YGFloatOptional getTrailingPadding(
      const YGFlexDirection axis,
      const float widthSize) const;
  YGFloatOptional getLeadingPaddingAndBorder(
      const YGFlexDirection axis,
      const float widthSize) const;
  YGFloatOptional getTrailingPaddingAndBorder(
      const YGFlexDirection axis,
      const float widthSize) const;
  YGFloatOptional getMarginForAxis(
      const YGFlexDirection axis,
      const float widthSize) const;
  // Setters

  void setContext(void* context) { context_ = context; }

  void setPrintFunc(YGPrintFunc printFunc) {
    print_.noContext = printFunc;
    facebook::yoga::detail::setBooleanData(flags, printUsesContext_, false);
  }
  void setPrintFunc(PrintWithContextFn printFunc) {
    print_.withContext = printFunc;
    facebook::yoga::detail::setBooleanData(flags, printUsesContext_, true);
  }
  void setPrintFunc(std::nullptr_t) { setPrintFunc(YGPrintFunc{nullptr}); }

  void setHasNewLayout(bool hasNewLayout) {
    facebook::yoga::detail::setBooleanData(flags, hasNewLayout_, hasNewLayout);
  }

  void setNodeType(YGNodeType nodeType) {
    return facebook::yoga::detail::setEnumData<YGNodeType>(
        flags, nodeType_, nodeType);
  }

  void setMeasureFunc(YGMeasureFunc measureFunc);
  void setMeasureFunc(MeasureWithContextFn);
  void setMeasureFunc(std::nullptr_t) {
    return setMeasureFunc(YGMeasureFunc{nullptr});
  }

  void setBaselineFunc(YGBaselineFunc baseLineFunc) {
    facebook::yoga::detail::setBooleanData(flags, baselineUsesContext_, false);
    baseline_.noContext = baseLineFunc;
  }
  void setBaselineFunc(BaselineWithContextFn baseLineFunc) {
    facebook::yoga::detail::setBooleanData(flags, baselineUsesContext_, true);
    baseline_.withContext = baseLineFunc;
  }
  void setBaselineFunc(std::nullptr_t) {
    return setBaselineFunc(YGBaselineFunc{nullptr});
  }

  void setDirtiedFunc(YGDirtiedFunc dirtiedFunc) { dirtied_ = dirtiedFunc; }

  void setStyle(const YGStyle& style) { style_ = style; }

  void setLayout(const YGLayout& layout) { layout_ = layout; }

  void setLineIndex(uint32_t lineIndex) { lineIndex_ = lineIndex; }

  void setIsReferenceBaseline(bool isReferenceBaseline) {
    facebook::yoga::detail::setBooleanData(
        flags, isReferenceBaseline_, isReferenceBaseline);
  }

  void setOwner(YGNodeRef owner) { owner_ = owner; }

  void setChildren(const YGVector& children) { children_ = children; }

  // TODO: rvalue override for setChildren

  YG_DEPRECATED void setConfig(YGConfigRef config) { config_ = config; }

  void setDirty(bool isDirty);
  void setLayoutLastOwnerDirection(YGDirection direction);
  void setLayoutComputedFlexBasis(const YGFloatOptional computedFlexBasis);
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

  void cloneChildrenIfNeeded(void*);
  void markDirtyAndPropogate();
  float resolveFlexGrow() const;
  float resolveFlexShrink() const;
  bool isNodeFlexible();
  bool didUseLegacyFlag();
  bool isLayoutTreeEqualToNode(const YGNode& node) const;
  void reset();
};
