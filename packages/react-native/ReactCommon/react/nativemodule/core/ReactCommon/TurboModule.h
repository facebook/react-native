/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>
#include <unordered_map>

#include <jsi/jsi.h>

#include <ReactCommon/CallInvoker.h>
#include <react/bridging/EventEmitter.h>

namespace facebook::react {

/**
 * For now, support the same set of return types as existing impl.
 * This can be improved to support richer typed objects.
 */
enum TurboModuleMethodValueKind {
  VoidKind,
  BooleanKind,
  NumberKind,
  StringKind,
  ObjectKind,
  ArrayKind,
  FunctionKind,
  PromiseKind,
};

/**
 * Determines TurboModuleMethodValueKind based on the jsi::Value type.
 */
TurboModuleMethodValueKind getTurboModuleMethodValueKind(
    jsi::Runtime& rt,
    const jsi::Value* value);

class TurboCxxModule;
class TurboModuleBinding;

/**
 * Base HostObject class for every module to be exposed to JS
 */
class JSI_EXPORT TurboModule : public facebook::jsi::HostObject {
 public:
  TurboModule(std::string name, std::shared_ptr<CallInvoker> jsInvoker);

  // Note: keep this method declared inline to avoid conflicts
  // between RTTI and non-RTTI compilation units
  facebook::jsi::Value get(
      facebook::jsi::Runtime& runtime,
      const facebook::jsi::PropNameID& propName) override {
    {
      auto prop = create(runtime, propName);
      // If we have a JS wrapper, cache the result of this lookup
      // We don't cache misses, to allow for methodMap_ to dynamically be
      // extended
      if (jsRepresentation_ && !prop.isUndefined()) {
        jsRepresentation_->lock(runtime).asObject(runtime).setProperty(
            runtime, propName, prop);
      }
      return prop;
    }
  }

  virtual std::vector<facebook::jsi::PropNameID> getPropertyNames(
      facebook::jsi::Runtime& runtime) override {
    std::vector<jsi::PropNameID> result;
    result.reserve(methodMap_.size());
    for (auto it = methodMap_.cbegin(); it != methodMap_.cend(); ++it) {
      result.push_back(jsi::PropNameID::forUtf8(runtime, it->first));
    }
    return result;
  }

 protected:
  const std::string name_;
  std::shared_ptr<CallInvoker> jsInvoker_;

  struct MethodMetadata {
    size_t argCount;
    facebook::jsi::Value (*invoker)(
        facebook::jsi::Runtime& rt,
        TurboModule& turboModule,
        const facebook::jsi::Value* args,
        size_t count);
  };
  std::unordered_map<std::string, MethodMetadata> methodMap_;
  std::unordered_map<std::string, std::shared_ptr<IAsyncEventEmitter>>
      eventEmitterMap_;

  using ArgFactory =
      std::function<void(jsi::Runtime& runtime, std::vector<jsi::Value>& args)>;

  /**
   * Calls RCTDeviceEventEmitter.emit to JavaScript, with given event name and
   * an optional list of arguments.
   * If present, argFactory is a callback used to construct extra arguments,
   * e.g.
   *
   *  emitDeviceEvent(rt, "myCustomEvent",
   *    [](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
   *      args.emplace_back(jsi::Value(true));
   *      args.emplace_back(jsi::Value(42));
   *  });
   */
  void emitDeviceEvent(
      const std::string& eventName,
      ArgFactory argFactory = nullptr);

  // Backwards compatibility version
  void emitDeviceEvent(
      jsi::Runtime& /*runtime*/,

      const std::string& eventName,
      ArgFactory argFactory = nullptr) {
    emitDeviceEvent(eventName, std::move(argFactory));
  }

  virtual jsi::Value create(
      jsi::Runtime& runtime,
      const jsi::PropNameID& propName) {
    std::string propNameUtf8 = propName.utf8(runtime);
    if (auto methodIter = methodMap_.find(propNameUtf8);
        methodIter != methodMap_.end()) {
      const MethodMetadata& meta = methodIter->second;
      return jsi::Function::createFromHostFunction(
          runtime,
          propName,
          static_cast<unsigned int>(meta.argCount),
          [this, meta](
              jsi::Runtime& rt,
              [[maybe_unused]] const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) { return meta.invoker(rt, *this, args, count); });
    } else if (auto eventEmitterIter = eventEmitterMap_.find(propNameUtf8);
               eventEmitterIter != eventEmitterMap_.end()) {
      return eventEmitterIter->second->get(runtime, jsInvoker_);
    }
    // Neither Method nor EventEmitter were not found, let JS decide what to do.
    return facebook::jsi::Value::undefined();
  }

 private:
  friend class TurboCxxModule;
  friend class TurboModuleBinding;
  std::unique_ptr<jsi::WeakObject> jsRepresentation_;
};

/**
 * An app/platform-specific provider function to get an instance of a module
 * given a name.
 */
using TurboModuleProviderFunctionType =
    std::function<std::shared_ptr<TurboModule>(const std::string& name)>;

} // namespace facebook::react
