/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/text/RawTextShadowNode.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Rect.h>

namespace facebook::react {

using BackgroundExecutor =
    std::function<void(std::function<void()>&& callback)>;

struct ShadowNodeListWrapper : public jsi::NativeState {
  ShadowNodeListWrapper(ShadowNode::UnsharedListOfShared shadowNodeList)
      : shadowNodeList(std::move(shadowNodeList)) {}

  // The below method needs to be implemented out-of-line in order for the class
  // to have at least one "key function" (see
  // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#vague-vtable)
  ~ShadowNodeListWrapper() override;

  ShadowNode::UnsharedListOfShared shadowNodeList;
};

inline static ShadowNode::Shared shadowNodeFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  if (value.isNull()) {
    return nullptr;
  }

  return value.getObject(runtime).getNativeState<ShadowNode>(runtime);
}

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime& runtime,
    ShadowNode::Shared shadowNode) {
  jsi::Object obj(runtime);
  // Need to const_cast since JSI only allows non-const pointees
  obj.setNativeState(
      runtime, std::const_pointer_cast<ShadowNode>(std::move(shadowNode)));
  return obj;
}

// TODO: once we no longer need to mutate the return value (appendChildToSet)
// make this a SharedListOfShared
inline static ShadowNode::UnsharedListOfShared shadowNodeListFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  // TODO: cleanup when passChildrenWhenCloningPersistedNodes is rolled out
  jsi::Object object = value.asObject(runtime);
  if (object.isArray(runtime)) {
    auto jsArray = std::move(object).asArray(runtime);
    size_t jsArrayLen = jsArray.length(runtime);
    if (jsArrayLen > 0) {
      auto shadowNodeArray = std::make_shared<ShadowNode::ListOfShared>();
      shadowNodeArray->reserve(jsArrayLen);

      for (size_t i = 0; i < jsArrayLen; i++) {
        shadowNodeArray->push_back(
            shadowNodeFromValue(runtime, jsArray.getValueAtIndex(runtime, i)));
      }
      return shadowNodeArray;
    } else {
      // TODO: return ShadowNode::emptySharedShadowNodeSharedList()
      return std::make_shared<ShadowNode::ListOfShared>(
          ShadowNode::ListOfShared({}));
      ;
    }
  } else {
    return object.getNativeState<ShadowNodeListWrapper>(runtime)
        ->shadowNodeList;
  }
}

inline static jsi::Value valueFromShadowNodeList(
    jsi::Runtime& runtime,
    ShadowNode::UnsharedListOfShared shadowNodeList) {
  auto wrapper =
      std::make_shared<ShadowNodeListWrapper>(std::move(shadowNodeList));
  // Use the wrapper for NativeState too, otherwise we can't implement
  // the marker interface. Could be simplified to a simple struct wrapper.
  jsi::Object obj(runtime);
  obj.setNativeState(runtime, std::move(wrapper));
  return obj;
}

inline static ShadowNode::UnsharedListOfShared shadowNodeListFromWeakList(
    const ShadowNode::UnsharedListOfWeak& weakShadowNodeList) {
  auto result = std::make_shared<ShadowNode::ListOfShared>();
  for (const auto& weakShadowNode : *weakShadowNodeList) {
    auto sharedShadowNode = weakShadowNode.lock();
    if (!sharedShadowNode) {
      return nullptr;
    }
    result->push_back(sharedShadowNode);
  }
  return result;
}

inline static ShadowNode::UnsharedListOfWeak weakShadowNodeListFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  auto shadowNodeList = shadowNodeListFromValue(runtime, value);
  auto weakShadowNodeList = std::make_shared<ShadowNode::ListOfWeak>();
  for (const auto& shadowNode : *shadowNodeList) {
    weakShadowNodeList->push_back(shadowNode);
  }
  return weakShadowNodeList;
}

inline static Tag tagFromValue(const jsi::Value& value) {
  return (Tag)value.getNumber();
}

