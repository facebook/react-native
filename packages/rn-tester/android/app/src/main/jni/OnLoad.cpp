/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <AppSpecs.h>
#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
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

std::shared_ptr<TurboModule> provideModules(
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

class RNTesterNativeEntryPoint
    : public facebook::jni::HybridClass<RNTesterNativeEntryPoint> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/defaults/DefaultNativeEntryPoint;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>) {
    DefaultTurboModuleManagerDelegate::moduleProvidersFromEntryPoint =
        &provideModules;
    DefaultComponentsRegistry::registerComponentDescriptorsFromEntryPoint =
        &registerComponents;
    return makeCxxInstance();
  }

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", RNTesterNativeEntryPoint::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::RNTesterNativeEntryPoint::registerNatives(); });
}
