/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ParagraphShadowNode.h"

#include <react/config/ReactNativeConfig.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/view/ViewPropsInterpolation.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final
    : public ConcreteComponentDescriptor<ParagraphShadowNode> {
 public:
  ParagraphComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<ParagraphShadowNode>(parameters) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer_);
  }

  virtual SharedProps interpolateProps(
      float animationProgress,
      const SharedProps &props,
      const SharedProps &newProps) const override {
    SharedProps interpolatedPropsShared = cloneProps(newProps, {});

    interpolateViewProps(
        animationProgress, props, newProps, interpolatedPropsShared);

    return interpolatedPropsShared;
  };

 protected:
  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    react_native_assert(
        std::dynamic_pointer_cast<ParagraphShadowNode>(shadowNode));
    auto paragraphShadowNode =
        std::static_pointer_cast<ParagraphShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode->setTextLayoutManager(textLayoutManager_);
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
};

} // namespace react
} // namespace facebook
