// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fabric/core/ShadowNode.h>
#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>

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

} // namespace react
} // namespace facebook
