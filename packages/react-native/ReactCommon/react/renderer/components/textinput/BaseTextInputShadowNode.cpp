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

  // Tree is often out of sync with the value of the TextInput.
  // This is by design - don't change the value of the TextInput in the State,
  // and therefore in Java, unless the tree itself changes.
  if (state.reactTreeAttributedString == reactTreeAttributedString) {
    return std::nullopt;
  }

  // If props event counter is less than what we already have in state, skip it
  if (props.mostRecentEventCount < state.mostRecentEventCount) {
    return std::nullopt;
  }

  // Even if we're here and updating state, it may be only to update the layout
  // manager If that is the case, make sure we don't update text: pass in the
  // current attributedString unchanged, and pass in zero for the "event count"
  // so no changes are applied There's no way to prevent a state update from
  // flowing to the UI, so we just ensure it's a noop in those cases.
  auto newEventCount =
      state.reactTreeAttributedString.isContentEqual(reactTreeAttributedString)
      ? 0
      : props.mostRecentEventCount;

  return TextInputState(
      AttributedStringBox{reactTreeAttributedString},
      reactTreeAttributedString,
      props.paragraphAttributes,
      newEventCount);
}

Size BaseTextInputShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints,
    const BaseTextInputProps& props,
    const TextInputState& state) const {
  // Layout is called right after measure.
  // Measure is marked as `const`, and `layout` is not; so State can be updated
  // during layout, but not during `measure`. If State is out-of-date in layout,
  // it's too late: measure will have already operated on old State. Thus, we
  // use the same value here that we *will* use in layout to update the state.
  AttributedStringBox attributedStringBox =
      attributedStringBoxToMeasure(layoutContext, props, state);

  if (attributedStringBox.getValue().isEmpty() &&
      state.mostRecentEventCount != 0) {
    return {.width = 0, .height = 0};
  }

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
