/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputShadowNode.h"

#include <fb/fbjni.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/components/text/BaseTextShadowNode.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/core/conversions.h>
#include <react/jni/ReadableNativeMap.h>

#include <Glog/logging.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

extern const char AndroidTextInputComponentName[] = "AndroidTextInput";

void AndroidTextInputShadowNode::setContextContainer(
    ContextContainer *contextContainer) {
  ensureUnsealed();
  contextContainer_ = contextContainer;
}

AttributedString AndroidTextInputShadowNode::getAttributedString(
    bool usePlaceholders) const {
  auto textAttributes = TextAttributes::defaultTextAttributes();
  textAttributes.apply(getProps()->textAttributes);

  // Use BaseTextShadowNode to get attributed string from children
  auto const &attributedString =
      BaseTextShadowNode::getAttributedString(textAttributes, *this);
  if (!attributedString.isEmpty()) {
    return attributedString;
  }
  if (!getProps()->text.empty() || usePlaceholders) {
    // If the BaseTextShadowNode didn't detect any child Text nodes, we
    // may actually just have a `text` attribute.
    // TODO: figure out why BaseTextShadowNode doesn't pick this up, this
    // is a bug. A minimal Playground example that triggers this: P122991121
    auto textAttributedString = AttributedString{};
    auto fragment = AttributedString::Fragment{};
    fragment.string = getProps()->text;

    if (usePlaceholders) {
      // Return placeholder text instead, if text was empty.
      if (fragment.string.empty()) {
        fragment.string = getProps()->placeholder;
      }
      // For measurement purposes, we want to make sure that there's at least a
      // single character in the string so that the measured height is greater
      // than zero. Otherwise, empty TextInputs with no placeholder don't
      // display at all.
      if (fragment.string.empty()) {
        fragment.string = " ";
      }
    }
    fragment.textAttributes = textAttributes;
    fragment.parentShadowView = ShadowView(*this);
    textAttributedString.appendFragment(fragment);
    return textAttributedString;
  }

  return attributedString;
}

void AndroidTextInputShadowNode::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void AndroidTextInputShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto attributedString = getAttributedString(false);
  auto const &state = getStateData();

  assert(textLayoutManager_);
  assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.attributedString == attributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  setStateData(AndroidTextInputState{state.mostRecentEventCount,
                                     attributedString,
                                     getProps()->paragraphAttributes,
                                     textLayoutManager_});
}

#pragma mark - LayoutableShadowNode

Size AndroidTextInputShadowNode::measure(
    LayoutConstraints layoutConstraints) const {
  AttributedString attributedString = getAttributedString(true);

  if (attributedString.isEmpty()) {
    return {0, 0};
  }

  return textLayoutManager_->measure(
      attributedString, getProps()->paragraphAttributes, layoutConstraints);
}

void AndroidTextInputShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
