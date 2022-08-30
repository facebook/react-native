#include "MainApplicationTurboModuleManagerDelegate.h"
#include "MainApplicationModuleProvider.h"

namespace facebook {
namespace react {

jni::local_ref<MainApplicationTurboModuleManagerDelegate::jhybriddata>
MainApplicationTurboModuleManagerDelegate::initHybrid(
    jni::alias_ref<jhybridobject>) {
  return makeCxxInstance();
}

void MainApplicationTurboModuleManagerDelegate::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", MainApplicationTurboModuleManagerDelegate::initHybrid),
  });
}

std::shared_ptr<TurboModule>
MainApplicationTurboModuleManagerDelegate::getTurboModule(
    const std::string &name,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
  // Not implemented yet: provide pure-C++ NativeModules here.
  return nullptr;
}

std::shared_ptr<TurboModule>
MainApplicationTurboModuleManagerDelegate::getTurboModule(
    const std::string &name,
    const JavaTurboModule::InitParams &params) {
  return MainApplicationModuleProvider(name, params);
}

} // namespace react
} // namespace facebook
