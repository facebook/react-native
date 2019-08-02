/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <jsi/jsi.h>

#include <ReactCommon/JSCallInvoker.h>

using namespace facebook;

namespace facebook {
namespace react {

jsi::Object deepCopyJSIObject(jsi::Runtime &rt, const jsi::Object &obj);
jsi::Array deepCopyJSIArray(jsi::Runtime &rt, const jsi::Array &arr);

struct Promise {
  Promise(jsi::Runtime &rt, jsi::Function resolve, jsi::Function reject);

  void resolve(const jsi::Value &result);
  void reject(const std::string &error);

  jsi::Runtime &runtime_;
  jsi::Function resolve_;
  jsi::Function reject_;
};

using PromiseSetupFunctionType = std::function<void(jsi::Runtime &rt, std::shared_ptr<Promise>)>;
jsi::Value createPromiseAsJSIValue(jsi::Runtime &rt, const PromiseSetupFunctionType func);

// Helper for passing jsi::Function arg to other methods.
struct CallbackWrapper {
  CallbackWrapper(jsi::Function callback, jsi::Runtime &runtime, std::shared_ptr<react::JSCallInvoker> jsInvoker)
  : callback(std::move(callback)),
    runtime(runtime),
    jsInvoker(jsInvoker) {}
  jsi::Function callback;
  jsi::Runtime &runtime;
  std::shared_ptr<react::JSCallInvoker> jsInvoker;
};

} // namespace react
} // namespace facebook
