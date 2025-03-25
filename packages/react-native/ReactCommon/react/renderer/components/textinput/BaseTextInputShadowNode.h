/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/components/textinput/BaseTextInputProps.h>
#include <react/renderer/components/textinput/TextInputState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/YogaLayoutableShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

/*
 * Base `ShadowNode` for <TextInput> component.
 */
template <
    const char* concreteComponentName,
    typename ViewPropsT,
    typename ViewEventEmitterT,
    typename StateDataT,
    bool usesMapBufferForStateData = false>
class BaseTextInputShadowNode : public ConcreteViewShadowNode<
                                    concreteComponentName,
                                    ViewPropsT,
                                    ViewEventEmitterT,
                                    StateDataT,
                                    usesMapBufferForStateData>,
                                public BaseTextShadowNode {
 public:
  using BaseShadowNode = ConcreteViewShadowNode<
      concreteComponentName,
      ViewPropsT,
      ViewEventEmitterT,
      StateDataT,
      usesMapBufferForStateData>;

  using BaseShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = BaseShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    traits.set(ShadowNodeTraits::Trait::BaselineYogaNode);
    return traits;
  }

  /*
   * Associates a shared `TextLayoutManager` with the node.
   * `TextInputShadowNode` uses the manager to measure text content
   * and construct `TextInputState` objects.
   */
  void setTextLayoutManager(
      std::shared_ptr<const TextLayoutManager> textLayoutManager) {
    Sealable::ensureUnsealed();
    textLayoutManager_ = std::move(textLayoutManager);
  }

 protected:
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override {
    const auto& props = BaseShadowNode::getConcreteProps();
    auto textConstraints = getTextConstraints(layoutConstraints);

    TextLayoutContext textLayoutContext{
        .pointScaleFactor = layoutContext.pointScaleFactor};
    auto textSize = textLayoutManager_
                        ->measure(
                            attributedStringBoxToMeasure(layoutContext),
                            props.paragraphAttributes,
                            textLayoutContext,
                            textConstraints)
                        .size;

    return layoutConstraints.clamp(textSize);
  }

  void layout(LayoutContext layoutContext) override {
    updateStateIfNeeded(layoutContext);
    BaseShadowNode::layout(layoutContext);
  }

  Float baseline(const LayoutContext& layoutContext, Size size) const override {
    const auto& props = BaseShadowNode::getConcreteProps();
    auto attributedString = getAttributedString(layoutContext);

    if (attributedString.isEmpty()) {
      attributedString = getPlaceholderAttributedString(layoutContext);
    }

    // Yoga expects a baseline relative to the Node's border-box edge instead of
    // the content, so we need to adjust by the padding and border widths, which
    // have already been set by the time of baseline alignment
    auto top = YGNodeLayoutGetBorder(
                   &(YogaLayoutableShadowNode::yogaNode_), YGEdgeTop) +
        YGNodeLayoutGetPadding(
                   &(YogaLayoutableShadowNode::yogaNode_), YGEdgeTop);

    AttributedStringBox attributedStringBox{attributedString};
    return textLayoutManager_->baseline(
               attributedStringBox, props.paragraphAttributes, size) +
        top;
  }

  /*
   * Determines the constraints to use while measure the underlying text
   */
  LayoutConstraints getTextConstraints(
      const LayoutConstraints& layoutConstraints) const {
    if (BaseShadowNode::getConcreteProps().multiline) {
      return layoutConstraints;
    } else {
      // A single line TextInput acts as a horizontal scroller of infinitely
      // expandable text, so we want to measure the text as if it is allowed to
      // infinitely expand horizontally, and later clamp to the constraints of
      // the input.
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

  std::shared_ptr<const TextLayoutManager> textLayoutManager_;

 private:
  /*
   * Creates a `State` object if needed.
   */
  void updateStateIfNeeded(const LayoutContext& layoutContext) {
    Sealable::ensureUnsealed();
    const auto& stateData = BaseShadowNode::getStateData();
    const auto& reactTreeAttributedString = getAttributedString(layoutContext);

    if (stateData.reactTreeAttributedString.isContentEqual(
            reactTreeAttributedString)) {
      return;
    }

    const auto& props = BaseShadowNode::getConcreteProps();
    BaseShadowNode::setStateData(TextInputState{
        AttributedStringBox{reactTreeAttributedString},
        reactTreeAttributedString,
        props.paragraphAttributes,
        props.mostRecentEventCount});
  }

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString(
      const LayoutContext& layoutContext) const {
    const auto& props = BaseShadowNode::getConcreteProps();
    const auto textAttributes =
        props.getEffectiveTextAttributes(layoutContext.fontSizeMultiplier);

    AttributedString attributedString;
    attributedString.appendFragment(AttributedString::Fragment{
        .string = props.text,
        .textAttributes = textAttributes,
        .parentShadowView = ShadowView(*this)});

    auto attachments = BaseTextShadowNode::Attachments{};
    BaseTextShadowNode::buildAttributedString(
        textAttributes, *this, attributedString, attachments);
    attributedString.setBaseTextAttributes(textAttributes);
    return attributedString;
  }

  /*
   * Returns an `AttributedStringBox` which represents text content that should
   * be used for measuring purposes. It might contain actual text value,
   * placeholder value or some character that represents the size of the font.
   */
  AttributedStringBox attributedStringBoxToMeasure(
      const LayoutContext& layoutContext) const {
    bool meaningfulState = BaseShadowNode::getState() &&
        BaseShadowNode::getState()->getRevision() !=
            State::initialRevisionValue;
    if (meaningfulState) {
      const auto& stateData = BaseShadowNode::getStateData();
      auto attributedStringBox = stateData.attributedStringBox;
      if (attributedStringBox.getMode() ==
              AttributedStringBox::Mode::OpaquePointer ||
          !attributedStringBox.getValue().isEmpty()) {
        return stateData.attributedStringBox;
      }
    }

    auto attributedString = meaningfulState
        ? AttributedString{}
        : getAttributedString(layoutContext);

    if (attributedString.isEmpty()) {
      attributedString = getPlaceholderAttributedString(layoutContext);
    }
    return AttributedStringBox{attributedString};
  }

  // For measurement purposes, we want to make sure that there's at least a
  // single character in the string so that the measured height is greater
  // than zero. Otherwise, empty TextInputs with no placeholder don't
  // display at all.
  // TODO T67606511: We will redefine the measurement of empty strings as part
  // of T67606511
  AttributedString getPlaceholderAttributedString(
      const LayoutContext& layoutContext) const {
    const auto& props = BaseShadowNode::getConcreteProps();

    AttributedString attributedString;
    auto placeholderString = !props.placeholder.empty()
        ? props.placeholder
        : BaseTextShadowNode::getEmptyPlaceholder();
    auto textAttributes =
        props.getEffectiveTextAttributes(layoutContext.fontSizeMultiplier);
    attributedString.appendFragment(
        {.string = std::move(placeholderString),
         .textAttributes = textAttributes,
         .parentShadowView = {}});
    return attributedString;
  }
};

} // namespace facebook::react
