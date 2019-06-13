// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ShadowView.h"

#include <react/core/LayoutableShadowNode.h>

namespace facebook {
namespace react {

static LayoutMetrics layoutMetricsFromShadowNode(const ShadowNode &shadowNode) {
  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(&shadowNode);
  return layoutableShadowNode ? layoutableShadowNode->getLayoutMetrics()
                              : EmptyLayoutMetrics;
}

ShadowView::ShadowView(const ShadowNode &shadowNode)
    : componentName(shadowNode.getComponentName()),
      componentHandle(shadowNode.getComponentHandle()),
      tag(shadowNode.getTag()),
      props(shadowNode.getProps()),
      eventEmitter(shadowNode.getEventEmitter()),
      layoutMetrics(layoutMetricsFromShadowNode(shadowNode)),
      localData(shadowNode.getLocalData()) {}

bool ShadowView::operator==(const ShadowView &rhs) const {
  return std::tie(
             this->tag,
             this->componentName,
             this->props,
             this->eventEmitter,
             this->layoutMetrics,
             this->localData) ==
      std::tie(
             rhs.tag,
             rhs.componentName,
             rhs.props,
             rhs.eventEmitter,
             rhs.layoutMetrics,
             rhs.localData);
}

bool ShadowView::operator!=(const ShadowView &rhs) const {
  return !(*this == rhs);
}

bool ShadowViewNodePair::operator==(const ShadowViewNodePair &rhs) const {
  return &this->shadowNode == &rhs.shadowNode;
}

bool ShadowViewNodePair::operator!=(const ShadowViewNodePair &rhs) const {
  return !(*this == rhs);
}

} // namespace react
} // namespace facebook
