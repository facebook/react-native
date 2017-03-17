// Copyright 2004-present Facebook. All Rights Reserved.

#include <string>

#include <cxxreact/CxxModule.h>
#include <cxxreact/ModuleRegistry.h>
#include <fb/fbjni.h>

#include "CxxModuleWrapper.h"
#include "JavaModuleWrapper.h"

namespace facebook {
namespace react {

class MessageQueueThread;

class ModuleHolder : public jni::JavaClass<ModuleHolder> {
 public:
  static auto constexpr kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/ModuleHolder;";

  std::string getName() const;
  xplat::module::CxxModule::Provider getProvider() const;
};

std::unique_ptr<ModuleRegistry> buildModuleRegistry(
  std::weak_ptr<Instance> winstance,
  jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
  jni::alias_ref<jni::JCollection<ModuleHolder::javaobject>::javaobject> cxxModules,
  std::shared_ptr<MessageQueueThread> moduleMessageQueue);

}
}
