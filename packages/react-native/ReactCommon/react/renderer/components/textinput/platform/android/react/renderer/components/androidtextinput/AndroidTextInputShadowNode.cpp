/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputShadowNode.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>

namespace facebook::react {

extern const char AndroidTextInputComponentName[] = "AndroidTextInput";

void AndroidTextInputShadowNode::setTextLayoutManager(
    std::shared_ptr<const TextLayoutManager> textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = std::move(textLayoutManager);
}

Size AndroidTextInputShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto textConstraints = getTextConstraints(layoutConstraints);

  if (getStateData().cachedAttributedStringId != 0) {
    auto textSize = textLayoutManager_
                        ->measureCachedSpannableById(
                            getStateData().cachedAttributedStringId,
                            getConcreteProps().paragraphAttributes,
                            textConstraints)
                        .size;
    return layoutConstraints.clamp(textSize);
  }

  // Layout is called right after measure.
  // Measure is marked as `const`, and `layout` is not; so State can be
  // updated during layout, but not during `measure`. If State is out-of-date
  // in layout, it's too late: measure will have already operated on old
  // State. Thus, we use the same value here that we *will* use in layout to
  // update the state.
  AttributedString attributedString = getMostRecentAttributedString();

  if (attributedString.isEmpty()) {
    attributedString = getPlaceholderAttributedString();
  }

  if (attributedString.isEmpty() && getStateData().mostRecentEventCount != 0) {
    return {.width = 0, .height = 0};
  }

  TextLayoutContext textLayoutContext;
  textLayoutContext.pointScaleFactor = layoutContext.pointScaleFactor;
  auto textSize = textLayoutManager_
                      ->measure(
                          AttributedStringBox{attributedString},
                          getConcreteProps().paragraphAttributes,
                          textLayoutContext,
                          textConstraints)
                      .size;
  return layoutConstraints.clamp(textSize);
}

void AndroidTextInputShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

Float AndroidTextInputShadowNode::baseline(
    const LayoutContext& /*layoutContext*/,
    Size size) const {
  AttributedString attributedString = getMostRecentAttributedString();

  if (attributedString.isEmpty()) {
    attributedString = getPlaceholderAttributedString();
  }

  // Yoga expects a baseline relative to the Node's border-box edge instead of
  // the content, so we need to adjust by the padding and border widths, which
  // have already been set by the time of baseline alignment
  auto top = YGNodeLayoutGetBorder(&yogaNode_, YGEdgeTop) +
      YGNodeLayoutGetPadding(&yogaNode_, YGEdgeTop);

  AttributedStringBox attributedStringBox{attributedString};
  return textLayoutManager_->baseline(
             attributedStringBox,
             getConcreteProps().paragraphAttributes,
             size) +
      top;
}

LayoutConstraints AndroidTextInputShadowNode::getTextConstraints(
    const LayoutConstraints& layoutConstraints) const {
  if (getConcreteProps().multiline) {
    return layoutConstraints;
  } else {
    // A single line TextInput acts as a horizontal scroller of infinitely
    // expandable text, so we want to measure the text as if it is allowed to
    // infinitely expand horizontally, and later clamp to the constraints of the
    // input.
    return LayoutConstraints{
        .minimumSize = layoutConstraints.minimumSize,
        .maximumSize =
            Size{
                .width = std::numeric_limits<Float>::infinity(),
                .height = layoutConstraints.maximumSize.height,
            },
        .layoutDirection = layoutConstraints.layoutDirection,
    };
  }
}

