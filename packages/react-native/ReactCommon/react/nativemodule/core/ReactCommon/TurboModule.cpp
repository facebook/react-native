/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModule.h"
#include <react/debug/react_native_assert.h>

namespace facebook::react {

TurboModuleMethodValueKind getTurboModuleMethodValueKind(
    jsi::Runtime& rt,
    const jsi::Value* value) {
  if (!value || value->isUndefined() || value->isNull()) {
    return VoidKind;
  } else if (value->isBool()) {
    return BooleanKind;
  } else if (value->isNumber()) {
    return NumberKind;
  } else if (value->isString()) {
    return StringKind;
  } else if (value->isObject()) {
    auto object = value->asObject(rt);
    if (object.isArray(rt)) {
      return ArrayKind;
    } else if (object.isFunction(rt)) {
      return FunctionKind;
    }
    return ObjectKind;
  }
  react_native_assert(false && "Unsupported jsi::Value kind");
  return VoidKind;
}

TurboModule::TurboModule(
    std::string name,
    std::shared_ptr<CallInvoker> jsInvoker)
    : name_(std::move(name)), jsInvoker_(std::move(jsInvoker)) {}

void TurboModule::emitDeviceEvent(
    jsi::Runtime& runtime,
    const std::string& eventName,
    ArgFactory argFactory) {
  jsInvoker_->invokeAsync([&runtime, eventName, argFactory]() {
    jsi::Value emitter =
        runtime.global().getProperty(runtime, "__rctDeviceEventEmitter");
    if (!emitter.isUndefined()) {
      jsi::Object emitterObject = emitter.asObject(runtime);
      // TODO: consider caching these
      jsi::Function emitFunction =
          emitterObject.getPropertyAsFunction(runtime, "emit");
      std::vector<jsi::Value> args;
      args.emplace_back(
          jsi::String::createFromAscii(runtime, eventName.c_str()));
      if (argFactory) {
        argFactory(runtime, args);
      }
      emitFunction.callWithThis(
          runtime, emitterObject, (const jsi::Value*)args.data(), args.size());
    }
  });
}

} // namespace facebook::react
