/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <ReactCommon/TurboModule.h>
#include <fb/fbjni.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/turbomodule/core/interfaces/TurboModule;";
};

class JSI_EXPORT JavaTurboModule : public TurboModule {
public:
  JavaTurboModule(const std::string &name, jni::global_ref<JTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);
  jsi::Value invokeJavaMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const std::string &methodSignature,
      const jsi::Value *args,
      size_t count);
private:
  jni::global_ref<JTurboModule> instance_;
  jclass findClass(JNIEnv *env) const;
};

} // namespace react
} // namespace facebook
