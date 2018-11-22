// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/core/ShadowNode.h>

namespace facebook {
namespace react {

using RuntimeExecutor = std::function<void(
    std::function<void(facebook::jsi::Runtime &runtime)> &&callback)>;

inline RawProps rawPropsFromDynamic(const folly::dynamic object) noexcept {
  RawProps result;

  if (object.isNull()) {
    return result;
  }

  assert(object.isObject());

  for (const auto &pair : object.items()) {
    assert(pair.first.isString());
    result[pair.first.asString()] = pair.second;
  }

  return result;
}

struct EventTargetWrapper : public EventTarget {
  EventTargetWrapper(jsi::WeakObject instanceHandle)
      : instanceHandle(std::move(instanceHandle)) {}

  mutable jsi::WeakObject instanceHandle;
};

struct EventHandlerWrapper : public EventHandler {
  EventHandlerWrapper(jsi::Function eventHandler)
      : callback(std::move(eventHandler)) {}

  jsi::Function callback;
};

struct ShadowNodeWrapper : public jsi::HostObject {
  ShadowNodeWrapper(SharedShadowNode shadowNode)
      : shadowNode(std::move(shadowNode)) {}

  SharedShadowNode shadowNode;
};

struct ShadowNodeListWrapper : public jsi::HostObject {
  ShadowNodeListWrapper(SharedShadowNodeUnsharedList shadowNodeList)
      : shadowNodeList(shadowNodeList) {}

  SharedShadowNodeUnsharedList shadowNodeList;
};

inline static SharedShadowNode shadowNodeFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeWrapper>(runtime)
      ->shadowNode;
}

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime &runtime,
    const SharedShadowNode &shadowNode) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_shared<ShadowNodeWrapper>(shadowNode));
}

inline static SharedShadowNodeUnsharedList shadowNodeListFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return value.getObject(runtime)
      .getHostObject<ShadowNodeListWrapper>(runtime)
      ->shadowNodeList;
}

inline static jsi::Value valueFromShadowNodeList(
    jsi::Runtime &runtime,
    const SharedShadowNodeUnsharedList &shadowNodeList) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_unique<ShadowNodeListWrapper>(shadowNodeList));
}

inline static RawProps rawPropsFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return rawPropsFromDynamic(folly::dynamic{
      value.isNull() ? nullptr : jsi::dynamicFromValue(runtime, value)});
}

inline static SharedEventTarget eventTargetFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return std::make_shared<EventTargetWrapper>(
      jsi::WeakObject(runtime, value.getObject(runtime)));
}

inline static Tag tagFromValue(jsi::Runtime &runtime, const jsi::Value &value) {
  return (Tag)value.getNumber();
}

inline static SurfaceId surfaceIdFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return (SurfaceId)value.getNumber();
}

inline static ComponentName componentNameFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value) {
  return value.getString(runtime).utf8(runtime);
}

} // namespace react
} // namespace facebook
