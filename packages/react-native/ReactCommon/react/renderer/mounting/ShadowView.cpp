/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowView.h"

#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/LayoutableShadowNode.h>

namespace facebook::react {

static LayoutMetrics layoutMetricsFromShadowNode(const ShadowNode& shadowNode) {
  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(&shadowNode);
  return layoutableShadowNode != nullptr
      ? layoutableShadowNode->getLayoutMetrics()
      : EmptyLayoutMetrics;
}

ShadowView::ShadowView(const ShadowNode& shadowNode)
    : componentName(shadowNode.getComponentName()),
      componentHandle(shadowNode.getComponentHandle()),
      surfaceId(shadowNode.getSurfaceId()),
      tag(shadowNode.getTag()),
      traits(shadowNode.getTraits()),
      props(shadowNode.getProps()),
      eventEmitter(shadowNode.getEventEmitter()),
      layoutMetrics(layoutMetricsFromShadowNode(shadowNode)),
      state(shadowNode.getState()) {}

bool ShadowView::operator==(const ShadowView& rhs) const {
  return std::tie(
             this->surfaceId,
             this->tag,
             this->componentName,
             this->props,
             this->eventEmitter,
             this->layoutMetrics,
             this->state) ==
      std::tie(
             rhs.surfaceId,
             rhs.tag,
             rhs.componentName,
             rhs.props,
             rhs.eventEmitter,
             rhs.layoutMetrics,
             rhs.state);
}

bool ShadowView::operator!=(const ShadowView& rhs) const {
  return !(*this == rhs);
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const ShadowView& object) {
  return object.componentHandle == 0 ? "Invalid" : object.componentName;
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const ShadowView& object,
    DebugStringConvertibleOptions options) {
  return {
      {"surfaceId", getDebugDescription(object.surfaceId, options)},
      {"tag", getDebugDescription(object.tag, options)},
      {"traits", getDebugDescription(object.traits, options)},
      {"componentName", object.componentName},
      {"props", getDebugDescription(object.props, options)},
      {"eventEmitter", getDebugDescription(object.eventEmitter, options)},
      {"layoutMetrics", getDebugDescription(object.layoutMetrics, options)},
      {"state", getDebugDescription(object.state, options)},
  };
}

#endif

} // namespace facebook::react
