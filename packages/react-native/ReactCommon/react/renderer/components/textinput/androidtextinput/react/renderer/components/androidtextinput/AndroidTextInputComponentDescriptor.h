/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputShadowNode.h"

#include <fbjni/fbjni.h>

#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>
#include <yoga/style/CompactValue.h>

#include <unordered_map>

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <AndroidTextInput> component.
 */
class AndroidTextInputComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidTextInputShadowNode> {
 public:
  AndroidTextInputComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor<AndroidTextInputShadowNode>(parameters) {
    // Every single `AndroidTextInputShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer_);
  }

  virtual State::Shared createInitialState(
      const Props::Shared& props,
      const ShadowNodeFamily::Shared& family) const override {
    int surfaceId = family->getSurfaceId();

    ThemePadding theme;
    // TODO: figure out RTL/start/end/left/right stuff here
    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      theme = surfaceIdToThemePaddingMap_[surfaceId];
    } else {
      const jni::global_ref<jobject>& fabricUIManager =
          contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

      auto env = jni::Environment::current();
      auto defaultTextInputPaddingArray = env->NewFloatArray(4);
      static auto getThemeData =
          jni::findClassStatic(UIManagerJavaDescriptor)
              ->getMethod<jboolean(jint, jfloatArray)>("getThemeData");

      if (getThemeData(
              fabricUIManager, surfaceId, defaultTextInputPaddingArray)) {
        jfloat* defaultTextInputPadding =
            env->GetFloatArrayElements(defaultTextInputPaddingArray, 0);

        theme.start =
            yoga::CompactValue::of<YGUnitPoint>(defaultTextInputPadding[0]);
        theme.end =
            yoga::CompactValue::of<YGUnitPoint>(defaultTextInputPadding[1]);
        theme.top =
            yoga::CompactValue::of<YGUnitPoint>(defaultTextInputPadding[2]);
        theme.bottom =
            yoga::CompactValue::of<YGUnitPoint>(defaultTextInputPadding[3]);

        surfaceIdToThemePaddingMap_.emplace(std::make_pair(surfaceId, theme));
        env->ReleaseFloatArrayElements(
            defaultTextInputPaddingArray, defaultTextInputPadding, JNI_ABORT);
      }
      env->DeleteLocalRef(defaultTextInputPaddingArray);
    }

    return std::make_shared<AndroidTextInputShadowNode::ConcreteState>(
        std::make_shared<const AndroidTextInputState>(AndroidTextInputState(
            0,
            {},
            {},
            {},
            ((YGValue)theme.start).value,
            ((YGValue)theme.end).value,
            ((YGValue)theme.top).value,
            ((YGValue)theme.bottom).value)),
        family);
  }

 protected:
  void adopt(ShadowNode& shadowNode) const override {
    auto& textInputShadowNode =
        static_cast<AndroidTextInputShadowNode&>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    textInputShadowNode.setTextLayoutManager(textLayoutManager_);

    textInputShadowNode.setContextContainer(
        const_cast<ContextContainer*>(getContextContainer().get()));

    int surfaceId = textInputShadowNode.getSurfaceId();
    if (surfaceIdToThemePaddingMap_.find(surfaceId) !=
        surfaceIdToThemePaddingMap_.end()) {
      ThemePadding theme = surfaceIdToThemePaddingMap_[surfaceId];

      auto& textInputProps = textInputShadowNode.getConcreteProps();

      // Override padding
      // Node is still unsealed during adoption, before layout is complete
      // TODO: T62959168 account for RTL and paddingLeft when setting default
      // paddingStart, and vice-versa with paddingRight/paddingEnd.
      // For now this assumes no RTL.
      ThemePadding result{
          .start = textInputProps.yogaStyle.padding(YGEdgeStart),
          .end = textInputProps.yogaStyle.padding(YGEdgeEnd),
          .top = textInputProps.yogaStyle.padding(YGEdgeTop),
          .bottom = textInputProps.yogaStyle.padding(YGEdgeBottom)};

      bool changedPadding = false;
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingStart &&
          !textInputProps.hasPaddingLeft &&
          !textInputProps.hasPaddingHorizontal) {
        changedPadding = true;
        result.start = theme.start;
      }
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingEnd &&
          !textInputProps.hasPaddingRight &&
          !textInputProps.hasPaddingHorizontal) {
        changedPadding = true;
        result.end = theme.end;
      }
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingTop &&
          !textInputProps.hasPaddingVertical) {
        changedPadding = true;
        result.top = theme.top;
      }
      if (!textInputProps.hasPadding && !textInputProps.hasPaddingBottom &&
          !textInputProps.hasPaddingVertical) {
        changedPadding = true;
        result.bottom = theme.bottom;
      }

      // If the TextInput initially does not have paddingLeft or paddingStart, a
      // paddingStart may be set from the theme. If that happens, when there's a
      // paddingLeft update, we must explicitly unset paddingStart... (same with
      // paddingEnd)
      // TODO: support RTL
      if ((textInputProps.hasPadding || textInputProps.hasPaddingLeft ||
           textInputProps.hasPaddingHorizontal) &&
          !textInputProps.hasPaddingStart) {
        result.start = yoga::CompactValue::ofUndefined();
      }
      if ((textInputProps.hasPadding || textInputProps.hasPaddingRight ||
           textInputProps.hasPaddingHorizontal) &&
          !textInputProps.hasPaddingEnd) {
        result.end = yoga::CompactValue::ofUndefined();
      }

      // Note that this is expensive: on every adopt, we need to set the Yoga
      // props again, which normally only happens during prop parsing. Every
      // commit, state update, etc, will incur this cost.
      if (changedPadding) {
        // Set new props on node
        yoga::Style& style =
            const_cast<AndroidTextInputProps&>(textInputProps).yogaStyle;
        style.setPadding(YGEdgeStart, result.start);
        style.setPadding(YGEdgeEnd, result.end);
        style.setPadding(YGEdgeTop, result.top);
        style.setPadding(YGEdgeBottom, result.bottom);

        // Communicate new props to Yoga part of the node
        textInputShadowNode.updateYogaProps();
      }
    }

    textInputShadowNode.dirtyLayout();
    textInputShadowNode.enableMeasurement();

    ConcreteComponentDescriptor::adopt(shadowNode);
  }

 private:
  struct ThemePadding {
    yoga::CompactValue start;
    yoga::CompactValue end;
    yoga::CompactValue top;
    yoga::CompactValue bottom;
  };

  // TODO T68526882: Unify with Binding::UIManagerJavaDescriptor
  constexpr static auto UIManagerJavaDescriptor =
      "com/facebook/react/fabric/FabricUIManager";

  SharedTextLayoutManager textLayoutManager_;
  mutable std::unordered_map<int, ThemePadding> surfaceIdToThemePaddingMap_;
};

} // namespace facebook::react
