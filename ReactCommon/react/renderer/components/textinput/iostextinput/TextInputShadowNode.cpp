/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputShadowNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/conversions.h>

namespace facebook {
namespace react {

extern char const TextInputComponentName[] = "TextInput";

AttributedStringBox TextInputShadowNode::attributedStringBoxToMeasure(
    LayoutContext const &layoutContext) const {
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
    LayoutContext const &layoutContext) const {
  auto textAttributes = getConcreteProps().getEffectiveTextAttributes(
      layoutContext.fontSizeMultiplier);
  auto attributedString = AttributedString{};

  attributedString.appendFragment(
      AttributedString::Fragment{getConcreteProps().text, textAttributes});

  auto attachments = Attachments{};
  BaseTextShadowNode::buildAttributedString(
      textAttributes, *this, attributedString, attachments);

  return attributedString;
}

void TextInputShadowNode::setTextLayoutManager(
    TextLayoutManager::Shared const &textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void TextInputShadowNode::updateStateIfNeeded(
    LayoutContext const &layoutContext) {
  ensureUnsealed();

  auto reactTreeAttributedString = getAttributedString(layoutContext);
  auto const &state = getStateData();

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
    LayoutContext const &layoutContext,
    LayoutConstraints const &layoutConstraints) const {
  return textLayoutManager_
      ->measure(
          attributedStringBoxToMeasure(layoutContext),
          getConcreteProps().getEffectiveParagraphAttributes(),
          layoutConstraints)
      .size;
}

void TextInputShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded(layoutContext);
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
