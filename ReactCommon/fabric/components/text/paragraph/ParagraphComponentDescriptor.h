/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/text/ParagraphShadowNode.h>
#include <fabric/core/ConcreteComponentDescriptor.h>
#include <fabric/textlayoutmanager/TextLayoutManager.h>
#include <fabric/uimanager/ContextContainer.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final:
  public ConcreteComponentDescriptor<ParagraphShadowNode> {

public:

  ParagraphComponentDescriptor(SharedEventDispatcher eventDispatcher, const SharedContextContainer &contextContainer):
    ConcreteComponentDescriptor<ParagraphShadowNode>(eventDispatcher) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer);
  }

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ParagraphShadowNode>(shadowNode));
    auto paragraphShadowNode = std::static_pointer_cast<ParagraphShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode->setTextLayoutManager(textLayoutManager_);

    // All `ParagraphShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    paragraphShadowNode->enableMeasurement();
  }

private:

  SharedTextLayoutManager textLayoutManager_;
};

} // namespace react
} // namespace facebook
