/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputShadowNode.h"

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>

namespace facebook::react {

extern const char TextInputComponentName[] = "TextInput";

TextInputShadowNode::TextInputShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  auto& sourceTextInputShadowNode =
      static_cast<const TextInputShadowNode&>(sourceShadowNode);

  if (ReactNativeFeatureFlags::enableCleanTextInputYogaNode()) {
    if (!fragment.children && !fragment.props &&
        sourceTextInputShadowNode.getIsLayoutClean()) {
      // This ParagraphShadowNode was cloned but did not change
      // in a way that affects its layout. Let's mark it clean
      // to stop Yoga from traversing it.
      cleanLayout();
    }
  }
}

AttributedStringBox TextInputShadowNode::attributedStringBoxToMeasure(
    const LayoutContext& layoutContext) const {
  bool hasMeaningfulState =
      getState() && getState()->getRevision() != State::initialRevisionValue;

  if (hasMeaningfulState) {
    auto attributedStringBox = getStateData().attributedStringBox;
    if (attributedStringBox.getMode() ==
            AttributedStringBox::Mode::OpaquePointer ||
        !attributedStringBox.getValue().isEmpty()) {
      return getStateData().attributedStringBox;
    }
  }

  auto attributedString = hasMeaningfulState
      ? AttributedString{}
      : getAttributedString(layoutContext);

  if (attributedString.isEmpty()) {
    auto placeholder = getConcreteProps().placeholder;
    // Note: `zero-width space` is insufficient in some cases (e.g. when we need
    // to measure the "hight" of the font).
    // TODO T67606511: We will redefine the measurement of empty strings as part
    // of T67606511
    auto string = !placeholder.empty()
        ? placeholder
        : BaseTextShadowNode::getEmptyPlaceholder();
    auto textAttributes = getConcreteProps().getEffectiveTextAttributes(
        layoutContext.fontSizeMultiplier);
    attributedString.appendFragment({string, textAttributes, {}});
  }

  return AttributedStringBox{attributedString};
}

AttributedString TextInputShadowNode::getAttributedString(
    const LayoutContext& layoutContext) const {
  auto textAttributes = getConcreteProps().getEffectiveTextAttributes(
      layoutContext.fontSizeMultiplier);
  auto attributedString = AttributedString{};

  attributedString.appendFragment(AttributedString::Fragment{
      .string = getConcreteProps().text,
      .textAttributes = textAttributes,
      // TODO: Is this really meant to be by value?
      .parentShadowView = ShadowView{}});

  auto attachments = Attachments{};
  BaseTextShadowNode::buildAttributedString(
      textAttributes, *this, attributedString, attachments);

  return attributedString;
}

void TextInputShadowNode::setTextLayoutManager(
    std::shared_ptr<const TextLayoutManager> textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = std::move(textLayoutManager);
}

void TextInputShadowNode::updateStateIfNeeded(
    const LayoutContext& layoutContext) {
  ensureUnsealed();

  auto reactTreeAttributedString = getAttributedString(layoutContext);
  const auto& state = getStateData();

  react_native_assert(textLayoutManager_);
  react_native_assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.reactTreeAttributedString == reactTreeAttributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  auto newState = TextInputState{};
  newState.attributedStringBox = AttributedStringBox{reactTreeAttributedString};
  newState.paragraphAttributes = getConcreteProps().paragraphAttributes;
  newState.reactTreeAttributedString = reactTreeAttributedString;
  newState.layoutManager = textLayoutManager_;
  newState.mostRecentEventCount = getConcreteProps().mostRecentEventCount;
  setStateData(std::move(newState));
}

#pragma mark - LayoutableShadowNode

Size TextInputShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  TextLayoutContext textLayoutContext{};
  textLayoutContext.pointScaleFactor = layoutContext.pointScaleFactor;
  return textLayoutManager_
      ->measure(
          attributedStringBoxToMeasure(layoutContext),
          getConcreteProps().getEffectiveParagraphAttributes(),
          textLayoutContext,
          layoutConstraints)
      .size;
}

void TextInputShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded(layoutContext);
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace facebook::react
