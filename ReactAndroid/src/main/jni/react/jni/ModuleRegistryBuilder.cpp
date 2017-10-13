// Copyright 2004-present Facebook. All Rights Reserved.

#include "ModuleRegistryBuilder.h"

#include <cxxreact/CxxNativeModule.h>
#include <folly/Memory.h>

namespace facebook {
namespace react {

std::string ModuleHolder::getName() const {
  static auto method = getClass()->getMethod<jstring()>("getName");
  return method(self())->toStdString();
}

xplat::module::CxxModule::Provider ModuleHolder::getProvider() const {
  return [self=jni::make_global(self())] {
    static auto method =
      ModuleHolder::javaClassStatic()->getMethod<JNativeModule::javaobject()>(
        "getModule");
    // This is the call which uses the lazy Java Provider to instantiate the
    // Java CxxModuleWrapper which contains the CxxModule.
    auto module = method(self);
    CHECK(module->isInstanceOf(CxxModuleWrapperBase::javaClassStatic()))
      << "module isn't a C++ module";
    auto cxxModule = jni::static_ref_cast<CxxModuleWrapperBase::javaobject>(module);
    // Then, we grab the CxxModule from the wrapper, which is no longer needed.
    return cxxModule->cthis()->getModule();
  };
}

std::vector<std::unique_ptr<NativeModule>> buildNativeModuleList(
    std::weak_ptr<Instance> winstance,
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
    jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules,
    std::shared_ptr<MessageQueueThread> moduleMessageQueue,
    std::shared_ptr<MessageQueueThread> uiBackgroundMessageQueue) {
  std::vector<std::unique_ptr<NativeModule>> modules;
  if (javaModules) {
    for (const auto& jm : *javaModules) {
      std::string name = jm->getName();
      if (uiBackgroundMessageQueue != NULL &&
        // This is techinically a hack. Perhaps we should bind the specific queue to the module
        // in the module holder or wrapper.
        // TODO expose as module configuration option
        (name == "UIManager" ||
          name == "NativeAnimatedModule" ||
          name == "FBFacebookReactNavigator")) {
        modules.emplace_back(folly::make_unique<JavaNativeModule>(
                             winstance, jm, uiBackgroundMessageQueue));
      } else {
        modules.emplace_back(folly::make_unique<JavaNativeModule>(
                             winstance, jm, moduleMessageQueue));
      }
    }
  }
  if (cxxModules) {
    for (const auto& cm : *cxxModules) {
      modules.emplace_back(folly::make_unique<CxxNativeModule>(
                             winstance, cm->getName(), cm->getProvider(), moduleMessageQueue));
    }
  }
  return modules;
}

}}
