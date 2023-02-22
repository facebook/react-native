/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <AppSpecs.h>
#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <NativeCxxModuleExample.h>
#include <ReactCommon/SampleTurboModuleSpec.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/AppSpecs/ComponentDescriptors.h>
#include <rncore.h>

namespace facebook {
namespace react {

void registerComponents(
    std::shared_ptr<ComponentDescriptorProviderRegistry const> registry) {
  registry->add(concreteComponentDescriptorProvider<
                RNTMyNativeViewComponentDescriptor>());
}

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string &name,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
  if (name == "NativeCxxModuleExampleCxx") {
    return std::make_shared<NativeCxxModuleExample>(jsInvoker);
  }
  return nullptr;
}

std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string &name,
    const JavaTurboModule::InitParams &params) {
  auto module = AppSpecs_ModuleProvider(name, params);
  if (module != nullptr) {
    return module;
  }
  module = SampleTurboModuleSpec_ModuleProvider(name, params);
  if (module != nullptr) {
    return module;
  };
  return rncore_ModuleProvider(name, params);
}

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::registerComponents;
  });
}
