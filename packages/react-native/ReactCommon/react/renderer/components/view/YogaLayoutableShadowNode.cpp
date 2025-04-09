/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaLayoutableShadowNode.h"
#include <cxxreact/TraceSection.h>
#include <logger/react_native_log.h>
#include <react/debug/flags.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/LayoutConformanceShadowNode.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>
#include <yoga/Yoga.h>
#include <algorithm>
#include <limits>
#include <memory>

namespace facebook::react {

static int FabricDefaultYogaLog(
    const YGConfigConstRef /*unused*/,
    const YGNodeConstRef /*unused*/,
    YGLogLevel level,
    const char* format,
    va_list args) {
  va_list args_copy;
  va_copy(args_copy, args);

  // Adding 1 to add space for terminating null character.
  int size_s = vsnprintf(nullptr, 0, format, args);
  auto size = static_cast<size_t>(size_s);
  std::vector<char> buffer(size);

  vsnprintf(buffer.data(), size, format, args_copy);
  switch (level) {
    case YGLogLevelError:
      react_native_log_error(buffer.data());
      break;
    case YGLogLevelFatal:
      react_native_log_fatal(buffer.data());
      break;
    case YGLogLevelWarn:
      react_native_log_warn(buffer.data());
      break;
    case YGLogLevelInfo:
    case YGLogLevelDebug:
    case YGLogLevelVerbose:
    default:
      react_native_log_info(buffer.data());
  }

  return size_s;
}

thread_local LayoutContext threadLocalLayoutContext;

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    const ShadowNodeFragment& fragment,
    const ShadowNodeFamily::Shared& family,
    ShadowNodeTraits traits)
    : LayoutableShadowNode(fragment, family, traits),
      yogaConfig_(FabricDefaultYogaLog),
      yogaNode_(&initializeYogaConfig(yogaConfig_)) {
  YGNodeSetContext(&yogaNode_, this);

  if (getTraits().check(ShadowNodeTraits::Trait::MeasurableYogaNode)) {
    react_native_assert(
        getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

    YGNodeSetMeasureFunc(&yogaNode_, yogaNodeMeasureCallbackConnector);
  }

  if (getTraits().check(ShadowNodeTraits::Trait::BaselineYogaNode)) {
    YGNodeSetBaselineFunc(
        &yogaNode_,
        YogaLayoutableShadowNode::yogaNodeBaselineCallbackConnector);
  }

  updateYogaProps();
  updateYogaChildren();

  ensureConsistency();
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : LayoutableShadowNode(sourceShadowNode, fragment),
      yogaConfig_(FabricDefaultYogaLog),
      yogaNode_(static_cast<const YogaLayoutableShadowNode&>(sourceShadowNode)
                    .yogaNode_) {
// Note, cloned `yoga::Node` instance (copied using copy-constructor) inherits
// dirty flag, measure function, and other properties being set originally in
// the `YogaLayoutableShadowNode` constructor above.

// There is a known race condition when background executor is enabled, where
// a tree may be laid out on the Fabric background thread concurrently with
// the ShadowTree being created on the JS thread. This assert can be
// re-enabled after disabling background executor everywhere.
#if 0
  react_native_assert(YGNodeIsDirty(&static_cast<const YogaLayoutableShadowNode&>(sourceShadowNode)
              .yogaNode_) == YGNodeIsDirty(&yogaNode_) &&
      "Yoga node must inherit dirty flag.");
#endif
  if (!getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    for (auto& child : getChildren()) {
      if (auto layoutableChild =
              std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(
                  child)) {
        yogaLayoutableChildren_.push_back(std::move(layoutableChild));
      }
    }
  }

  YGConfigConstRef previousConfig =
      &static_cast<const YogaLayoutableShadowNode&>(sourceShadowNode)
           .yogaConfig_;

  YGNodeSetContext(&yogaNode_, this);
  yogaNode_.setOwner(nullptr);
  YGNodeSetConfig(
      &yogaNode_, &initializeYogaConfig(yogaConfig_, previousConfig));
  updateYogaChildrenOwnersIfNeeded();

  // This is the only legit place where we can dirty cloned Yoga node.
  // If we do it later, ancestor nodes will not be able to observe this and
  // dirty (and clone) themselves as a result.
  if (getTraits().check(ShadowNodeTraits::Trait::DirtyYogaNode) ||
      getTraits().check(ShadowNodeTraits::Trait::MeasurableYogaNode)) {
    yogaNode_.setDirty(true);
  }

  // We do not need to reconfigure this subtree before the next layout pass if
  // the previous node with the same props and children has already been
  // configured.
  if (!fragment.props && !fragment.children) {
    yogaTreeHasBeenConfigured_ =
        static_cast<const YogaLayoutableShadowNode&>(sourceShadowNode)
            .yogaTreeHasBeenConfigured_;
  }

  if (fragment.props) {
    updateYogaProps();
  }

  if (fragment.children) {
    updateYogaChildren();
  }

  ensureConsistency();
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_.setDirty(true);
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !YGNodeIsDirty(&yogaNode_);
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  YGNodeSetMeasureFunc(
      &yogaNode_, YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendYogaChild(
    const YogaLayoutableShadowNode::Shared& childNode) {
  // The caller must check this before calling this method.
  react_native_assert(
      !getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

  ensureYogaChildrenLookFine();

  yogaLayoutableChildren_.push_back(childNode);
  yogaNode_.insertChild(&childNode->yogaNode_, YGNodeGetChildCount(&yogaNode_));

  ensureYogaChildrenLookFine();
}

void YogaLayoutableShadowNode::adoptYogaChild(size_t index) {
  ensureUnsealed();
  ensureYogaChildrenLookFine();

  // The caller must check this before calling this method.
  react_native_assert(
      !getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

  auto& childNode =
      dynamic_cast<const YogaLayoutableShadowNode&>(*getChildren().at(index));

  if (YGNodeGetOwner(&childNode.yogaNode_) == nullptr) {
    // The child node is not owned.
    childNode.yogaNode_.setOwner(&yogaNode_);
    // At this point the child yoga node must be already inserted by the caller.
    // react_native_assert(layoutableChildNode.yogaNode_.isDirty());
  } else {
    // The child is owned by some other node, we need to clone that.
    // TODO: At this point, React has wrong reference to the node. (T138668036)
    auto clonedChildNode = childNode.clone({});

    // Replace the child node with a newly cloned one in the children list.
    replaceChild(childNode, clonedChildNode, index);
  }

  ensureYogaChildrenLookFine();
}

void YogaLayoutableShadowNode::appendChild(
    const ShadowNode::Shared& childNode) {
  ensureUnsealed();
  ensureConsistency();

  // Calling the base class (`ShadowNode`) method.
  LayoutableShadowNode::appendChild(childNode);

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    // This node is a declared leaf.
    return;
  }

  if (auto yogaLayoutableChild =
          std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(
              childNode)) {
    // Here we don't have information about the previous structure of the node
    // (if it that existed before), so we don't have anything to compare the
    // Yoga node with (like a previous version of this node). Therefore we must
    // dirty the node.
    yogaNode_.setDirty(true);

    // Appending the Yoga node.
    appendYogaChild(yogaLayoutableChild);

    ensureYogaChildrenLookFine();
    ensureYogaChildrenAlignment();

    // Adopting the Yoga node.
    adoptYogaChild(getChildren().size() - 1);

    ensureConsistency();
  }
}

void YogaLayoutableShadowNode::replaceChild(
    const ShadowNode& oldChild,
    const ShadowNode::Shared& newChild,
    size_t suggestedIndex) {
  LayoutableShadowNode::replaceChild(oldChild, newChild, suggestedIndex);

  ensureUnsealed();
  ensureYogaChildrenLookFine();

  auto layoutableOldChild =
      dynamic_cast<const YogaLayoutableShadowNode*>(&oldChild);
  auto layoutableNewChild =
      std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(newChild);

  if (layoutableOldChild == nullptr && layoutableNewChild == nullptr) {
    // No need to mutate yogaLayoutableChildren_
    return;
  }

  bool suggestedIndexAccurate = suggestedIndex >= 0 &&
      suggestedIndex < yogaLayoutableChildren_.size() &&
      yogaLayoutableChildren_[suggestedIndex].get() == layoutableOldChild;

  auto oldChildIter = suggestedIndexAccurate
      ? yogaLayoutableChildren_.begin() + suggestedIndex
      : std::find_if(
            yogaLayoutableChildren_.begin(),
            yogaLayoutableChildren_.end(),
            [&](const YogaLayoutableShadowNode::Shared& layoutableChild) {
              return layoutableChild.get() == layoutableOldChild;
            });
  auto oldChildIndex = oldChildIter - yogaLayoutableChildren_.begin();

  if (oldChildIter == yogaLayoutableChildren_.end()) {
    // oldChild does not exist as part of our node
    return;
  }

  if (layoutableNewChild) {
    // Both children are layoutable, replace the old one with the new one
    react_native_assert(
        YGNodeGetOwner(&layoutableNewChild->yogaNode_) == nullptr);
    layoutableNewChild->yogaNode_.setOwner(&yogaNode_);
    yogaNode_.replaceChild(&layoutableNewChild->yogaNode_, oldChildIndex);
    *oldChildIter = layoutableNewChild;
  } else {
    // Layoutable child replaced with non layoutable child. Remove the previous
    // child from the layoutable children list.
    yogaNode_.removeChild(oldChildIndex);
    yogaLayoutableChildren_.erase(oldChildIter);
  }

  ensureYogaChildrenLookFine();
}

bool YogaLayoutableShadowNode::doesOwn(
    const YogaLayoutableShadowNode& child) const {
  return YGNodeGetOwner(&child.yogaNode_) == &yogaNode_;
}

void YogaLayoutableShadowNode::updateYogaChildrenOwnersIfNeeded() {
  for (auto& childYogaNode : yogaNode_.getChildren()) {
    if (YGNodeGetOwner(childYogaNode) == &yogaNode_) {
      childYogaNode->setOwner(
          reinterpret_cast<yoga::Node*>(0xBADC0FFEE0DDF00D));
    }
  }
}

void YogaLayoutableShadowNode::updateYogaChildren() {
  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    return;
  }

  ensureUnsealed();

  bool isClean = !YGNodeIsDirty(&yogaNode_) &&
      getChildren().size() == YGNodeGetChildCount(&yogaNode_);

  auto oldYogaChildren =
      isClean ? yogaNode_.getChildren() : std::vector<yoga::Node*>{};

  yogaNode_.setChildren({});
  yogaLayoutableChildren_.clear();

  for (size_t i = 0; i < getChildren().size(); i++) {
    if (auto yogaLayoutableChild =
            std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(
                getChildren()[i])) {
      appendYogaChild(yogaLayoutableChild);
      adoptYogaChild(i);

      if (isClean) {
        auto yogaChildIndex = yogaLayoutableChildren_.size() - 1;
        auto& oldYogaChildNode = *oldYogaChildren.at(yogaChildIndex);
        auto& newYogaChildNode =
            yogaLayoutableChildren_.at(yogaChildIndex)->yogaNode_;

        isClean = isClean && !newYogaChildNode.isDirty() &&
            (newYogaChildNode.style() == oldYogaChildNode.style());
      }
    }
  }

  react_native_assert(
      yogaLayoutableChildren_.size() == YGNodeGetChildCount(&yogaNode_));

  yogaNode_.setDirty(!isClean);
}

void YogaLayoutableShadowNode::updateYogaProps() {
  ensureUnsealed();

  auto& props = static_cast<const YogaStylableProps&>(*props_);
  auto styleResult = applyAliasedProps(props.yogaStyle, props);

  // Resetting `dirty` flag only if `yogaStyle` portion of `Props` was changed.
  if (!YGNodeIsDirty(&yogaNode_) && (styleResult != yogaNode_.style())) {
    yogaNode_.setDirty(true);
  }

  yogaNode_.setStyle(styleResult);
  if (getTraits().check(ShadowNodeTraits::ViewKind)) {
    auto& viewProps = static_cast<const ViewProps&>(*props_);
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    bool alwaysFormsContainingBlock =
        viewProps.transform != Transform::Identity() ||
        !viewProps.filter.empty();
    YGNodeSetAlwaysFormsContainingBlock(&yogaNode_, alwaysFormsContainingBlock);
  }

  if (YGNodeStyleGetDisplay(&yogaNode_) == YGDisplayContents) {
    ShadowNode::traits_.set(ShadowNodeTraits::ForceFlattenView);
  } else {
    ShadowNode::traits_.unset(ShadowNodeTraits::ForceFlattenView);
  }
}

/*static*/ yoga::Style YogaLayoutableShadowNode::applyAliasedProps(
    const yoga::Style& baseStyle,
    const YogaStylableProps& props) {
  yoga::Style result{baseStyle};

  // Aliases with precedence
  if (props.insetInlineEnd.isDefined()) {
    result.setPosition(yoga::Edge::End, props.insetInlineEnd);
  }
  if (props.insetInlineStart.isDefined()) {
    result.setPosition(yoga::Edge::Start, props.insetInlineStart);
  }
  if (props.marginInline.isDefined()) {
    result.setMargin(yoga::Edge::Horizontal, props.marginInline);
  }
  if (props.marginInlineStart.isDefined()) {
    result.setMargin(yoga::Edge::Start, props.marginInlineStart);
  }
  if (props.marginInlineEnd.isDefined()) {
    result.setMargin(yoga::Edge::End, props.marginInlineEnd);
  }
  if (props.marginBlock.isDefined()) {
    result.setMargin(yoga::Edge::Vertical, props.marginBlock);
  }
  if (props.paddingInline.isDefined()) {
    result.setPadding(yoga::Edge::Horizontal, props.paddingInline);
  }
  if (props.paddingInlineStart.isDefined()) {
    result.setPadding(yoga::Edge::Start, props.paddingInlineStart);
  }
  if (props.paddingInlineEnd.isDefined()) {
    result.setPadding(yoga::Edge::End, props.paddingInlineEnd);
  }
  if (props.paddingBlock.isDefined()) {
    result.setPadding(yoga::Edge::Vertical, props.paddingBlock);
  }

  // Aliases without precedence
  if (result.position(yoga::Edge::Bottom).isUndefined()) {
    result.setPosition(yoga::Edge::Bottom, props.insetBlockEnd);
  }
  if (result.position(yoga::Edge::Top).isUndefined()) {
    result.setPosition(yoga::Edge::Top, props.insetBlockStart);
  }
  if (result.margin(yoga::Edge::Top).isUndefined()) {
    result.setMargin(yoga::Edge::Top, props.marginBlockStart);
  }
  if (result.margin(yoga::Edge::Bottom).isUndefined()) {
    result.setMargin(yoga::Edge::Bottom, props.marginBlockEnd);
  }
  if (result.padding(yoga::Edge::Top).isUndefined()) {
    result.setPadding(yoga::Edge::Top, props.paddingBlockStart);
  }
  if (result.padding(yoga::Edge::Bottom).isUndefined()) {
    result.setPadding(yoga::Edge::Bottom, props.paddingBlockEnd);
  }

  return result;
}

void YogaLayoutableShadowNode::configureYogaTree(
    float pointScaleFactor,
    YGErrata defaultErrata,
    bool swapLeftAndRight) {
  ensureUnsealed();

  // Set state on our own Yoga node
  YGErrata errata = resolveErrata(defaultErrata);
  YGConfigSetErrata(&yogaConfig_, errata);
  YGConfigSetPointScaleFactor(&yogaConfig_, pointScaleFactor);

  // TODO: `swapLeftAndRight` modified backing props and cannot be undone
  if (swapLeftAndRight) {
    swapStyleLeftAndRight();
  }

  yogaTreeHasBeenConfigured_ = true;

  // Recursively propagate the configuration to child nodes. If a child was
  // already configured as part of a previous ShadowTree generation, we only
  // need to reconfigure it if the context values passed to the Node have
  // changed.
  for (size_t i = 0; i < yogaLayoutableChildren_.size(); i++) {
    const auto& child = *yogaLayoutableChildren_[i];
    auto childLayoutMetrics = child.getLayoutMetrics();
    auto childErrata = YGConfigGetErrata(&child.yogaConfig_);

    if (child.yogaTreeHasBeenConfigured_ &&
        childLayoutMetrics.pointScaleFactor == pointScaleFactor &&
        childLayoutMetrics.wasLeftAndRightSwapped == swapLeftAndRight &&
        childErrata == child.resolveErrata(errata)) {
      continue;
    }

    if (doesOwn(child)) {
      auto& mutableChild = const_cast<YogaLayoutableShadowNode&>(child);
      mutableChild.configureYogaTree(
          pointScaleFactor, child.resolveErrata(errata), swapLeftAndRight);
    } else {
      cloneChildInPlace(i).configureYogaTree(
          pointScaleFactor, errata, swapLeftAndRight);
    }
  }
}

YGErrata YogaLayoutableShadowNode::resolveErrata(YGErrata defaultErrata) const {
  if (auto layoutConformanceNode =
          dynamic_cast<const LayoutConformanceShadowNode*>(this)) {
    switch (layoutConformanceNode->getConcreteProps().mode) {
      case LayoutConformance::Strict:
        return YGErrataNone;
      case LayoutConformance::Compatibility:
        return YGErrataAll;
    }
  }

  return defaultErrata;
}

YogaLayoutableShadowNode& YogaLayoutableShadowNode::cloneChildInPlace(
    size_t layoutableChildIndex) {
  ensureUnsealed();

  const auto& childNode = *yogaLayoutableChildren_[layoutableChildIndex];

  // TODO: Why does this not use `ShadowNodeFragment::statePlaceholder()` like
  // `adoptYogaChild()`?
  auto clonedChildNode = childNode.clone(
      {ShadowNodeFragment::propsPlaceholder(),
       ShadowNodeFragment::childrenPlaceholder(),
       childNode.getState()});

  replaceChild(childNode, clonedChildNode, layoutableChildIndex);
  return static_cast<YogaLayoutableShadowNode&>(*clonedChildNode);
}

void YogaLayoutableShadowNode::setSize(Size size) const {
  ensureUnsealed();

  auto style = yogaNode_.style();
  style.setDimension(
      yoga::Dimension::Width, yoga::StyleSizeLength::points(size.width));
  style.setDimension(
      yoga::Dimension::Height, yoga::StyleSizeLength::points(size.height));
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPadding(RectangleEdges<Float> padding) const {
  ensureUnsealed();

  auto style = yogaNode_.style();

  auto leftPadding = yoga::StyleLength::points(padding.left);
  auto topPadding = yoga::StyleLength::points(padding.top);
  auto rightPadding = yoga::StyleLength::points(padding.right);
  auto bottomPadding = yoga::StyleLength::points(padding.bottom);

  if (leftPadding != style.padding(yoga::Edge::Left) ||
      topPadding != style.padding(yoga::Edge::Top) ||
      rightPadding != style.padding(yoga::Edge::Right) ||
      bottomPadding != style.padding(yoga::Edge::Bottom)) {
    style.setPadding(yoga::Edge::Top, yoga::StyleLength::points(padding.top));
    style.setPadding(yoga::Edge::Left, yoga::StyleLength::points(padding.left));
    style.setPadding(
        yoga::Edge::Right, yoga::StyleLength::points(padding.right));
    style.setPadding(
        yoga::Edge::Bottom, yoga::StyleLength::points(padding.bottom));
    yogaNode_.setStyle(style);
    yogaNode_.setDirty(true);
  }
}

void YogaLayoutableShadowNode::setPositionType(
    YGPositionType positionType) const {
  ensureUnsealed();

  auto style = yogaNode_.style();
  style.setPositionType(yoga::scopedEnum(positionType));
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::layoutTree(
    LayoutContext layoutContext,
    LayoutConstraints layoutConstraints) {
  ensureUnsealed();

  TraceSection s1("YogaLayoutableShadowNode::layoutTree");

  bool swapLeftAndRight = layoutContext.swapLeftAndRightInRTL &&
      layoutConstraints.layoutDirection == LayoutDirection::RightToLeft;

  {
    TraceSection s2("YogaLayoutableShadowNode::configureYogaTree");
    configureYogaTree(
        layoutContext.pointScaleFactor,
        YGErrataAll /*defaultErrata*/,
        swapLeftAndRight);
  }

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  // The caller must ensure that layout constraints make sense.
  // Values cannot be NaN.
  react_native_assert(!std::isnan(minimumSize.width));
  react_native_assert(!std::isnan(minimumSize.height));
  react_native_assert(!std::isnan(maximumSize.width));
  react_native_assert(!std::isnan(maximumSize.height));
  // Values cannot be negative.
  react_native_assert(minimumSize.width >= 0);
  react_native_assert(minimumSize.height >= 0);
  react_native_assert(maximumSize.width >= 0);
  react_native_assert(maximumSize.height >= 0);
  // Minimum size cannot be infinity.
  react_native_assert(!std::isinf(minimumSize.width));
  react_native_assert(!std::isinf(minimumSize.height));

  // Yoga C++ API (and `YGNodeCalculateLayout` function particularly)
  // does not allow to specify sizing modes (see
  // https://www.w3.org/TR/css-sizing-3/#auto-box-sizes) explicitly. Instead, it
  // infers these from styles associated with the root node. To pass the actual
  // layout constraints to Yoga we represent them as
  // `(min/max)(Height/Width)` style properties. Also, we pass `ownerWidth` &
  // `ownerHeight` to allow proper calculation of relative (e.g. specified in
  // percents) style values.

  auto& yogaStyle = yogaNode_.style();

  auto ownerWidth = yogaFloatFromFloat(maximumSize.width);
  auto ownerHeight = yogaFloatFromFloat(maximumSize.height);

  yogaStyle.setMaxDimension(
      yoga::Dimension::Width, yoga::StyleSizeLength::points(maximumSize.width));

  yogaStyle.setMaxDimension(
      yoga::Dimension::Height,
      yoga::StyleSizeLength::points(maximumSize.height));

  yogaStyle.setMinDimension(
      yoga::Dimension::Width, yoga::StyleSizeLength::points(minimumSize.width));

  yogaStyle.setMinDimension(
      yoga::Dimension::Height,
      yoga::StyleSizeLength::points(minimumSize.height));

  auto direction =
      yogaDirectionFromLayoutDirection(layoutConstraints.layoutDirection);

  threadLocalLayoutContext = layoutContext;

  {
    TraceSection s3("YogaLayoutableShadowNode::YGNodeCalculateLayout");
    YGNodeCalculateLayout(&yogaNode_, ownerWidth, ownerHeight, direction);
  }

  // Update layout metrics for root node. Updated for children in
  // YogaLayoutableShadowNode::layout
  if (yogaNode_.getHasNewLayout()) {
    auto layoutMetrics = layoutMetricsFromYogaNode(yogaNode_);
    layoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    layoutMetrics.wasLeftAndRightSwapped = swapLeftAndRight;
    setLayoutMetrics(layoutMetrics);
    yogaNode_.setHasNewLayout(false);
  }

  layout(layoutContext);
}

static EdgeInsets calculateOverflowInset(
    Rect contentFrame,
    Rect contentBounds) {
  auto size = contentFrame.size;
  auto overflowInset = EdgeInsets{};
  overflowInset.left = std::min(contentBounds.getMinX(), Float{0.0});
  overflowInset.top = std::min(contentBounds.getMinY(), Float{0.0});
  overflowInset.right =
      -std::max(contentBounds.getMaxX() - size.width, Float{0.0});
  overflowInset.bottom =
      -std::max(contentBounds.getMaxY() - size.height, Float{0.0});
  return overflowInset;
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  // Reading data from a dirtied node does not make sense.
  react_native_assert(!YGNodeIsDirty(&yogaNode_));

  for (auto childYogaNode : yogaNode_.getChildren()) {
    auto& childNode = shadowNodeFromContext(childYogaNode);

    // Verifying that the Yoga node belongs to the ShadowNode.
    react_native_assert(&childNode.yogaNode_ == childYogaNode);

    if (childYogaNode->getHasNewLayout()) {
      childYogaNode->setHasNewLayout(false);

      // Reading data from a dirtied node does not make sense.
      react_native_assert(!childYogaNode->isDirty());

      // We must copy layout metrics from Yoga node only once (when the parent
      // node exclusively ownes the child node).
      react_native_assert(YGNodeGetOwner(childYogaNode) == &yogaNode_);

      // We are about to mutate layout metrics of the node.
      childNode.ensureUnsealed();

      auto newLayoutMetrics = layoutMetricsFromYogaNode(*childYogaNode);
      newLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
      newLayoutMetrics.wasLeftAndRightSwapped =
          layoutContext.swapLeftAndRightInRTL &&
          newLayoutMetrics.layoutDirection == LayoutDirection::RightToLeft;

      // Child node's layout has changed. When a node is added to
      // `affectedNodes`, onLayout event is called on the component. Comparing
      // `newLayoutMetrics.frame` with `childNode.getLayoutMetrics().frame` to
      // detect if layout has not changed is not advised, please refer to
      // D22999891 for details.
      if (layoutContext.affectedNodes != nullptr) {
        layoutContext.affectedNodes->push_back(&childNode);
      }

      childNode.setLayoutMetrics(newLayoutMetrics);

      if (newLayoutMetrics.displayType != DisplayType::None) {
        childNode.layout(layoutContext);
      }
    }
  }

  if (YGNodeStyleGetOverflow(&yogaNode_) == YGOverflowVisible) {
    // Note that the parent node's overflow layout is NOT affected by its
    // transform matrix. That transform matrix is applied on the parent node as
    // well as all of its child nodes, which won't cause changes on the
    // overflowInset values. A special note on the scale transform -- the scaled
    // layout may look like it's causing overflowInset changes, but it's purely
    // cosmetic and will be handled by pixel density conversion logic later when
    // render the view. The actual overflowInset value is not changed as if the
    // transform is not happening here.
    auto contentBounds = getContentBounds();
    layoutMetrics_.overflowInset =
        calculateOverflowInset(layoutMetrics_.frame, contentBounds);
  } else {
    layoutMetrics_.overflowInset = {};
  }
}

Rect YogaLayoutableShadowNode::getContentBounds() const {
  auto contentBounds = Rect{};

  for (auto childYogaNode : yogaNode_.getChildren()) {
    auto& childNode = shadowNodeFromContext(childYogaNode);

    // Verifying that the Yoga node belongs to the ShadowNode.
    react_native_assert(&childNode.yogaNode_ == childYogaNode);

    auto layoutMetricsWithOverflowInset = childNode.getLayoutMetrics();
    if (layoutMetricsWithOverflowInset.displayType != DisplayType::None) {
      auto viewChildNode = dynamic_cast<const ViewShadowNode*>(&childNode);
      auto hitSlop = viewChildNode != nullptr
          ? viewChildNode->getConcreteProps().hitSlop
          : EdgeInsets{};

      // The contentBounds should always union with existing child node layout +
      // overflowInset. The transform may in a deferred animation and not
      // applied yet.
      contentBounds.unionInPlace(insetBy(
          layoutMetricsWithOverflowInset.frame,
          layoutMetricsWithOverflowInset.overflowInset));
      contentBounds.unionInPlace(
          outsetBy(layoutMetricsWithOverflowInset.frame, hitSlop));

      auto childTransform = childNode.getTransform();
      if (childTransform != Transform::Identity()) {
        // The child node's transform matrix will affect the parent node's
        // contentBounds. We need to union with child node's after transform
        // layout here.
        contentBounds.unionInPlace(insetBy(
            layoutMetricsWithOverflowInset.frame * childTransform,
            layoutMetricsWithOverflowInset.overflowInset * childTransform));
        contentBounds.unionInPlace(outsetBy(
            layoutMetricsWithOverflowInset.frame * childTransform, hitSlop));
      }
    }
  }

  return contentBounds;
}

#pragma mark - Yoga Connectors

YGNodeRef YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(
    YGNodeConstRef /*oldYogaNode*/,
    YGNodeConstRef parentYogaNode,
    size_t childIndex) {
  TraceSection s("YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector");

  auto& parentNode = shadowNodeFromContext(parentYogaNode);
  return &parentNode.cloneChildInPlace(childIndex).yogaNode_;
}

YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(
    YGNodeConstRef yogaNode,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  TraceSection s("YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector");

  auto& shadowNode = shadowNodeFromContext(yogaNode);

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{
      std::numeric_limits<Float>::infinity(),
      std::numeric_limits<Float>::infinity()};

  switch (widthMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.width = floatFromYogaFloat(width);
      maximumSize.width = floatFromYogaFloat(width);
      break;
    case YGMeasureModeAtMost:
      maximumSize.width = floatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.height = floatFromYogaFloat(height);
      maximumSize.height = floatFromYogaFloat(height);
      break;
    case YGMeasureModeAtMost:
      maximumSize.height = floatFromYogaFloat(height);
      break;
  }

  auto size = shadowNode.measureContent(
      threadLocalLayoutContext, {minimumSize, maximumSize});

  return YGSize{
      yogaFloatFromFloat(size.width), yogaFloatFromFloat(size.height)};
}

float YogaLayoutableShadowNode::yogaNodeBaselineCallbackConnector(
    YGNodeConstRef yogaNode,
    float width,
    float height) {
  TraceSection s("YogaLayoutableShadowNode::yogaNodeBaselineCallbackConnector");

  auto& shadowNode = shadowNodeFromContext(yogaNode);
  auto baseline = shadowNode.baseline(
      threadLocalLayoutContext,
      {.width = floatFromYogaFloat(width),
       .height = floatFromYogaFloat(height)});

  return yogaFloatFromFloat(baseline);
}

YogaLayoutableShadowNode& YogaLayoutableShadowNode::shadowNodeFromContext(
    YGNodeConstRef yogaNode) {
  return dynamic_cast<YogaLayoutableShadowNode&>(
      *static_cast<ShadowNode*>(YGNodeGetContext(yogaNode)));
}

yoga::Config& YogaLayoutableShadowNode::initializeYogaConfig(
    yoga::Config& config,
    YGConfigConstRef previousConfig) {
  YGConfigSetCloneNodeFunc(
      &config, YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector);
  if (previousConfig != nullptr) {
    YGConfigSetPointScaleFactor(
        &config, YGConfigGetPointScaleFactor(previousConfig));
    YGConfigSetErrata(&config, YGConfigGetErrata(previousConfig));
  }

  return config;
}

#pragma mark - RTL left and right swapping

void YogaLayoutableShadowNode::swapStyleLeftAndRight() {
  ensureUnsealed();

  swapLeftAndRightInYogaStyleProps();
  swapLeftAndRightInViewProps();
}

void YogaLayoutableShadowNode::swapLeftAndRightInYogaStyleProps() {
  auto yogaStyle = yogaNode_.style();

  // Swap Yoga node values, position, padding and margin.

  if (yogaStyle.position(yoga::Edge::Left).isDefined()) {
    yogaStyle.setPosition(
        yoga::Edge::Start, yogaStyle.position(yoga::Edge::Left));
    yogaStyle.setPosition(yoga::Edge::Left, yoga::StyleLength::undefined());
  }

  if (yogaStyle.position(yoga::Edge::Right).isDefined()) {
    yogaStyle.setPosition(
        yoga::Edge::End, yogaStyle.position(yoga::Edge::Right));
    yogaStyle.setPosition(yoga::Edge::Right, yoga::StyleLength::undefined());
  }

  if (yogaStyle.padding(yoga::Edge::Left).isDefined()) {
    yogaStyle.setPadding(
        yoga::Edge::Start, yogaStyle.padding(yoga::Edge::Left));
    yogaStyle.setPadding(yoga::Edge::Left, yoga::StyleLength::undefined());
  }

  if (yogaStyle.padding(yoga::Edge::Right).isDefined()) {
    yogaStyle.setPadding(yoga::Edge::End, yogaStyle.padding(yoga::Edge::Right));
    yogaStyle.setPadding(yoga::Edge::Right, yoga::StyleLength::undefined());
  }

  if (yogaStyle.margin(yoga::Edge::Left).isDefined()) {
    yogaStyle.setMargin(yoga::Edge::Start, yogaStyle.margin(yoga::Edge::Left));
    yogaStyle.setMargin(yoga::Edge::Left, yoga::StyleLength::undefined());
  }

  if (yogaStyle.margin(yoga::Edge::Right).isDefined()) {
    yogaStyle.setMargin(yoga::Edge::End, yogaStyle.margin(yoga::Edge::Right));
    yogaStyle.setMargin(yoga::Edge::Right, yoga::StyleLength::undefined());
  }

  if (yogaStyle.border(yoga::Edge::Left).isDefined()) {
    yogaStyle.setBorder(yoga::Edge::Start, yogaStyle.border(yoga::Edge::Left));
    yogaStyle.setBorder(yoga::Edge::Left, yoga::StyleLength::undefined());
  }

  if (yogaStyle.border(yoga::Edge::Right).isDefined()) {
    yogaStyle.setBorder(yoga::Edge::End, yogaStyle.border(yoga::Edge::Right));
    yogaStyle.setBorder(yoga::Edge::Right, yoga::StyleLength::undefined());
  }

  yogaNode_.setStyle(yogaStyle);
}

void YogaLayoutableShadowNode::swapLeftAndRightInViewProps() {
  if (auto viewShadowNode = dynamic_cast<ViewShadowNode*>(this)) {
    // TODO: Do not mutate props directly.
    auto& props =
        const_cast<ViewShadowNodeProps&>(viewShadowNode->getConcreteProps());

    // Swap border node values, borderRadii, borderColors and borderStyles.
    if (props.borderRadii.topLeft.has_value()) {
      props.borderRadii.topStart = props.borderRadii.topLeft;
      props.borderRadii.topLeft.reset();
    }

    if (props.borderRadii.bottomLeft.has_value()) {
      props.borderRadii.bottomStart = props.borderRadii.bottomLeft;
      props.borderRadii.bottomLeft.reset();
    }

    if (props.borderRadii.topRight.has_value()) {
      props.borderRadii.topEnd = props.borderRadii.topRight;
      props.borderRadii.topRight.reset();
    }

    if (props.borderRadii.bottomRight.has_value()) {
      props.borderRadii.bottomEnd = props.borderRadii.bottomRight;
      props.borderRadii.bottomRight.reset();
    }

    if (props.borderColors.left.has_value()) {
      props.borderColors.start = props.borderColors.left;
      props.borderColors.left.reset();
    }

    if (props.borderColors.right.has_value()) {
      props.borderColors.end = props.borderColors.right;
      props.borderColors.right.reset();
    }

    if (props.borderStyles.left.has_value()) {
      props.borderStyles.start = props.borderStyles.left;
      props.borderStyles.left.reset();
    }

    if (props.borderStyles.right.has_value()) {
      props.borderStyles.end = props.borderStyles.right;
      props.borderStyles.right.reset();
    }
  }
}

#pragma mark - Consistency Ensuring Helpers

void YogaLayoutableShadowNode::ensureConsistency() const {
  ensureYogaChildrenLookFine();
  ensureYogaChildrenAlignment();
}

void YogaLayoutableShadowNode::ensureYogaChildrenLookFine() const {
#if defined(REACT_NATIVE_DEBUG)
  // Checking that the shapes of Yoga node children object look fine.
  // This is the only heuristic that might produce false-positive results
  // (really broken dangled nodes might look fine). This is useful as an early
  // signal that something went wrong.
  auto& yogaChildren = yogaNode_.getChildren();

  for (const auto& yogaChild : yogaChildren) {
    react_native_assert(yogaChild->getContext());
    react_native_assert(yogaChild->getChildren().size() < 16384);
    if (!yogaChild->getChildren().empty()) {
      react_native_assert(!yogaChild->hasMeasureFunc());
    }
  }
#endif
}

void YogaLayoutableShadowNode::ensureYogaChildrenAlignment() const {
#if defined(REACT_NATIVE_DEBUG)
  // If the node is not a leaf node, checking that:
  // - All children are `YogaLayoutableShadowNode` subclasses.
  // - All Yoga children are owned/connected to corresponding children of
  //   this node.

  auto& yogaChildren = yogaNode_.getChildren();
  auto& children = yogaLayoutableChildren_;

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    react_native_assert(yogaChildren.empty());
    return;
  }

  react_native_assert(yogaChildren.size() == children.size());

  for (size_t i = 0; i < children.size(); i++) {
    auto& yogaChild = yogaChildren.at(i);
    auto& child = children.at(i);
    react_native_assert(
        yogaChild->getContext() ==
        dynamic_cast<const YogaLayoutableShadowNode*>(child.get()));
  }
#endif
}

} // namespace facebook::react
