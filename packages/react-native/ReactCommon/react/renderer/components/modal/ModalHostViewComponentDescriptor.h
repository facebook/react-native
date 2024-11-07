/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/renderer/components/modal/ModalHostViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

#ifdef ANDROID
#include <react/jni/ReadableNativeMap.h>
#endif

namespace facebook::react {

/*
 * Descriptor for <ModalHostView> component.
 */

class ModalHostViewComponentDescriptor final
    : public ConcreteComponentDescriptor<ModalHostViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode& shadowNode) const override {
    auto& layoutableShadowNode =
        static_cast<YogaLayoutableShadowNode&>(shadowNode);
    auto& stateData =
        static_cast<const ModalHostViewShadowNode::ConcreteState&>(
            *shadowNode.getState())
            .getData();

#ifdef ANDROID
    const jni::global_ref<jobject>& fabricUIManager =
            contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

    static auto getDisplaySizes =
            jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
                    ->getMethod<NativeMap::javaobject(jint)>("getDisplaySizes");

    auto sizes = getDisplaySizes(fabricUIManager, -1);
    if (sizes != nullptr) {
        auto dynamicMap = cthis(sizes)->consume();
        auto height = static_cast<Float>(dynamicMap.getDefault("height", 0).getDouble());
        auto width = static_cast<Float>(dynamicMap.getDefault("width", 0).getDouble());

        auto &modalHostViewShadowNode = dynamic_cast<ModalHostViewShadowNode &>(shadowNode);
        modalHostViewShadowNode.setScreenSize(width, height);
    }
#endif

    layoutableShadowNode.setSize(
        Size{stateData.screenSize.width, stateData.screenSize.height});
    layoutableShadowNode.setPositionType(YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
