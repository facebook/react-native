/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeDOM.h"
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/dom/DOM.h>
#include <react/renderer/uimanager/PointerEventsProcessor.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeDOMModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeDOM>(std::move(jsInvoker));
}

namespace {
using namespace facebook::react;

RootShadowNode::Shared getCurrentShadowTreeRevision(
    facebook::jsi::Runtime& runtime,
    SurfaceId surfaceId) {
  auto& uiManager =
      facebook::react::UIManagerBinding::getBinding(runtime)->getUIManager();
  auto shadowTreeRevisionProvider = uiManager.getShadowTreeRevisionProvider();
  return shadowTreeRevisionProvider->getCurrentRevision(surfaceId);
}

facebook::react::PointerEventsProcessor& getPointerEventsProcessorFromRuntime(
    facebook::jsi::Runtime& runtime) {
  return facebook::react::UIManagerBinding::getBinding(runtime)
      ->getPointerEventsProcessor();
}

std::vector<facebook::jsi::Value> getArrayOfInstanceHandlesFromShadowNodes(
    const ShadowNode::ListOfShared& nodes,
    facebook::jsi::Runtime& runtime) {
  // JSI doesn't support adding elements to an array after creation,
  // so we need to accumulate the values in a vector and then create
  // the array when we know the size.
  std::vector<facebook::jsi::Value> nonNullInstanceHandles;
  nonNullInstanceHandles.reserve(nodes.size());
  for (const auto& shadowNode : nodes) {
    auto instanceHandle = (*shadowNode).getInstanceHandle(runtime);
    if (!instanceHandle.isNull()) {
      nonNullInstanceHandles.push_back(std::move(instanceHandle));
    }
  }

  return nonNullInstanceHandles;
}
} // namespace

namespace facebook::react {

NativeDOM::NativeDOM(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeDOMCxxSpec(std::move(jsInvoker)) {}

jsi::Value NativeDOM::getParentNode(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return jsi::Value::undefined();
  }

  auto parentShadowNode = dom::getParentNode(currentRevision, *shadowNode);
  if (parentShadowNode == nullptr) {
    return jsi::Value::undefined();
  }

  return parentShadowNode->getInstanceHandle(rt);
}

std::vector<jsi::Value> NativeDOM::getChildNodes(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return std::vector<jsi::Value>{};
  }

  auto childNodes = dom::getChildNodes(currentRevision, *shadowNode);
  return getArrayOfInstanceHandlesFromShadowNodes(childNodes, rt);
}

bool NativeDOM::isConnected(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return false;
  }

  return dom::isConnected(currentRevision, *shadowNode);
}

double NativeDOM::compareDocumentPosition(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    jsi::Value otherShadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto otherShadowNode = shadowNodeFromValue(rt, otherShadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (otherShadowNode == nullptr || currentRevision == nullptr) {
    return 0;
  }

  return dom::compareDocumentPosition(
      currentRevision, *shadowNode, *otherShadowNode);
}

std::string NativeDOM::getTextContent(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return "";
  }

  return dom::getTextContent(currentRevision, *shadowNode);
}

std::tuple<
    /* x: */ double,
    /* y: */ double,
    /* width: */ double,
    /* height: */ double>
NativeDOM::getBoundingClientRect(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    bool includeTransform) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0, 0, 0};
  }

  auto domRect = dom::getBoundingClientRect(
      currentRevision, *shadowNode, includeTransform);

  return std::tuple{domRect.x, domRect.y, domRect.width, domRect.height};
}

std::tuple<
    /* offsetParent: */ jsi::Value,
    /* top: */ double,
    /* left: */ double>
NativeDOM::getOffset(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {jsi::Value::undefined(), 0, 0};
  }

  auto domOffset = dom::getOffset(currentRevision, *shadowNode);

  return std::tuple{
      domOffset.offsetParent == nullptr
          ? jsi::Value::undefined()
          : domOffset.offsetParent->getInstanceHandle(rt),
      domOffset.top,
      domOffset.left};
}

std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>
NativeDOM::getScrollPosition(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto domPoint = dom::getScrollPosition(currentRevision, *shadowNode);
  return std::tuple{domPoint.x, domPoint.y};
}

std::tuple</* scrollWidth: */ int, /* scrollHeight */ int>
NativeDOM::getScrollSize(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto scrollSize = dom::getScrollSize(currentRevision, *shadowNode);
  return std::tuple{scrollSize.width, scrollSize.height};
}

std::tuple</* width: */ int, /* height: */ int> NativeDOM::getInnerSize(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto innerSize = dom::getInnerSize(currentRevision, *shadowNode);
  return std::tuple{innerSize.width, innerSize.height};
}

std::tuple<
    /* topWidth: */ int,
    /* rightWidth: */ int,
    /* bottomWidth: */ int,
    /* leftWidth: */ int>
NativeDOM::getBorderWidth(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0, 0, 0};
  }

  auto borderWidth = dom::getBorderWidth(currentRevision, *shadowNode);
  return std::tuple{
      borderWidth.top, borderWidth.right, borderWidth.bottom, borderWidth.left};
}

std::string NativeDOM::getTagName(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  return dom::getTagName(*shadowNode);
}

bool NativeDOM::hasPointerCapture(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    double pointerId) {
  bool isCapturing = getPointerEventsProcessorFromRuntime(rt).hasPointerCapture(
      pointerId, shadowNodeFromValue(rt, shadowNodeValue).get());
  return isCapturing;
}

void NativeDOM::setPointerCapture(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    double pointerId) {
  getPointerEventsProcessorFromRuntime(rt).setPointerCapture(
      pointerId, shadowNodeFromValue(rt, shadowNodeValue));
}

void NativeDOM::releasePointerCapture(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    double pointerId) {
  getPointerEventsProcessorFromRuntime(rt).releasePointerCapture(
      pointerId, shadowNodeFromValue(rt, shadowNodeValue).get());
}

} // namespace facebook::react
