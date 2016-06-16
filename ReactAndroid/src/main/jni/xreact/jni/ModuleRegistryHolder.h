// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fb/fbjni.h>

#include <cxxreact/ModuleRegistry.h>
#include "CxxModuleWrapper.h"

namespace facebook {
namespace react {

class Instance;
class CatalystInstanceImpl;

struct JReflectMethod : public jni::JavaClass<JReflectMethod> {
  static constexpr auto kJavaDescriptor = "Ljava/lang/reflect/Method;";

  jmethodID getMethodID() {
    auto id = jni::Environment::current()->FromReflectedMethod(self());
    jni::throwPendingJniExceptionAsCppException();
    return id;
  }
};

struct JMethodDescriptor : public jni::JavaClass<JMethodDescriptor> {
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/JavaModuleWrapper$MethodDescriptor;";

  jni::local_ref<JReflectMethod::javaobject> getMethod() const;
  std::string getSignature() const;
  std::string getName() const;
  std::string getType() const;
};

struct JBaseJavaModule : public jni::JavaClass<JBaseJavaModule> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/BaseJavaModule;";
};

struct JavaModuleWrapper : jni::JavaClass<JavaModuleWrapper> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/JavaModuleWrapper;";

  jni::local_ref<JBaseJavaModule::javaobject> getModule() {
    static auto getModule = javaClassStatic()->getMethod<JBaseJavaModule::javaobject()>("getModule");
    return getModule(self());
  }

  jni::local_ref<jni::JList<JMethodDescriptor::javaobject>::javaobject> getMethodDescriptors() {
    static auto getMethods =
      getClass()->getMethod<jni::JList<JMethodDescriptor::javaobject>::javaobject()>("getMethodDescriptors");
    return getMethods(self());
  }

  jni::local_ref<jni::JList<JMethodDescriptor::javaobject>::javaobject> newGetMethodDescriptors() {
    static auto getMethods =
      getClass()->getMethod<jni::JList<JMethodDescriptor::javaobject>::javaobject()>("newGetMethodDescriptors");
    return getMethods(self());
  }
};

class ModuleRegistryHolder : public jni::HybridClass<ModuleRegistryHolder> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/ModuleRegistryHolder;";

  std::shared_ptr<ModuleRegistry> getModuleRegistry() {
    return registry_;
  }

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      CatalystInstanceImpl* catalystInstanceImpl,
      jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
      jni::alias_ref<jni::JCollection<CxxModuleWrapper::javaobject>::javaobject> cxxModules) {
    return makeCxxInstance(catalystInstanceImpl, javaModules, cxxModules);
  }

  static void registerNatives();

 private:
  friend HybridBase;
  ModuleRegistryHolder(
      CatalystInstanceImpl* catalystInstanceImpl,
      jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
      jni::alias_ref<jni::JCollection<CxxModuleWrapper::javaobject>::javaobject> cxxModules);

  facebook::xplat::module::CxxModule::Callback makeCallback(const folly::dynamic& callbackId);

  std::shared_ptr<ModuleRegistry> registry_;
};

using Callback = std::function<void(folly::dynamic)>;
Callback makeCallback(std::weak_ptr<Instance> instance, ExecutorToken token, const folly::dynamic& callbackId);

}}
