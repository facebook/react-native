/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <string>

#include <folly/Optional.h>
#include <jsi/jsi.h>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/LongLivedObject.h>

using namespace facebook;

namespace facebook {
namespace react {

jsi::Object deepCopyJSIObject(jsi::Runtime &rt, const jsi::Object &obj);
jsi::Array deepCopyJSIArray(jsi::Runtime &rt, const jsi::Array &arr);

struct Promise : public LongLivedObject {
  Promise(jsi::Runtime &rt, jsi::Function resolve, jsi::Function reject);

  void resolve(const jsi::Value &result);
  void reject(const std::string &error);

  jsi::Runtime &runtime_;
  jsi::Function resolve_;
  jsi::Function reject_;
};

using PromiseSetupFunctionType =
    std::function<void(jsi::Runtime &rt, std::shared_ptr<Promise>)>;
jsi::Value createPromiseAsJSIValue(
    jsi::Runtime &rt,
    const PromiseSetupFunctionType func);

// Helper for passing jsi::Function arg to other methods.
// TODO (ramanpreet): Simplify with weak_ptr<>
class CallbackWrapper : public LongLivedObject {
 private:
  struct Data {
    Data(
        jsi::Function callback,
        jsi::Runtime &runtime,
        std::shared_ptr<react::CallInvoker> jsInvoker)
        : callback(std::move(callback)),
          runtime(runtime),
          jsInvoker(std::move(jsInvoker)) {}

    jsi::Function callback;
    jsi::Runtime &runtime;
    std::shared_ptr<react::CallInvoker> jsInvoker;
  };

  folly::Optional<Data> data_;

 public:
  static std::weak_ptr<CallbackWrapper> createWeak(
      jsi::Function callback,
      jsi::Runtime &runtime,
      std::shared_ptr<react::CallInvoker> jsInvoker) {
    auto wrapper = std::make_shared<CallbackWrapper>(
        std::move(callback), runtime, jsInvoker);
    LongLivedObjectCollection::get().add(wrapper);
    return wrapper;
  }

  CallbackWrapper(
      jsi::Function callback,
      jsi::Runtime &runtime,
      std::shared_ptr<react::CallInvoker> jsInvoker)
      : data_(Data{std::move(callback), runtime, jsInvoker}) {}

  // Delete the enclosed jsi::Function
  void destroy() {
    data_ = folly::none;
    allowRelease();
  }

  bool isDestroyed() {
    return !data_.hasValue();
  }

  jsi::Function &callback() {
    assert(!isDestroyed());
    return data_->callback;
  }

  jsi::Runtime &runtime() {
    assert(!isDestroyed());
    return data_->runtime;
  }

  react::CallInvoker &jsInvoker() {
    assert(!isDestroyed());
    return *(data_->jsInvoker);
  }
};

} // namespace react
} // namespace facebook