void AndroidTextInputShadowNode::updateStateIfNeeded() {
  ensureUnsealed();
  const auto& stateData = getStateData();
  auto reactTreeAttributedString = getAttributedString();

  // Tree is often out of sync with the value of the TextInput.
  // This is by design - don't change the value of the TextInput in the State,
  // and therefore in Java, unless the tree itself changes.
  if (stateData.reactTreeAttributedString == reactTreeAttributedString) {
    return;
  }

  // If props event counter is less than what we already have in state, skip it
  const auto& props = BaseShadowNode::getConcreteProps();
  if (props.mostRecentEventCount < stateData.mostRecentEventCount) {
    return;
  }

  // Even if we're here and updating state, it may be only to update the layout
  // manager If that is the case, make sure we don't update text: pass in the
  // current attributedString unchanged, and pass in zero for the "event count"
  // so no changes are applied There's no way to prevent a state update from
  // flowing to Java, so we just ensure it's a noop in those cases.
  auto newEventCount = stateData.reactTreeAttributedString.isContentEqual(
                           reactTreeAttributedString)
      ? 0
      : props.mostRecentEventCount;
  auto newAttributedString = getMostRecentAttributedString();

  setStateData(TextInputState{
      AttributedStringBox(newAttributedString),
      reactTreeAttributedString,
      props.paragraphAttributes,
      newEventCount});
}

AttributedString AndroidTextInputShadowNode::getAttributedString() const {
  // Use BaseTextShadowNode to get attributed string from children
  auto childTextAttributes = TextAttributes::defaultTextAttributes();
  childTextAttributes.apply(getConcreteProps().textAttributes);
  // Don't propagate the background color of the TextInput onto the attributed
  // string. Android tries to render shadow of the background alongside the
  // shadow of the text which results in weird artifacts.
  childTextAttributes.backgroundColor = HostPlatformColor::UndefinedColor;

  auto attributedString = AttributedString{};
  auto attachments = BaseTextShadowNode::Attachments{};
  BaseTextShadowNode::buildAttributedString(
      childTextAttributes, *this, attributedString, attachments);
  attributedString.setBaseTextAttributes(childTextAttributes);

  // BaseTextShadowNode only gets children. We must detect and prepend text
  // value attributes manually.
  if (!getConcreteProps().text.empty()) {
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.apply(getConcreteProps().textAttributes);
    auto fragment = AttributedString::Fragment{};
    fragment.string = getConcreteProps().text;
    fragment.textAttributes = textAttributes;
    // If the TextInput opacity is 0 < n < 1, the opacity of the TextInput and
    // text value's background will stack. This is a hack/workaround to prevent
    // that effect.
    fragment.textAttributes.backgroundColor = clearColor();
    fragment.parentShadowView = ShadowView(*this);
    attributedString.prependFragment(std::move(fragment));
  }

  return attributedString;
}

AttributedString AndroidTextInputShadowNode::getMostRecentAttributedString()
    const {
  const auto& state = getStateData();

  auto reactTreeAttributedString = getAttributedString();

  // Sometimes the treeAttributedString will only differ from the state
  // not by inherent properties (string or prop attributes), but by the frame of
  // the parent which has changed Thus, we can't directly compare the entire
  // AttributedString
  bool treeAttributedStringChanged =
      !state.reactTreeAttributedString.compareTextAttributesWithoutFrame(
          reactTreeAttributedString);

  return (
      !treeAttributedStringChanged ? state.attributedStringBox.getValue()
                                   : reactTreeAttributedString);
}

// For measurement purposes, we want to make sure that there's at least a
// single character in the string so that the measured height is greater
// than zero. Otherwise, empty TextInputs with no placeholder don't
// display at all.
// TODO T67606511: We will redefine the measurement of empty strings as part
// of T67606511
AttributedString AndroidTextInputShadowNode::getPlaceholderAttributedString()
    const {
  const auto& props = BaseShadowNode::getConcreteProps();

  AttributedString attributedString;
  auto placeholderString = !props.placeholder.empty()
      ? props.placeholder
      : BaseTextShadowNode::getEmptyPlaceholder();
  auto textAttributes = TextAttributes::defaultTextAttributes();
  textAttributes.apply(props.textAttributes);
  attributedString.appendFragment(
      {.string = std::move(placeholderString),
       .textAttributes = textAttributes,
       .parentShadowView = ShadowView(*this)});
  return attributedString;
}

} // namespace facebook::react
