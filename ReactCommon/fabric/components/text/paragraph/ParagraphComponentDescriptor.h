/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ParagraphMeasurementCache.h"
#include "ParagraphShadowNode.h"

#include <folly/container/EvictingCacheMap.h>
#include <react/core/ConcreteComponentDescriptor.h>
#include <react/textlayoutmanager/TextLayoutManager.h>
#include <react/uimanager/ContextContainer.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final
    : public ConcreteComponentDescriptor<ParagraphShadowNode> {
 public:
  ParagraphComponentDescriptor(
      SharedEventDispatcher eventDispatcher,
      const SharedContextContainer &contextContainer)
      : ConcreteComponentDescriptor<ParagraphShadowNode>(eventDispatcher) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer);
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `EvictingCacheMap`, a simple LRU cache for Paragraph
    // measurements.
#ifdef ANDROID
    auto paramName = "react_fabric:enabled_paragraph_measure_cache_android";
#else
    auto paramName = "react_fabric:enabled_paragraph_measure_cache_ios";
#endif
    // TODO: T39927960 - get rid of this if statement
    bool enableCache =
        (contextContainer != nullptr
             ? contextContainer
                   ->getInstance<std::shared_ptr<const ReactNativeConfig>>(
                       "ReactNativeConfig")
                   ->getBool(paramName)
             : false);
    if (enableCache) {
      measureCache_ = std::make_unique<ParagraphMeasurementCache>();
    } else {
      measureCache_ = nullptr;
    }
  }

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ParagraphShadowNode>(shadowNode));
    auto paragraphShadowNode =
        std::static_pointer_cast<ParagraphShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode->setTextLayoutManager(textLayoutManager_);

    // `ParagraphShadowNode` uses this to cache the results of text rendering
    // measurements.
    paragraphShadowNode->setMeasureCache(
        measureCache_ ? measureCache_.get() : nullptr);

    // All `ParagraphShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    paragraphShadowNode->enableMeasurement();
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
  std::unique_ptr<const ParagraphMeasurementCache> measureCache_;
};

} // namespace react
} // namespace facebook
