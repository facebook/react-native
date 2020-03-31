/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/ConcreteComponentDescriptor.h>
#include "AndroidTextInputShadowNode.h"

#include <yoga/CompactValue.h>
#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <AndroidTextInput> component.
 */
class AndroidTextInputComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidTextInputShadowNode> {
 public:
  AndroidTextInputComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<AndroidTextInputShadowNode>(parameters) {
    // Every single `AndroidTextInputShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer_);
  }

  virtual State::Shared createInitialState(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family) const override {
    int surfaceId = family->getSurfaceId();

    float defaultThemePaddingStart = NAN;
    float defaultThemePaddingEnd = NAN;
    float defaultThemePaddingTop = NAN;
    float defaultThemePaddingBottom = NAN;

    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      YGStyle::Edges theme = surfaceIdToThemePaddingMap_[surfaceId];
      defaultThemePaddingStart = ((YGValue)theme[YGEdgeStart]).value;
      defaultThemePaddingEnd = ((YGValue)theme[YGEdgeEnd]).value;
      defaultThemePaddingTop = ((YGValue)theme[YGEdgeTop]).value;
      defaultThemePaddingBottom = ((YGValue)theme[YGEdgeBottom]).value;
    }

    return std::make_shared<AndroidTextInputShadowNode::ConcreteState>(
        std::make_shared<AndroidTextInputState const>(AndroidTextInputState(
            0,
            {},
            {},
            {},
            {},
            {},
            textLayoutManager_,
            defaultThemePaddingStart,
            defaultThemePaddingEnd,
            defaultThemePaddingTop,
            defaultThemePaddingBottom)),
        family);
  }

 protected:
  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<AndroidTextInputShadowNode>(shadowNode));
    auto textInputShadowNode =
        std::static_pointer_cast<AndroidTextInputShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    textInputShadowNode->setTextLayoutManager(textLayoutManager_);

    textInputShadowNode->setContextContainer(
        const_cast<ContextContainer *>(getContextContainer().get()));

    // Get theme padding from cache, or set it from State.
    // In theory, the Java ViewManager for TextInput should need to set state
    // *exactly once* per surface to communicate the correct default padding,
    // which will be cached here in C++.
    // TODO T63008435: can this feature be removed entirely?
    // TODO: figure out RTL/start/end/left/right stuff here
    int surfaceId = textInputShadowNode->getSurfaceId();
    const AndroidTextInputState &state = textInputShadowNode->getStateData();
    if (surfaceIdToThemePaddingMap_.find(surfaceId) ==
            surfaceIdToThemePaddingMap_.end() &&
        !isnan(state.defaultThemePaddingStart)) {
      YGStyle::Edges result;
      result[YGEdgeStart] =
          (YGValue){state.defaultThemePaddingStart, YGUnitPoint};
      result[YGEdgeEnd] = (YGValue){state.defaultThemePaddingEnd, YGUnitPoint};
      result[YGEdgeTop] = (YGValue){state.defaultThemePaddingTop, YGUnitPoint};
      result[YGEdgeBottom] =
          (YGValue){state.defaultThemePaddingBottom, YGUnitPoint};
      surfaceIdToThemePaddingMap_.emplace(std::make_pair(surfaceId, result));
    }

    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      YGStyle::Edges theme = surfaceIdToThemePaddingMap_[surfaceId];

      // Override padding
      // Node is still unsealed during adoption, before layout is complete
      // TODO: T62959168 account for RTL and paddingLeft when setting default
      // paddingStart, and vice-versa with paddingRight/paddingEnd.
      // For now this assumes no RTL.
      YGStyle::Edges result =
          textInputShadowNode->getConcreteProps().yogaStyle.padding();
      bool changedPadding = false;
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingStart &&
          !textInputShadowNode->getConcreteProps().hasPaddingLeft &&
          !textInputShadowNode->getConcreteProps().hasPaddingHorizontal) {
        changedPadding = true;
        result[YGEdgeStart] = theme[YGEdgeStart];
      }
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingEnd &&
          !textInputShadowNode->getConcreteProps().hasPaddingRight &&
          !textInputShadowNode->getConcreteProps().hasPaddingHorizontal) {
        changedPadding = true;
        result[YGEdgeEnd] = theme[YGEdgeEnd];
      }
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingTop &&
          !textInputShadowNode->getConcreteProps().hasPaddingVertical) {
        changedPadding = true;
        result[YGEdgeTop] = theme[YGEdgeTop];
      }
      if (!textInputShadowNode->getConcreteProps().hasPadding &&
          !textInputShadowNode->getConcreteProps().hasPaddingBottom &&
          !textInputShadowNode->getConcreteProps().hasPaddingVertical) {
        changedPadding = true;
        result[YGEdgeBottom] = theme[YGEdgeBottom];
      }

      // If the TextInput initially does not have paddingLeft or paddingStart, a
      // paddingStart may be set from the theme. If that happens, when there's a
      // paddingLeft update, we must explicitly unset paddingStart... (same with
      // paddingEnd)
      // TODO: support RTL
      if ((textInputShadowNode->getConcreteProps().hasPadding ||
           textInputShadowNode->getConcreteProps().hasPaddingLeft ||
           textInputShadowNode->getConcreteProps().hasPaddingHorizontal) &&
          !textInputShadowNode->getConcreteProps().hasPaddingStart) {
        result[YGEdgeStart] = YGValueUndefined;
      }
      if ((textInputShadowNode->getConcreteProps().hasPadding ||
           textInputShadowNode->getConcreteProps().hasPaddingRight ||
           textInputShadowNode->getConcreteProps().hasPaddingHorizontal) &&
          !textInputShadowNode->getConcreteProps().hasPaddingEnd) {
        result[YGEdgeEnd] = YGValueUndefined;
      }

      // Note that this is expensive: on every adopt, we need to set the Yoga
      // props again, which normally only happens during prop parsing. Every
      // commit, state update, etc, will incur this cost.
      if (changedPadding) {
        // Set new props on node
        const_cast<AndroidTextInputProps &>(
            textInputShadowNode->getConcreteProps())
            .yogaStyle.padding() = result;
        // Communicate new props to Yoga part of the node
        textInputShadowNode->updateYogaProps();
      }
    }

    textInputShadowNode->dirtyLayout();
    textInputShadowNode->enableMeasurement();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
  mutable better::map<int, YGStyle::Edges> surfaceIdToThemePaddingMap_;
};

} // namespace react
} // namespace facebook
