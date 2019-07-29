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
      localData(shadowNode.getLocalData()),
      state(shadowNode.getState()) {}

bool ShadowView::operator==(const ShadowView &rhs) const {
  return std::tie(
             this->tag,
             this->componentName,
             this->props,
             this->eventEmitter,
             this->layoutMetrics,
             this->localData,
             this->state) ==
      std::tie(
             rhs.tag,
             rhs.componentName,
             rhs.props,
             rhs.eventEmitter,
             rhs.layoutMetrics,
             rhs.localData,
             rhs.state);
}

bool ShadowView::operator!=(const ShadowView &rhs) const {
  return !(*this == rhs);
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowView const &object) {
  return object.componentHandle == 0 ? "Invalid" : object.componentName;
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowView const &object,
    DebugStringConvertibleOptions options) {
  return {
      {"tag", getDebugDescription(object.tag, options)},
      {"props", getDebugDescription(object.props, options)},
      {"eventEmitter", getDebugDescription(object.eventEmitter, options)},
      {"layoutMetrics", getDebugDescription(object.layoutMetrics, options)},
      {"localData", getDebugDescription(object.localData, options)},
      {"state", getDebugDescription(object.state, options)},
  };
}

#endif

bool ShadowViewNodePair::operator==(const ShadowViewNodePair &rhs) const {
  return this->shadowNode == rhs.shadowNode;
}

bool ShadowViewNodePair::operator!=(const ShadowViewNodePair &rhs) const {
  return !(*this == rhs);
}

} // namespace react
} // namespace facebook
