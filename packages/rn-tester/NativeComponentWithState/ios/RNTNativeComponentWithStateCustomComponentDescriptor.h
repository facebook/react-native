/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "RNTNativeComponentWithStateCustomShadowNode.h"

namespace facebook {
namespace react {

/*
 * Descriptor for <RNTNativeComponentWithStateCustomComponentDescriptor>
 * component.
 */
class RNTNativeComponentWithStateCustomComponentDescriptor final
    : public ConcreteComponentDescriptor<
          RNTNativeComponentWithStateCustomShadowNode> {
 public:
  RNTNativeComponentWithStateCustomComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        imageManager_(std::make_shared<ImageManager>(contextContainer_)) {}

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto compShadowNode =
        std::static_pointer_cast<RNTNativeComponentWithStateCustomShadowNode>(
            shadowNode);

    // `RNTNativeComponentWithStateCustomShadowNode` uses `ImageManager` to
    // initiate image loading and communicate the loading state
    // and results to mounting layer.
    compShadowNode->setImageManager(imageManager_);
  }

 private:
  const SharedImageManager imageManager_;
};

} // namespace react
} // namespace facebook
