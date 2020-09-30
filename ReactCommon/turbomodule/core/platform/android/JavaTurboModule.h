/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_set>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/JCallback.h>

namespace facebook {
namespace react {

struct JNIArgs {
  JNIArgs(size_t count) : args_(count) {}
  std::vector<jvalue> args_;
  std::vector<jobject> globalRefs_;
};

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/interfaces/TurboModule;";
};

class JSI_EXPORT JavaTurboModule : public TurboModule {
 public:
  JavaTurboModule(
      const std::string &name,
      jni::alias_ref<JTurboModule> instance,
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<CallInvoker> nativeInvoker);
  jsi::Value invokeJavaMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const std::string &methodSignature,
      const jsi::Value *args,
      size_t argCount);

  /**
   * This dtor must be called from the JS Thread, since it accesses
   * callbackWrappers_, which createJavaCallbackFromJSIFunction also accesses
   * from the JS Thread.
   */
  virtual ~JavaTurboModule();

 private:
  jni::global_ref<JTurboModule> instance_;
  std::unordered_set<std::shared_ptr<CallbackWrapper>> callbackWrappers_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

  /**
   * This method must be called from the JS Thread, since it accesses
   * callbackWrappers_.
   */
  jni::local_ref<JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
      jsi::Function &function,
      jsi::Runtime &rt,
      std::shared_ptr<CallInvoker> jsInvoker);
  JNIArgs convertJSIArgsToJNIArgs(
      JNIEnv *env,
      jsi::Runtime &rt,
      std::string methodName,
      std::vector<std::string> methodArgTypes,
      const jsi::Value *args,
      size_t count,
      std::shared_ptr<CallInvoker> jsInvoker,
      TurboModuleMethodValueKind valueKind);
};

} // namespace react
} // namespace facebook
