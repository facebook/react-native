/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphShadowNode.h"

#include <cmath>

#include <react/debug/react_native_assert.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/graphics/rounding.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>

#include "ParagraphState.h"

namespace facebook::react {

using Content = ParagraphShadowNode::Content;

const char ParagraphComponentName[] = "Paragraph";

ParagraphShadowNode::ParagraphShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  auto& sourceParagraphShadowNode =
      static_cast<const ParagraphShadowNode&>(sourceShadowNode);
  if (!fragment.children && !fragment.props &&
      sourceParagraphShadowNode.getIsLayoutClean()) {
    // This ParagraphShadowNode was cloned but did not change
    // in a way that affects its layout. Let's mark it clean
    // to stop Yoga from traversing it.
    cleanLayout();
  }
}

const Content& ParagraphShadowNode::getContent(
    const LayoutContext& layoutContext) const {
  if (content_.has_value()) {
    return content_.value();
  }

  ensureUnsealed();

  auto textAttributes = TextAttributes::defaultTextAttributes();
  textAttributes.fontSizeMultiplier = layoutContext.fontSizeMultiplier;
  textAttributes.apply(getConcreteProps().textAttributes);
  textAttributes.layoutDirection =
      YGNodeLayoutGetDirection(&yogaNode_) == YGDirectionRTL
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;
  auto attributedString = AttributedString{};
  auto attachments = Attachments{};
  buildAttributedString(textAttributes, *this, attributedString, attachments);

  content_ = Content{
      attributedString, getConcreteProps().paragraphAttributes, attachments};

  return content_.value();
}

Content ParagraphShadowNode::getContentWithMeasuredAttachments(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto content = getContent(layoutContext);

  if (content.attachments.empty()) {
    // Base case: No attachments, nothing to do.
    return content;
  }

  auto localLayoutConstraints = layoutConstraints;
  // Having enforced minimum size for text fragments doesn't make much sense.
  localLayoutConstraints.minimumSize = Size{0, 0};

  auto& fragments = content.attributedString.getFragments();

  for (const auto& attachment : content.attachments) {
    auto laytableShadowNode =
        dynamic_cast<const LayoutableShadowNode*>(attachment.shadowNode);

    if (laytableShadowNode == nullptr) {
      continue;
    }

    auto size =
        laytableShadowNode->measure(layoutContext, localLayoutConstraints);

    // Rounding to *next* value on the pixel grid.
    size.width += 0.01f;
    size.height += 0.01f;
    size = roundToPixel<&ceil>(size, layoutContext.pointScaleFactor);

    auto fragmentLayoutMetrics = LayoutMetrics{};
    fragmentLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    fragmentLayoutMetrics.frame.size = size;
    fragments[attachment.fragmentIndex].parentShadowView.layoutMetrics =
        fragmentLayoutMetrics;
  }

  return content;
}

void ParagraphShadowNode::setTextLayoutManager(
    std::shared_ptr<const TextLayoutManager> textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = std::move(textLayoutManager);
}

void ParagraphShadowNode::updateStateIfNeeded(const Content& content) {
  ensureUnsealed();

  auto& state = getStateData();

  react_native_assert(textLayoutManager_);

  if (state.attributedString == content.attributedString) {
    return;
  }

  setStateData(ParagraphState{
      content.attributedString,
      content.paragraphAttributes,
      textLayoutManager_});
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto content =
      getContentWithMeasuredAttachments(layoutContext, layoutConstraints);

  auto attributedString = content.attributedString;
  if (attributedString.isEmpty()) {
    // Note: `zero-width space` is insufficient in some cases (e.g. when we need
    // to measure the "height" of the font).
    // TODO T67606511: We will redefine the measurement of empty strings as part
    // of T67606511
    auto string = BaseTextShadowNode::getEmptyPlaceholder();
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.fontSizeMultiplier = layoutContext.fontSizeMultiplier;
    textAttributes.apply(getConcreteProps().textAttributes);
    attributedString.appendFragment({string, textAttributes, {}});
  }

  TextLayoutContext textLayoutContext{};
  textLayoutContext.pointScaleFactor = layoutContext.pointScaleFactor;
  return textLayoutManager_
      ->measure(
          AttributedStringBox{attributedString},
          content.paragraphAttributes,
          textLayoutContext,
          layoutConstraints)
      .size;
}

