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
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeDOMModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeDOM>(std::move(jsInvoker));
}

namespace facebook::react {

#pragma mark - Private helpers

static RootShadowNode::Shared getCurrentShadowTreeRevision(
    facebook::jsi::Runtime& runtime,
    SurfaceId surfaceId) {
  auto& uiManager =
      facebook::react::UIManagerBinding::getBinding(runtime)->getUIManager();
  auto shadowTreeRevisionProvider = uiManager.getShadowTreeRevisionProvider();
  return shadowTreeRevisionProvider->getCurrentRevision(surfaceId);
}

static facebook::react::PointerEventsProcessor&
getPointerEventsProcessorFromRuntime(facebook::jsi::Runtime& runtime) {
  return facebook::react::UIManagerBinding::getBinding(runtime)
      ->getPointerEventsProcessor();
}

static std::vector<facebook::jsi::Value>
getArrayOfInstanceHandlesFromShadowNodes(
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

#pragma mark - NativeDOM

NativeDOM::NativeDOM(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeDOMCxxSpec(std::move(jsInvoker)) {}

#pragma mark - Methods from the `Node` interface (for `ReadOnlyNode`).

double NativeDOM::compareDocumentPosition(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference,
    jsi::Value otherNativeNodeReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeNodeReference);
  auto otherShadowNode = shadowNodeFromValue(rt, otherNativeNodeReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (otherShadowNode == nullptr || currentRevision == nullptr) {
    return 0;
  }

  return dom::compareDocumentPosition(
      currentRevision, *shadowNode, *otherShadowNode);
}

std::vector<jsi::Value> NativeDOM::getChildNodes(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeNodeReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return std::vector<jsi::Value>{};
  }

  auto childNodes = dom::getChildNodes(currentRevision, *shadowNode);
  return getArrayOfInstanceHandlesFromShadowNodes(childNodes, rt);
}

jsi::Value NativeDOM::getParentNode(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeNodeReference);
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

bool NativeDOM::isConnected(jsi::Runtime& rt, jsi::Value nativeNodeReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeNodeReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return false;
  }

  return dom::isConnected(currentRevision, *shadowNode);
}

#pragma mark - Methods from the `Element` interface (for `ReactNativeElement`).

std::tuple<
    /* topWidth: */ int,
    /* rightWidth: */ int,
    /* bottomWidth: */ int,
    /* leftWidth: */ int>
NativeDOM::getBorderWidth(jsi::Runtime& rt, jsi::Value nativeElementReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0, 0, 0};
  }

  auto borderWidth = dom::getBorderWidth(currentRevision, *shadowNode);
  return std::tuple{
      borderWidth.top, borderWidth.right, borderWidth.bottom, borderWidth.left};
}

std::tuple<
    /* x: */ double,
    /* y: */ double,
    /* width: */ double,
    /* height: */ double>
NativeDOM::getBoundingClientRect(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    bool includeTransform) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0, 0, 0};
  }

  auto domRect = dom::getBoundingClientRect(
      currentRevision, *shadowNode, includeTransform);

  return std::tuple{domRect.x, domRect.y, domRect.width, domRect.height};
}

std::tuple</* width: */ int, /* height: */ int> NativeDOM::getInnerSize(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto innerSize = dom::getInnerSize(currentRevision, *shadowNode);
  return std::tuple{innerSize.width, innerSize.height};
}

std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>
NativeDOM::getScrollPosition(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto domPoint = dom::getScrollPosition(currentRevision, *shadowNode);
  return std::tuple{domPoint.x, domPoint.y};
}

std::tuple</* scrollWidth: */ int, /* scrollHeight */ int>
NativeDOM::getScrollSize(jsi::Runtime& rt, jsi::Value nativeElementReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto scrollSize = dom::getScrollSize(currentRevision, *shadowNode);
  return std::tuple{scrollSize.width, scrollSize.height};
}

std::string NativeDOM::getTagName(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  return dom::getTagName(*shadowNode);
}

std::string NativeDOM::getTextContent(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeNodeReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return "";
  }

  return dom::getTextContent(currentRevision, *shadowNode);
}

bool NativeDOM::hasPointerCapture(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    double pointerId) {
  bool isCapturing = getPointerEventsProcessorFromRuntime(rt).hasPointerCapture(
      pointerId, shadowNodeFromValue(rt, nativeElementReference).get());
  return isCapturing;
}

void NativeDOM::releasePointerCapture(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    double pointerId) {
  getPointerEventsProcessorFromRuntime(rt).releasePointerCapture(
      pointerId, shadowNodeFromValue(rt, nativeElementReference).get());
}

void NativeDOM::setPointerCapture(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    double pointerId) {
  getPointerEventsProcessorFromRuntime(rt).setPointerCapture(
      pointerId, shadowNodeFromValue(rt, nativeElementReference));
}

#pragma mark - Methods from the `HTMLElement` interface (for `ReactNativeElement`).

std::tuple<
    /* offsetParent: */ jsi::Value,
    /* top: */ double,
    /* left: */ double>
NativeDOM::getOffset(jsi::Runtime& rt, jsi::Value nativeElementReference) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
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

#pragma mark - Legacy layout APIs (for `ReactNativeElement`).

void NativeDOM::measure(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    jsi::Function callback) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    callback.call(rt, {0, 0, 0, 0, 0, 0});
    return;
  }

  auto measureRect = dom::measure(currentRevision, *shadowNode);

  callback.call(
      rt,
      {jsi::Value{rt, measureRect.x},
       jsi::Value{rt, measureRect.y},
       jsi::Value{rt, measureRect.width},
       jsi::Value{rt, measureRect.height},
       jsi::Value{rt, measureRect.pageX},
       jsi::Value{rt, measureRect.pageY}});
}

void NativeDOM::measureInWindow(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    jsi::Function callback) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    callback.call(rt, {0, 0, 0, 0});
    return;
  }

  auto rect = dom::measureInWindow(currentRevision, *shadowNode);
  callback.call(
      rt,
      {jsi::Value{rt, rect.x},
       jsi::Value{rt, rect.y},
       jsi::Value{rt, rect.width},
       jsi::Value{rt, rect.height}});
}

void NativeDOM::measureLayout(
    jsi::Runtime& rt,
    jsi::Value nativeElementReference,
    jsi::Value relativeToNativeElementReference,
    jsi::Function onFail,
    jsi::Function onSuccess) {
  auto shadowNode = shadowNodeFromValue(rt, nativeElementReference);
  auto relativeToShadowNode =
      shadowNodeFromValue(rt, relativeToNativeElementReference);
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    onFail.call(rt);
    return;
  }

  auto maybeRect =
      dom::measureLayout(currentRevision, *shadowNode, *relativeToShadowNode);

  if (!maybeRect) {
    onFail.call(rt);
    return;
  }

  auto rect = maybeRect.value();

  onSuccess.call(
      rt,
      {jsi::Value{rt, rect.x},
       jsi::Value{rt, rect.y},
       jsi::Value{rt, rect.width},
       jsi::Value{rt, rect.height}});
}

} // namespace facebook::react
