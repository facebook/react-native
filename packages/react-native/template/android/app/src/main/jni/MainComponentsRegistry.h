#pragma once

#include <ComponentFactory.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>

namespace facebook {
namespace react {

class MainComponentsRegistry
    : public facebook::jni::HybridClass<MainComponentsRegistry> {
 public:
  // Adapt it to the package you used for your Java class.
  constexpr static auto kJavaDescriptor =
      "Lcom/helloworld/newarchitecture/components/MainComponentsRegistry;";

  static void registerNatives();

  MainComponentsRegistry(ComponentFactory *delegate);

 private:
  static std::shared_ptr<ComponentDescriptorProviderRegistry const>
  sharedProviderRegistry();

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      ComponentFactory *delegate);
};

} // namespace react
} // namespace facebook