Float ParagraphShadowNode::baseline(
    const LayoutContext& layoutContext,
    Size size) const {
  auto layoutMetrics = getLayoutMetrics();
  auto layoutConstraints =
      LayoutConstraints{size, size, layoutMetrics.layoutDirection};
  auto content =
      getContentWithMeasuredAttachments(layoutContext, layoutConstraints);
  auto attributedString = content.attributedString;

  if (attributedString.isEmpty()) {
    // Note: `zero-width space` is insufficient in some cases (e.g. when we need
    // to measure the "height" of the font).
    // TODO T67606511: We will redefine the measurement of empty strings as part
    // of T67606511
    auto string = BaseTextShadowNode::getEmptyPlaceholder();
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.fontSizeMultiplier = layoutContext.fontSizeMultiplier;
    textAttributes.apply(getConcreteProps().textAttributes);
    attributedString.appendFragment({string, textAttributes, {}});
  }

  AttributedStringBox attributedStringBox{attributedString};
  return textLayoutManager_->baseline(
      attributedStringBox, getConcreteProps().paragraphAttributes, size);
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  ensureUnsealed();

  auto layoutMetrics = getLayoutMetrics();
  auto size = layoutMetrics.getContentFrame().size;

  auto layoutConstraints =
      LayoutConstraints{size, size, layoutMetrics.layoutDirection};
  auto content =
      getContentWithMeasuredAttachments(layoutContext, layoutConstraints);

  updateStateIfNeeded(content);

  TextLayoutContext textLayoutContext{};
  textLayoutContext.pointScaleFactor = layoutContext.pointScaleFactor;
  auto measurement = TextMeasurement{};

  AttributedStringBox attributedStringBox{content.attributedString};

  if (getConcreteProps().onTextLayout) {
    auto linesMeasurements = textLayoutManager_->measureLines(
        attributedStringBox, content.paragraphAttributes, size);
    getConcreteEventEmitter().onTextLayout(linesMeasurements);
  }

  if (content.attachments.empty()) {
    // No attachments to layout.
    return;
  }

  // Only measure if attachments are not empty.
  measurement = textLayoutManager_->measure(
      attributedStringBox,
      content.paragraphAttributes,
      textLayoutContext,
      layoutConstraints);

  //  Iterating on attachments, we clone shadow nodes and moving
  //  `paragraphShadowNode` that represents clones of `this` object.
  auto paragraphShadowNode = static_cast<ParagraphShadowNode*>(this);
  // `paragraphOwningShadowNode` is owning pointer to`paragraphShadowNode`
  // (besides the initial case when `paragraphShadowNode == this`), we need this
  // only to keep it in memory for a while.
  auto paragraphOwningShadowNode = ShadowNode::Unshared{};

  react_native_assert(
      content.attachments.size() == measurement.attachments.size());

  for (size_t i = 0; i < content.attachments.size(); i++) {
    auto& attachment = content.attachments.at(i);

    if (dynamic_cast<const LayoutableShadowNode*>(attachment.shadowNode) ==
        nullptr) {
      // Not a layoutable `ShadowNode`, no need to lay it out.
      continue;
    }

    auto clonedShadowNode = ShadowNode::Unshared{};

    paragraphOwningShadowNode = paragraphShadowNode->cloneTree(
        attachment.shadowNode->getFamily(),
        [&](const ShadowNode& oldShadowNode) {
          clonedShadowNode = oldShadowNode.clone({});
          return clonedShadowNode;
        });
    paragraphShadowNode =
        static_cast<ParagraphShadowNode*>(paragraphOwningShadowNode.get());

    auto& layoutableShadowNode =
        dynamic_cast<LayoutableShadowNode&>(*clonedShadowNode);

    auto attachmentFrame = measurement.attachments[i].frame;
    attachmentFrame.origin.x += layoutMetrics.contentInsets.left;
    attachmentFrame.origin.y += layoutMetrics.contentInsets.top;

    auto attachmentSize = roundToPixel<&ceil>(
        attachmentFrame.size, layoutMetrics.pointScaleFactor);
    auto attachmentOrigin = roundToPixel<&round>(
        attachmentFrame.origin, layoutMetrics.pointScaleFactor);
    auto attachmentLayoutContext = layoutContext;
    auto attachmentLayoutConstrains = LayoutConstraints{
        attachmentSize, attachmentSize, layoutConstraints.layoutDirection};

    // Laying out the `ShadowNode` and the subtree starting from it.
    layoutableShadowNode.layoutTree(
        attachmentLayoutContext, attachmentLayoutConstrains);

    // Altering the origin of the `ShadowNode` (which is defined by text layout,
    // not by internal styles and state).
    auto attachmentLayoutMetrics = layoutableShadowNode.getLayoutMetrics();
    attachmentLayoutMetrics.frame.origin = attachmentOrigin;
    layoutableShadowNode.setLayoutMetrics(attachmentLayoutMetrics);
  }

  // If we ended up cloning something, we need to update the list of children to
  // reflect the changes that we made.
  if (paragraphShadowNode != this) {
    this->children_ =
        static_cast<const ParagraphShadowNode*>(paragraphShadowNode)->children_;
  }
}

} // namespace facebook::react
