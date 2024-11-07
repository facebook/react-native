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
#include <react/jni/ReadableNativeMap.h>

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

      const jni::global_ref<jobject>& fabricUIManager =
              contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

      static auto getScreenMetrics =
              jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
                      ->getMethod<NativeArray::javaobject(jint)>("getScreenMetrics");

      auto metrics = getScreenMetrics(fabricUIManager, -1);
      if (metrics != nullptr) {
          std::vector<double> sizes;
          auto dynamicArray = cthis(metrics)->consume();

          for (const auto& data : dynamicArray) {
              auto m = data.asDouble();
              sizes.push_back(m);
          }

          auto &modalHostViewShadowNode = dynamic_cast<ModalHostViewShadowNode &>(shadowNode);
          modalHostViewShadowNode.setScreenSize((float)sizes[0], (float)sizes[1]);
      }

    layoutableShadowNode.setSize(
        Size{stateData.screenSize.width, stateData.screenSize.height});
    layoutableShadowNode.setPositionType(YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
