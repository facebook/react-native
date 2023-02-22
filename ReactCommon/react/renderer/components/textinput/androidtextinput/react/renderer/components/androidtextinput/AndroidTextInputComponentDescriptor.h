/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputShadowNode.h"

#include <fbjni/fbjni.h>

#include <yoga/CompactValue.h>
#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>

#include <react/renderer/core/ConcreteComponentDescriptor.h>

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

    YGStyle::Edges theme;
    // TODO: figure out RTL/start/end/left/right stuff here
    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      theme = surfaceIdToThemePaddingMap_[surfaceId];
    } else {
      const jni::global_ref<jobject> &fabricUIManager =
          contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

      auto env = jni::Environment::current();
      auto defaultTextInputPaddingArray = env->NewFloatArray(4);
      static auto getThemeData =
          jni::findClassStatic(UIManagerJavaDescriptor)
              ->getMethod<jboolean(jint, jfloatArray)>("getThemeData");

      if (getThemeData(
              fabricUIManager, surfaceId, defaultTextInputPaddingArray)) {
        jfloat *defaultTextInputPadding =
            env->GetFloatArrayElements(defaultTextInputPaddingArray, 0);
        theme[YGEdgeStart] = (YGValue){defaultTextInputPadding[0], YGUnitPoint};
        theme[YGEdgeEnd] = (YGValue){defaultTextInputPadding[1], YGUnitPoint};
        theme[YGEdgeTop] = (YGValue){defaultTextInputPadding[2], YGUnitPoint};
        theme[YGEdgeBottom] =
            (YGValue){defaultTextInputPadding[3], YGUnitPoint};
        surfaceIdToThemePaddingMap_.emplace(std::make_pair(surfaceId, theme));
        env->ReleaseFloatArrayElements(
            defaultTextInputPaddingArray, defaultTextInputPadding, JNI_ABORT);
      }
      env->DeleteLocalRef(defaultTextInputPaddingArray);
    }

    return std::make_shared<AndroidTextInputShadowNode::ConcreteState>(
        std::make_shared<AndroidTextInputState const>(AndroidTextInputState(
            0,
            {},
            {},
            {},
            {},
            {},
            ((YGValue)theme[YGEdgeStart]).value,
            ((YGValue)theme[YGEdgeEnd]).value,
            ((YGValue)theme[YGEdgeTop]).value,
            ((YGValue)theme[YGEdgeBottom]).value)),
        family);
  }

 protected:
  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    auto textInputShadowNode =
        std::static_pointer_cast<AndroidTextInputShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    textInputShadowNode->setTextLayoutManager(textLayoutManager_);

    textInputShadowNode->setContextContainer(
        const_cast<ContextContainer *>(getContextContainer().get()));

    int surfaceId = textInputShadowNode->getSurfaceId();
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
  // TODO T68526882: Unify with Binding::UIManagerJavaDescriptor
  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";

  SharedTextLayoutManager textLayoutManager_;
  mutable butter::map<int, YGStyle::Edges> surfaceIdToThemePaddingMap_;
};

} // namespace react
} // namespace facebook
