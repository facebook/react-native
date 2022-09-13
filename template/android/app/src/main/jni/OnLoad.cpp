#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <rncli.h>

namespace facebook {
namespace react {

void registerComponents(
    std::shared_ptr<ComponentDescriptorProviderRegistry const> registry) {
  // Custom Fabric Components go here. You can register custom
  // components coming from your App or from 3rd party libraries here.
  //
  // providerRegistry->add(concreteComponentDescriptorProvider<
  //        AocViewerComponentDescriptor>());

  // By default we just use the components autolinked by RN CLI
  rncli_registerProviders(registry);
}

std::shared_ptr<TurboModule> provideModules(
    const std::string &name,
    const JavaTurboModule::InitParams &params) {
  // Here you can provide your own module provider for TurboModules coming from
  // either your application or from external libraries. The approach to follow
  // is similar to the following (for a library called `samplelibrary`):
  //
  // auto module = samplelibrary_ModuleProvider(moduleName, params);
  // if (module != nullptr) {
  //    return module;
  // }
  // return rncore_ModuleProvider(moduleName, params);

  // By default we just use the module providers autolinked by RN CLI
  return rncli_ModuleProvider(name, params);
}

class MainApplicationNativeEntryPoint
    : public facebook::jni::HybridClass<MainApplicationNativeEntryPoint> {
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
        makeNativeMethod(
            "initHybrid", MainApplicationNativeEntryPoint::initHybrid),
    });
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::MainApplicationNativeEntryPoint::registerNatives();
  });
}
