/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/NativeModule.h>
#include <fbjni/fbjni.h>
#include <folly/Optional.h>

#include "MethodInvoker.h"

namespace facebook {
namespace react {

class Instance;
class MessageQueueThread;

struct JMethodDescriptor : public jni::JavaClass<JMethodDescriptor> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/JavaModuleWrapper$MethodDescriptor;";

  jni::local_ref<JReflectMethod::javaobject> getMethod() const;
  std::string getSignature() const;
  std::string getName() const;
  std::string getType() const;
};

struct JavaModuleWrapper : jni::JavaClass<JavaModuleWrapper> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/JavaModuleWrapper;";

  jni::local_ref<JBaseJavaModule::javaobject> getModule() {
    // This is the call which causes a lazy Java module to actually be
    // created.
    static auto getModule =
        javaClassStatic()->getMethod<JBaseJavaModule::javaobject()>(
            "getModule");
    return getModule(self());
  }

  std::string getName() const {
    static auto getName = javaClassStatic()->getMethod<jstring()>("getName");
    return getName(self())->toStdString();
  }

  jni::local_ref<jni::JList<JMethodDescriptor::javaobject>::javaobject>
  getMethodDescriptors() {
    static auto getMethods =
        getClass()
            ->getMethod<
                jni::JList<JMethodDescriptor::javaobject>::javaobject()>(
                "getMethodDescriptors");
    return getMethods(self());
  }
};

class JavaNativeModule : public NativeModule {
 public:
  JavaNativeModule(
      std::weak_ptr<Instance> instance,
      jni::alias_ref<JavaModuleWrapper::javaobject> wrapper,
      std::shared_ptr<MessageQueueThread> messageQueueThread)
      : instance_(std::move(instance)),
        wrapper_(make_global(wrapper)),
        messageQueueThread_(std::move(messageQueueThread)) {}

  std::string getName() override;
  folly::dynamic getConstants() override;
  std::vector<MethodDescriptor> getMethods() override;
  void invoke(unsigned int reactMethodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int reactMethodId,
      folly::dynamic &&params) override;

 private:
  std::weak_ptr<Instance> instance_;
  jni::global_ref<JavaModuleWrapper::javaobject> wrapper_;
  std::shared_ptr<MessageQueueThread> messageQueueThread_;
  std::vector<folly::Optional<MethodInvoker>> syncMethods_;
};

// Experimental new implementation that uses direct method invocation
class NewJavaNativeModule : public NativeModule {
 public:
  NewJavaNativeModule(
      std::weak_ptr<Instance> instance,
      jni::alias_ref<JavaModuleWrapper::javaobject> wrapper,
      std::shared_ptr<MessageQueueThread> messageQueueThread);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int reactMethodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int reactMethodId,
      folly::dynamic &&params) override;

 private:
  std::weak_ptr<Instance> instance_;
  jni::global_ref<JavaModuleWrapper::javaobject> wrapper_;
  jni::global_ref<JBaseJavaModule::javaobject> module_;
  std::shared_ptr<MessageQueueThread> messageQueueThread_;
  std::vector<MethodInvoker> methods_;
  std::vector<MethodDescriptor> methodDescriptors_;

  MethodCallResult invokeInner(
      unsigned int reactMethodId,
      folly::dynamic &&params);
};

} // namespace react
} // namespace facebook
