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
#include <react/renderer/core/CoreFeatures.h>
#include <react/renderer/core/EventHandler.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/TraitCast.h>

namespace facebook::react {

using BackgroundExecutor =
    std::function<void(std::function<void()> &&callback)>;

struct EventHandlerWrapper : public EventHandler {
  EventHandlerWrapper(jsi::Function eventHandler)
      : callback(std::move(eventHandler)) {}

  jsi::Function callback;
};

struct ShadowNodeWrapper : public jsi::HostObject {
  ShadowNodeWrapper(ShadowNode::Shared shadowNode)
      : shadowNode(std::move(shadowNode)) {}

  // The below method needs to be implemented out-of-line in order for the class
  // to have at least one "key function" (see
  // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#vague-vtable)
  ~ShadowNodeWrapper() override;

  ShadowNode::Shared shadowNode;
};

struct ShadowNodeListWrapper : public jsi::HostObject, public jsi::NativeState {
  ShadowNodeListWrapper(ShadowNode::UnsharedListOfShared shadowNodeList)
      : shadowNodeList(std::move(shadowNodeList)) {}

  // The below method needs to be implemented out-of-line in order for the class
  // to have at least one "key function" (see
  // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#vague-vtable)
  ~ShadowNodeListWrapper() override;

  ShadowNode::UnsharedListOfShared shadowNodeList;
};

inline static ShadowNode::Shared shadowNodeFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  if (value.isNull()) {
    return nullptr;
  }

  if (CoreFeatures::useNativeState) {
    return value.getObject(runtime).getNativeState<ShadowNode>(runtime);
  } else {
    return value.getObject(runtime)
        .getHostObject<ShadowNodeWrapper>(runtime)
        ->shadowNode;
  }
}

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime &runtime,
    ShadowNode::Shared shadowNode) {
  if (CoreFeatures::useNativeState) {
    jsi::Object obj(runtime);
    // Need to const_cast since JSI only allows non-const pointees
    obj.setNativeState(
        runtime, std::const_pointer_cast<ShadowNode>(std::move(shadowNode)));
    return obj;
  } else {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<ShadowNodeWrapper>(std::move(shadowNode)));
  }
}

inline static ShadowNode::UnsharedListOfShared shadowNodeListFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  if (CoreFeatures::useNativeState) {
    return value.getObject(runtime)
        .getNativeState<ShadowNodeListWrapper>(runtime)
        ->shadowNodeList;
  } else {
    return value.getObject(runtime)
        .getHostObject<ShadowNodeListWrapper>(runtime)
        ->shadowNodeList;
  }
}

inline static jsi::Value valueFromShadowNodeList(
    jsi::Runtime &runtime,
    ShadowNode::UnsharedListOfShared shadowNodeList) {
  auto wrapper =
      std::make_shared<ShadowNodeListWrapper>(std::move(shadowNodeList));
  if (CoreFeatures::useNativeState) {
    // Use the wrapper for NativeState too, otherwise we can't implement
    // the marker interface. Could be simplified to a simple struct wrapper.
    jsi::Object obj(runtime);
    obj.setNativeState(runtime, std::move(wrapper));
    return obj;
  } else {
    return jsi::Object::createFromHostObject(runtime, std::move(wrapper));
  }
}

inline static ShadowNode::UnsharedListOfShared shadowNodeListFromWeakList(
    ShadowNode::UnsharedListOfWeak const &weakShadowNodeList) {
  auto result = std::make_shared<ShadowNode::ListOfShared>();
  for (auto const &weakShadowNode : *weakShadowNodeList) {
    auto sharedShadowNode = weakShadowNode.lock();
    if (!sharedShadowNode) {
      return nullptr;
    }
    result->push_back(sharedShadowNode);
  }
  return result;
}

inline static ShadowNode::UnsharedListOfWeak weakShadowNodeListFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  auto shadowNodeList = shadowNodeListFromValue(runtime, value);
  auto weakShadowNodeList = std::make_shared<ShadowNode::ListOfWeak>();
  for (auto const &shadowNode : *shadowNodeList) {
    weakShadowNodeList->push_back(shadowNode);
  }
  return weakShadowNodeList;
}

inline static Tag tagFromValue(jsi::Value const &value) {
  return (Tag)value.getNumber();
}

inline static SharedEventTarget eventTargetFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &eventTargetValue,
    jsi::Value const &tagValue) {
  react_native_assert(!eventTargetValue.isNull());
  if (eventTargetValue.isNull()) {
    return nullptr;
  }
  return std::make_shared<EventTarget>(
      runtime, eventTargetValue, tagFromValue(tagValue));
}

inline static SurfaceId surfaceIdFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return (SurfaceId)value.getNumber();
}

inline static int displayModeToInt(DisplayMode const value) {
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
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return value.getString(runtime).utf8(runtime);
}

inline static folly::dynamic commandArgsFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  return jsi::dynamicFromValue(runtime, value);
}

inline static jsi::Value getInstanceHandleFromShadowNode(
    ShadowNode::Shared shadowNode,
    jsi::Runtime &runtime) {
  auto eventTarget = shadowNode->getEventEmitter()->getEventTarget();
  // shadowNode is probably a RootShadowNode and they don't have
  // event targets.
  if (eventTarget == nullptr) {
    return jsi::Value::null();
  }
  eventTarget->retain(runtime);
  auto instanceHandle = eventTarget->getInstanceHandle(runtime);
  eventTarget->release(runtime);
  return instanceHandle;
}

inline static jsi::Value getArrayOfInstanceHandlesFromShadowNodes(
    ShadowNode::ListOfShared const &nodes,
    jsi::Runtime &runtime) {
  // JSI doesn't support adding elements to an array after creation,
  // so we need to accumulate the values in a vector and then create
  // the array when we know the size.
  std::vector<jsi::Value> nonNullInstanceHandles;
  nonNullInstanceHandles.reserve(nodes.size());
  for (auto const &shadowNode : nodes) {
    auto instanceHandle = getInstanceHandleFromShadowNode(shadowNode, runtime);
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
    ShadowNode const &shadowNode,
    std::string &result) {
  auto rawTextShadowNode = traitCast<RawTextShadowNode const *>(&shadowNode);
  if (rawTextShadowNode != nullptr) {
    result.append(rawTextShadowNode->getConcreteProps().text);
  }

  for (auto const &childNode : shadowNode.getChildren()) {
    getTextContentInShadowNode(*childNode.get(), result);
  }
}
} // namespace facebook::react
