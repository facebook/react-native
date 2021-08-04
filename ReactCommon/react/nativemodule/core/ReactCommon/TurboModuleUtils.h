/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <string>

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
class CallbackWrapper : public LongLivedObject {
 private:
  CallbackWrapper(
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : longLivedObjectCollection_(),
        callback_(std::move(callback)),
        runtime_(runtime),
        jsInvoker_(std::move(jsInvoker)) {}

  CallbackWrapper(
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection,
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : longLivedObjectCollection_(longLivedObjectCollection),
        callback_(std::move(callback)),
        runtime_(runtime),
        jsInvoker_(std::move(jsInvoker)) {}

  // Use a weak_ptr to avoid a retain cycle: LongLivedObjectCollection owns all
  // CallbackWrappers. So, CallbackWrapper cannot own its
  // LongLivedObjectCollection.
  std::weak_ptr<LongLivedObjectCollection> longLivedObjectCollection_;
  jsi::Function callback_;
  jsi::Runtime &runtime_;
  std::shared_ptr<CallInvoker> jsInvoker_;

 public:
  static std::weak_ptr<CallbackWrapper> createWeak(
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(
        new CallbackWrapper(std::move(callback), runtime, jsInvoker));
    LongLivedObjectCollection::get().add(wrapper);
    return wrapper;
  }

  static std::weak_ptr<CallbackWrapper> createWeak(
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection,
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(new CallbackWrapper(
        longLivedObjectCollection, std::move(callback), runtime, jsInvoker));
    longLivedObjectCollection->add(wrapper);
    return wrapper;
  }

  // Delete the enclosed jsi::Function
  void destroy() {
    allowRelease();
  }

  jsi::Function &callback() {
    return callback_;
  }

  jsi::Runtime &runtime() {
    return runtime_;
  }

  CallInvoker &jsInvoker() {
    return *(jsInvoker_);
  }

  void allowRelease() override {
    if (auto longLivedObjectCollection = longLivedObjectCollection_.lock()) {
      if (longLivedObjectCollection != nullptr) {
        longLivedObjectCollection->remove(this);
        return;
      }
    }
    LongLivedObject::allowRelease();
  }
};

class RAIICallbackWrapperDestroyer {
 public:
  RAIICallbackWrapperDestroyer(std::weak_ptr<CallbackWrapper> callbackWrapper)
      : callbackWrapper_(callbackWrapper) {}

  ~RAIICallbackWrapperDestroyer() {
    auto strongWrapper = callbackWrapper_.lock();
    if (!strongWrapper) {
      return;
    }

    strongWrapper->destroy();
  }

 private:
  std::weak_ptr<CallbackWrapper> callbackWrapper_;
};

} // namespace react
} // namespace facebook
