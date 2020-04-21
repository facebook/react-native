/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputShadowNode.h"

#include <react/attributedstring/AttributedStringBox.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/core/conversions.h>

namespace facebook {
namespace react {

extern char const TextInputComponentName[] = "TextInput";

AttributedStringBox TextInputShadowNode::attributedStringBoxToMeasure() const {
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

  auto attributedString =
      hasMeaningfulState ? AttributedString{} : getAttributedString();

  if (attributedString.isEmpty()) {
    auto placeholder = getConcreteProps().placeholder;
    // Note: `zero-width space` is insufficient in some cases (e.g. when we need
    // to measure the "hight" of the font).
    auto string = !placeholder.empty() ? placeholder : "I";
    auto textAttributes = getConcreteProps().getEffectiveTextAttributes();
    attributedString.appendFragment({string, textAttributes, {}});
  }

  return AttributedStringBox{attributedString};
}

AttributedString TextInputShadowNode::getAttributedString() const {
  auto textAttributes = getConcreteProps().getEffectiveTextAttributes();
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

void TextInputShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto reactTreeAttributedString = getAttributedString();
  auto const &state = getStateData();

  assert(textLayoutManager_);
  assert(
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

Size TextInputShadowNode::measure(LayoutConstraints layoutConstraints) const {
  return textLayoutManager_
      ->measure(
          attributedStringBoxToMeasure(),
          getConcreteProps().getEffectiveParagraphAttributes(),
          layoutConstraints)
      .size;
}

void TextInputShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
