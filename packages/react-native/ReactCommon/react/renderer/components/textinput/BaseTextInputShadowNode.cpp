/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextInputShadowNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>

namespace facebook::react {

AttributedStringBox BaseTextInputShadowNode::attributedStringBoxToMeasure(
    const LayoutContext& layoutContext,
    const BaseTextInputProps& props,
    const TextInputState& state) const {
  bool meaningfulState = hasMeaningfulState();
  if (meaningfulState) {
    auto attributedStringBox = state.attributedStringBox;
    if (attributedStringBox.getMode() ==
            AttributedStringBox::Mode::OpaquePointer ||
        !attributedStringBox.getValue().isEmpty()) {
      return state.attributedStringBox;
    }
  }

  auto attributedString = meaningfulState
      ? AttributedString{}
      : getAttributedString(layoutContext, props);

  if (attributedString.isEmpty()) {
    auto placeholder = props.placeholder;
    // Note: `zero-width space` is insufficient in some cases (e.g. when we need
    // to measure the "hight" of the font).
    // TODO T67606511: We will redefine the measurement of empty strings as part
    // of T67606511
    auto string = !placeholder.empty()
        ? placeholder
        : BaseTextShadowNode::getEmptyPlaceholder();
    auto textAttributes =
        props.getEffectiveTextAttributes(layoutContext.fontSizeMultiplier);
    attributedString.appendFragment({string, textAttributes, {}});
  }

  return AttributedStringBox{attributedString};
}

AttributedString BaseTextInputShadowNode::getAttributedString(
    const LayoutContext& layoutContext,
    const BaseTextInputProps& props) const {
  auto textAttributes =
      props.getEffectiveTextAttributes(layoutContext.fontSizeMultiplier);
  auto attributedString = AttributedString{};

  attributedString.appendFragment(AttributedString::Fragment{
      .string = props.text,
      .textAttributes = textAttributes,
      // TODO: Is this really meant to be by value?
      .parentShadowView = ShadowView(getShadowNode())});

  auto attachments = BaseTextShadowNode::Attachments{};
  BaseTextShadowNode::buildAttributedString(
      textAttributes, getShadowNode(), attributedString, attachments);
  attributedString.setBaseTextAttributes(textAttributes);

  return attributedString;
}

void BaseTextInputShadowNode::setTextLayoutManager(
    std::shared_ptr<const TextLayoutManager> textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = std::move(textLayoutManager);
}

std::optional<TextInputState> BaseTextInputShadowNode::updateStateIfNeeded(
    const LayoutContext& layoutContext,
    const BaseTextInputProps& props,
    const TextInputState& state) const {
  ensureUnsealed();

  auto reactTreeAttributedString = getAttributedString(layoutContext, props);

  react_native_assert(textLayoutManager_);
  if (state.reactTreeAttributedString.isContentEqual(
          reactTreeAttributedString)) {
    return std::nullopt;
  }

  TextInputState newState;
  newState.attributedStringBox = AttributedStringBox{reactTreeAttributedString};
  newState.paragraphAttributes = props.paragraphAttributes;
  newState.reactTreeAttributedString = reactTreeAttributedString;
  newState.mostRecentEventCount = props.mostRecentEventCount;
  return newState;
}

Size BaseTextInputShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints,
    const BaseTextInputProps& props,
    const TextInputState& state) const {
  TextLayoutContext textLayoutContext{};
  textLayoutContext.pointScaleFactor = layoutContext.pointScaleFactor;
  return textLayoutManager_
      ->measure(
          attributedStringBoxToMeasure(layoutContext, props, state),
          props.getEffectiveParagraphAttributes(),
          textLayoutContext,
          layoutConstraints)
      .size;
}

Float BaseTextInputShadowNode::baseline(
    const LayoutContext& layoutContext,
    Size size,
    const BaseTextInputProps& props,
    const yoga::Node& yogaNode) const {
  auto attributedString = getAttributedString(layoutContext, props);

  if (attributedString.isEmpty()) {
    auto placeholderString = !props.placeholder.empty()
        ? props.placeholder
        : BaseTextShadowNode::getEmptyPlaceholder();
    auto textAttributes =
        props.getEffectiveTextAttributes(layoutContext.fontSizeMultiplier);
    attributedString.appendFragment(
        {std::move(placeholderString), textAttributes, {}});
  }

  // Yoga expects a baseline relative to the Node's border-box edge instead of
  // the content, so we need to adjust by the padding and border widths, which
  // have already been set by the time of baseline alignment
  auto top = YGNodeLayoutGetBorder(&yogaNode, YGEdgeTop) +
      YGNodeLayoutGetPadding(&yogaNode, YGEdgeTop);

  AttributedStringBox attributedStringBox{attributedString};
  return textLayoutManager_->baseline(
             attributedStringBox,
             props.getEffectiveParagraphAttributes(),
             size) +
      top;
}

} // namespace facebook::react