inline static InstanceHandle::Shared instanceHandleFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& instanceHandleValue,
    const jsi::Value& tagValue) {
  react_native_assert(!instanceHandleValue.isNull());
  if (instanceHandleValue.isNull()) {
    return nullptr;
  }
  return std::make_shared<InstanceHandle>(
      runtime, instanceHandleValue, tagFromValue(tagValue));
}

inline static SurfaceId surfaceIdFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  return (SurfaceId)value.getNumber();
}

inline static int displayModeToInt(const DisplayMode value) {
  // the result of this method should be in sync with
  // Libraries/ReactNative/DisplayMode.js
  switch (value) {
    case DisplayMode::Visible:
      return 1;
    case DisplayMode::Suspended:
      return 2;
    case DisplayMode::Hidden:
      return 3;
  }
}

inline static std::string stringFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  return value.getString(runtime).utf8(runtime);
}

inline static folly::dynamic commandArgsFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  return jsi::dynamicFromValue(runtime, value);
}

inline static jsi::Value getArrayOfInstanceHandlesFromShadowNodes(
    const ShadowNode::ListOfShared& nodes,
    jsi::Runtime& runtime) {
  // JSI doesn't support adding elements to an array after creation,
  // so we need to accumulate the values in a vector and then create
  // the array when we know the size.
  std::vector<jsi::Value> nonNullInstanceHandles;
  nonNullInstanceHandles.reserve(nodes.size());
  for (const auto& shadowNode : nodes) {
    auto instanceHandle = (*shadowNode).getInstanceHandle(runtime);
    if (!instanceHandle.isNull()) {
      nonNullInstanceHandles.push_back(std::move(instanceHandle));
    }
  }

  auto result = jsi::Array(runtime, nonNullInstanceHandles.size());
  for (size_t i = 0; i < nonNullInstanceHandles.size(); i++) {
    result.setValueAtIndex(runtime, i, nonNullInstanceHandles[i]);
  }
  return result;
}

inline static void getTextContentInShadowNode(
    const ShadowNode& shadowNode,
    std::string& result) {
  auto rawTextShadowNode = dynamic_cast<const RawTextShadowNode*>(&shadowNode);
  if (rawTextShadowNode != nullptr) {
    result.append(rawTextShadowNode->getConcreteProps().text);
  }

  for (const auto& childNode : shadowNode.getChildren()) {
    getTextContentInShadowNode(*childNode.get(), result);
  }
}

inline static Rect getScrollableContentBounds(
    Rect contentBounds,
    LayoutMetrics layoutMetrics) {
  auto paddingFrame = layoutMetrics.getPaddingFrame();

  auto paddingBottom =
      layoutMetrics.contentInsets.bottom - layoutMetrics.borderWidth.bottom;
  auto paddingLeft =
      layoutMetrics.contentInsets.left - layoutMetrics.borderWidth.left;
  auto paddingRight =
      layoutMetrics.contentInsets.right - layoutMetrics.borderWidth.right;

  auto minY = paddingFrame.getMinY();
  auto maxY =
      std::max(paddingFrame.getMaxY(), contentBounds.getMaxY() + paddingBottom);

  auto minX = layoutMetrics.layoutDirection == LayoutDirection::RightToLeft
      ? std::min(paddingFrame.getMinX(), contentBounds.getMinX() - paddingLeft)
      : paddingFrame.getMinX();
  auto maxX = layoutMetrics.layoutDirection == LayoutDirection::RightToLeft
      ? paddingFrame.getMaxX()
      : std::max(
            paddingFrame.getMaxX(), contentBounds.getMaxX() + paddingRight);

  return Rect{Point{minX, minY}, Size{maxX - minX, maxY - minY}};
}

inline static Size getScrollSize(
    LayoutMetrics layoutMetrics,
    Rect contentBounds) {
  auto scrollableContentBounds =
      getScrollableContentBounds(contentBounds, layoutMetrics);
  return scrollableContentBounds.size;
}
} // namespace facebook::react
