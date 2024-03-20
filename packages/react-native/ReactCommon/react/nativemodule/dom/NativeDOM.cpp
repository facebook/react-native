/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeDOM.h"
#include <react/renderer/uimanager/PointerEventsProcessor.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>
#include <optional>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeDOMModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeDOM>(std::move(jsInvoker));
}

namespace {
facebook::react::UIManager& getUIManagerFromRuntime(
    facebook::jsi::Runtime& runtime) {
  return facebook::react::UIManagerBinding::getBinding(runtime)->getUIManager();
}

facebook::react::PointerEventsProcessor& getPointerEventsProcessorFromRuntime(
    facebook::jsi::Runtime& runtime) {
  return facebook::react::UIManagerBinding::getBinding(runtime)
      ->getPointerEventsProcessor();
}
} // namespace

namespace facebook::react {

NativeDOM::NativeDOM(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeDOMCxxSpec(std::move(jsInvoker)) {}

std::optional<jsi::Value> NativeDOM::getParentNode(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto parentShadowNode =
      getUIManagerFromRuntime(rt).getNewestParentOfShadowNode(*shadowNode);

  // shadowNode is a RootShadowNode
  if (!parentShadowNode) {
    return std::nullopt;
  }

  return (*parentShadowNode).getInstanceHandle(rt);
}

std::optional<std::vector<jsi::Value>> NativeDOM::getChildNodes(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  auto newestCloneOfShadowNode =
      getUIManagerFromRuntime(rt).getNewestCloneOfShadowNode(*shadowNode);

  // There's no version of this node in the current shadow tree
  if (newestCloneOfShadowNode == nullptr) {
    return std::nullopt;
  }

  auto childShadowNodes = newestCloneOfShadowNode->getChildren();
  return getArrayOfInstanceHandlesFromShadowNodes(childShadowNodes, rt);
}

bool NativeDOM::isConnected(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  auto newestCloneOfShadowNode =
      getUIManagerFromRuntime(rt).getNewestCloneOfShadowNode(*shadowNode);

  return newestCloneOfShadowNode != nullptr;
}

double NativeDOM::compareDocumentPosition(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    jsi::Value otherShadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto otherShadowNode = shadowNodeFromValue(rt, otherShadowNodeValue);

  auto documentPosition = getUIManagerFromRuntime(rt).compareDocumentPosition(
      *shadowNode, *otherShadowNode);

  return documentPosition;
}

std::string NativeDOM::getTextContent(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  auto textContent =
      getUIManagerFromRuntime(rt).getTextContentInNewestCloneOfShadowNode(
          *shadowNode);

  return textContent;
}

std::optional<std::tuple<
    /* x: */ double,
    /* y: */ double,
    /* width: */ double,
    /* height: */ double>>
NativeDOM::getBoundingClientRect(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue,
    bool includeTransform) {
  auto layoutMetrics = getUIManagerFromRuntime(rt).getRelativeLayoutMetrics(
      *shadowNodeFromValue(rt, shadowNodeValue),
      nullptr,
      {/* .includeTransform = */ includeTransform,
       /* .includeViewportOffset = */ true});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return std::nullopt;
  }

  auto frame = layoutMetrics.frame;
  return std::tuple{
      frame.origin.x, frame.origin.y, frame.size.width, frame.size.height};
}

std::optional<std::tuple<
    /* offsetParent: */ jsi::Value,
    /* top: */ double,
    /* left: */ double>>
NativeDOM::getOffset(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto& uiManager = getUIManagerFromRuntime(rt);
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  auto newestCloneOfShadowNode =
      uiManager.getNewestCloneOfShadowNode(*shadowNode);
  auto newestPositionedAncestorOfShadowNode =
      uiManager.getNewestPositionedAncestorOfShadowNode(*shadowNode);
  // The node is no longer part of an active shadow tree, or it is the
  // root node
  if (newestCloneOfShadowNode == nullptr ||
      newestPositionedAncestorOfShadowNode == nullptr) {
    return std::nullopt;
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto shadowNodeLayoutMetricsRelativeToRoot =
      uiManager.getRelativeLayoutMetrics(
          *shadowNode, nullptr, {/* .includeTransform = */ false});
  if (shadowNodeLayoutMetricsRelativeToRoot == EmptyLayoutMetrics) {
    return std::nullopt;
  }

  auto positionedAncestorLayoutMetricsRelativeToRoot =
      uiManager.getRelativeLayoutMetrics(
          *newestPositionedAncestorOfShadowNode,
          nullptr,
          {/* .includeTransform = */ false});
  if (positionedAncestorLayoutMetricsRelativeToRoot == EmptyLayoutMetrics) {
    return std::nullopt;
  }

  auto shadowNodeOriginRelativeToRoot =
      shadowNodeLayoutMetricsRelativeToRoot.frame.origin;
  auto positionedAncestorOriginRelativeToRoot =
      positionedAncestorLayoutMetricsRelativeToRoot.frame.origin;

  // On the Web, offsets are computed from the inner border of the
  // parent.
  auto offsetTop = shadowNodeOriginRelativeToRoot.y -
      positionedAncestorOriginRelativeToRoot.y -
      positionedAncestorLayoutMetricsRelativeToRoot.borderWidth.top;
  auto offsetLeft = shadowNodeOriginRelativeToRoot.x -
      positionedAncestorOriginRelativeToRoot.x -
      positionedAncestorLayoutMetricsRelativeToRoot.borderWidth.left;

  return std::tuple{
      (*newestPositionedAncestorOfShadowNode).getInstanceHandle(rt),
      offsetTop,
      offsetLeft};
}

std::optional<std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>>
NativeDOM::getScrollPosition(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto& uiManager = getUIManagerFromRuntime(rt);
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  auto newestCloneOfShadowNode =
      uiManager.getNewestCloneOfShadowNode(*shadowNode);
  // The node is no longer part of an active shadow tree, or it is the
  // root node
  if (newestCloneOfShadowNode == nullptr) {
    return std::nullopt;
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
      *shadowNode, nullptr, {/* .includeTransform = */ true});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return std::nullopt;
  }

  auto layoutableShadowNode =
      dynamic_cast<LayoutableShadowNode const*>(newestCloneOfShadowNode.get());
  // This should never happen
  if (layoutableShadowNode == nullptr) {
    return std::nullopt;
  }

  auto scrollPosition = layoutableShadowNode->getContentOriginOffset();

  return std::tuple{
      scrollPosition.x == 0 ? 0 : -scrollPosition.x,
      scrollPosition.y == 0 ? 0 : -scrollPosition.y};
}

std::optional<std::tuple</* scrollWidth: */ int, /* scrollHeight */ int>>
NativeDOM::getScrollSize(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto& uiManager = getUIManagerFromRuntime(rt);
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  auto newestCloneOfShadowNode =
      uiManager.getNewestCloneOfShadowNode(*shadowNode);
  // The node is no longer part of an active shadow tree, or it is the
  // root node
  if (newestCloneOfShadowNode == nullptr) {
    return std::nullopt;
  }

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = uiManager.getRelativeLayoutMetrics(
      *shadowNode, nullptr, {/* .includeTransform = */ false});

  if (layoutMetrics == EmptyLayoutMetrics ||
      layoutMetrics.displayType == DisplayType::Inline) {
    return std::nullopt;
  }

  auto layoutableShadowNode = dynamic_cast<YogaLayoutableShadowNode const*>(
      newestCloneOfShadowNode.get());
  // This should never happen
  if (layoutableShadowNode == nullptr) {
    return std::nullopt;
  }

  Size scrollSize = getScrollableContentBounds(
                        layoutableShadowNode->getContentBounds(), layoutMetrics)
                        .size;

  return std::tuple{
      std::round(scrollSize.width), std::round(scrollSize.height)};
}

std::optional<std::tuple</* width: */ int, /* height: */ int>>
NativeDOM::getInnerSize(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = getUIManagerFromRuntime(rt).getRelativeLayoutMetrics(
      *shadowNode, nullptr, {/* .includeTransform = */ false});

  if (layoutMetrics == EmptyLayoutMetrics ||
      layoutMetrics.displayType == DisplayType::Inline) {
    return std::nullopt;
  }

  auto paddingFrame = layoutMetrics.getPaddingFrame();

  return std::tuple{
      std::round(paddingFrame.size.width),
      std::round(paddingFrame.size.height)};
}

std::optional<std::tuple<
    /* topWidth: */ int,
    /* rightWidth: */ int,
    /* bottomWidth: */ int,
    /* leftWidth: */ int>>
NativeDOM::getBorderSize(jsi::Runtime& rt, jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  // If the node is not displayed (itself or any of its ancestors has
  // "display: none"), this returns an empty layout metrics object.
  auto layoutMetrics = getUIManagerFromRuntime(rt).getRelativeLayoutMetrics(
      *shadowNode, nullptr, {/* .includeTransform = */ false});

  if (layoutMetrics == EmptyLayoutMetrics ||
      layoutMetrics.displayType == DisplayType::Inline) {
    return std::nullopt;
  }

  return std::tuple{
      std::round(layoutMetrics.borderWidth.top),
      std::round(layoutMetrics.borderWidth.right),
      std::round(layoutMetrics.borderWidth.bottom),
      std::round(layoutMetrics.borderWidth.left)};
}

std::string NativeDOM::getTagName(
    jsi::Runtime& rt,
    jsi::Value shadowNodeValue) {
  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);

  std::string canonicalComponentName = shadowNode->getComponentName();

  // FIXME(T162807327): Remove Android-specific prefixes and unify
  // shadow node implementations
  if (canonicalComponentName == "AndroidTextInput") {
    canonicalComponentName = "TextInput";
  } else if (canonicalComponentName == "AndroidSwitch") {
    canonicalComponentName = "Switch";
  }

  // Prefix with RN:
  canonicalComponentName.insert(0, "RN:");

  return canonicalComponentName;
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
