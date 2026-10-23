/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <React/Bridging.h>
#include <React/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>
#include <react/jni/JCallback.h>

namespace facebook::react {

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/turbomodule/core/interfaces/TurboModule;";
};

struct JTurboModuleWithJSIBindings : jni::JavaClass<JTurboModuleWithJSIBindings> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/turbomodule/core/interfaces/TurboModuleWithJSIBindings;";
};

class JSI_EXPORT JavaTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    jni::alias_ref<jobject> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker;
  };

  JavaTurboModule(const InitParams &params);
  virtual ~JavaTurboModule();

  jsi::Value invokeJavaMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const std::string &methodSignature,
      const jsi::Value *args,
      size_t argCount,
      jmethodID &cachedMethodID);

 protected:
  void configureEventEmitterCallback();

  [[deprecated]] void setEventEmitterCallback(jni::alias_ref<jobject> /*unused*/)
  {
    configureEventEmitterCallback();
  }

 private:
  // instance_ can be of type JTurboModule, or JNativeModule
  jni::global_ref<jobject> instance_;
  std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker_;

  // A method's JNI signature, parsed on its first call since it doesn't change.
  struct MethodInfo {
    std::vector<std::string> argTypes;
    std::string returnType;
  };
  std::unordered_map<jmethodID, MethodInfo> methodInfos_;
  std::mutex methodInfosMutex_;
  const MethodInfo &getMethodInfo(jmethodID methodID, const std::string &methodSignature);
};

} // namespace facebook::react
