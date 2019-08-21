/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboCxxModule.h"

#include <vector>

#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/JSIDynamic.h>

using namespace facebook;
using namespace facebook::xplat::module;

namespace facebook {
namespace react {

static CxxModule::Callback makeTurboCxxModuleCallback(
    jsi::Runtime &runtime,
    std::shared_ptr<CallbackWrapper> callbackWrapper) {
  return [callbackWrapper](std::vector<folly::dynamic> args) {
    callbackWrapper->jsInvoker().invokeAsync([callbackWrapper, args]() {
      std::vector<jsi::Value> innerArgs;
      for (auto &a : args) {
        innerArgs.push_back(
            jsi::valueFromDynamic(callbackWrapper->runtime(), a));
      }
      callbackWrapper->callback().call(
          callbackWrapper->runtime(),
          (const jsi::Value *)innerArgs.data(),
          innerArgs.size());
    });
  };
}

TurboCxxModule::TurboCxxModule(
    std::unique_ptr<CxxModule> cxxModule,
    std::shared_ptr<JSCallInvoker> jsInvoker)
    : TurboModule(cxxModule->getName(), jsInvoker),
      cxxMethods_(cxxModule->getMethods()),
      cxxModule_(std::move(cxxModule)) {}

jsi::Value TurboCxxModule::get(
    jsi::Runtime &runtime,
    const jsi::PropNameID &propName) {
  std::string propNameUtf8 = propName.utf8(runtime);

  if (propNameUtf8 == "getConstants") {
    // This is special cased because `getConstants()` is already a part of
    // CxxModule.
    return jsi::Function::createFromHostFunction(
        runtime,
        propName,
        0,
        [this](
            jsi::Runtime &rt,
            const jsi::Value &thisVal,
            const jsi::Value *args,
            size_t count) {
          jsi::Object result(rt);
          auto constants = cxxModule_->getConstants();
          for (auto &pair : constants) {
            result.setProperty(
                rt, pair.first.c_str(), jsi::valueFromDynamic(rt, pair.second));
          }
          return result;
        });
  }

  for (auto &method : cxxMethods_) {
    if (method.name == propNameUtf8) {
      return jsi::Function::createFromHostFunction(
          runtime,
          propName,
          0,
          [this, propNameUtf8](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) {
            return invokeMethod(rt, VoidKind, propNameUtf8, args, count);
          });
    }
  }

  return jsi::Value::undefined();
}

jsi::Value TurboCxxModule::invokeMethod(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind valueKind,
    const std::string &methodName,
    const jsi::Value *args,
    size_t count) {
  auto it = cxxMethods_.begin();
  for (; it != cxxMethods_.end(); it++) {
    auto method = *it;
    if (method.name == methodName) {
      break;
    }
  }

  if (it == cxxMethods_.end()) {
    throw std::runtime_error(
        "Function '" + methodName + "' cannot be found on cxxmodule: " + name_);
  }

  auto method = *it;

  if (method.syncFunc) {
    auto innerArgs = folly::dynamic::array();
    for (size_t i = 0; i < count; i++) {
      innerArgs.push_back(jsi::dynamicFromValue(runtime, args[i]));
    }
    return jsi::valueFromDynamic(
        runtime, method.syncFunc(std::move(innerArgs)));
  } else if (method.func && !method.isPromise) {
    // Async method.
    CxxModule::Callback first;
    CxxModule::Callback second;

    if (count < method.callbacks) {
      throw std::invalid_argument(folly::to<std::string>(
          "Expected ",
          method.callbacks,
          " callbacks, but only ",
          count,
          " parameters provided"));
    }

    if (method.callbacks == 1) {
      auto wrapper = std::make_shared<CallbackWrapper>(
          args[count - 1].getObject(runtime).getFunction(runtime),
          runtime,
          jsInvoker_);
      first = makeTurboCxxModuleCallback(runtime, wrapper);
    } else if (method.callbacks == 2) {
      auto wrapper1 = std::make_shared<CallbackWrapper>(
          args[count - 2].getObject(runtime).getFunction(runtime),
          runtime,
          jsInvoker_);
      auto wrapper2 = std::make_shared<CallbackWrapper>(
          args[count - 1].getObject(runtime).getFunction(runtime),
          runtime,
          jsInvoker_);
      first = makeTurboCxxModuleCallback(runtime, wrapper1);
      second = makeTurboCxxModuleCallback(runtime, wrapper2);
    }

    auto innerArgs = folly::dynamic::array();
    for (size_t i = 0; i < count - method.callbacks; i++) {
      innerArgs.push_back(jsi::dynamicFromValue(runtime, args[i]));
    }

    method.func(std::move(innerArgs), first, second);
  } else if (method.isPromise) {
    return createPromiseAsJSIValue(
        runtime,
        [method, args, count, this](
            jsi::Runtime &rt, std::shared_ptr<Promise> promise) {
          auto resolveWrapper = std::make_shared<CallbackWrapper>(
              promise->resolve_.getFunction(rt), rt, jsInvoker_);
          auto rejectWrapper = std::make_shared<CallbackWrapper>(
              promise->reject_.getFunction(rt), rt, jsInvoker_);
          CxxModule::Callback resolve =
              makeTurboCxxModuleCallback(rt, resolveWrapper);
          CxxModule::Callback reject =
              makeTurboCxxModuleCallback(rt, rejectWrapper);

          auto innerArgs = folly::dynamic::array();
          for (size_t i = 0; i < count; i++) {
            innerArgs.push_back(jsi::dynamicFromValue(rt, args[i]));
          }

          method.func(std::move(innerArgs), resolve, reject);
        });
  }

  return jsi::Value::undefined();
}

} // namespace react
} // namespace facebook
