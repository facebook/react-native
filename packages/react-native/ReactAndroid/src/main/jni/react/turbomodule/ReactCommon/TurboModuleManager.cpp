/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleManager.h"

#include <memory>
#include <stdexcept>
#include <string>

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <ReactCommon/BindingsInstallerHolder.h>
#include <ReactCommon/CxxTurboModuleUtils.h>
#include <ReactCommon/JavaInteropTurboModule.h>
#include <ReactCommon/TurboCxxModule.h>
#include <ReactCommon/TurboModuleBinding.h>
#include <ReactCommon/TurboModulePerfLogger.h>
#include <react/jni/CxxModuleWrapper.h>

namespace facebook::react {

namespace {

class JMethodDescriptor : public jni::JavaClass<JMethodDescriptor> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/internal/turbomodule/core/TurboModuleInteropUtils$MethodDescriptor;";

  JavaInteropTurboModule::MethodDescriptor toMethodDescriptor() {
    return JavaInteropTurboModule::MethodDescriptor{
        .methodName = getMethodName(),
        .jniSignature = getJNISignature(),
        .jsiReturnKind = getJSIReturnKind(),
        .jsArgCount = getJSArgCount(),
    };
  }

 private:
  std::string getMethodName() {
    static const auto field =
        javaClassStatic()->getField<jstring>("methodName");
    return getFieldValue(field)->toStdString();
  }

  std::string getJNISignature() {
    static const auto field =
        javaClassStatic()->getField<jstring>("jniSignature");
    return getFieldValue(field)->toStdString();
  }

  TurboModuleMethodValueKind getJSIReturnKind() {
    static const auto field =
        javaClassStatic()->getField<jstring>("jsiReturnKind");
    const std::string jsiReturnKind = getFieldValue(field)->toStdString();
    if (jsiReturnKind == "VoidKind") {
      return VoidKind;
    }
    if (jsiReturnKind == "BooleanKind") {
      return BooleanKind;
    }
    if (jsiReturnKind == "NumberKind") {
      return NumberKind;
    }
    if (jsiReturnKind == "StringKind") {
      return StringKind;
    }
    if (jsiReturnKind == "ObjectKind") {
      return ObjectKind;
    }
    if (jsiReturnKind == "ArrayKind") {
      return ArrayKind;
    }
    if (jsiReturnKind == "FunctionKind") {
      return FunctionKind;
    }
    if (jsiReturnKind == "PromiseKind") {
      return PromiseKind;
    }

    throw new std::runtime_error(
        std::string("Failed to convert jsiReturnKind \"") + jsiReturnKind +
        "\" to TurboModuleMethodValueKind");
  }

  int getJSArgCount() {
    static const auto field = javaClassStatic()->getField<int>("jsArgCount");
    return getFieldValue(field);
  }
};
} // namespace

TurboModuleManager::TurboModuleManager(
    RuntimeExecutor runtimeExecutor,
    std::shared_ptr<CallInvoker> jsCallInvoker,
    std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker,
    jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate)
    : runtimeExecutor_(std::move(runtimeExecutor)),
      jsCallInvoker_(std::move(jsCallInvoker)),
      nativeMethodCallInvoker_(std::move(nativeMethodCallInvoker)),
      delegate_(jni::make_global(delegate)) {}

jni::local_ref<TurboModuleManager::jhybriddata> TurboModuleManager::initHybrid(
    jni::alias_ref<jhybridobject> /* unused */,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<CallInvokerHolder::javaobject> jsCallInvokerHolder,
    jni::alias_ref<NativeMethodCallInvokerHolder::javaobject>
        nativeMethodCallInvokerHolder,
    jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate) {
  return makeCxxInstance(
      runtimeExecutor->cthis()->get(),
      jsCallInvokerHolder->cthis()->getCallInvoker(),
      nativeMethodCallInvokerHolder->cthis()->getNativeMethodCallInvoker(),
      delegate);
}

void TurboModuleManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", TurboModuleManager::initHybrid),
      makeNativeMethod(
          "installJSIBindings", TurboModuleManager::installJSIBindings),
  });
}

TurboModuleProviderFunctionType TurboModuleManager::createTurboModuleProvider(
    jni::alias_ref<jhybridobject> javaPart,
    jsi::Runtime* runtime) {
  return [runtime, weakJavaPart = jni::make_weak(javaPart)](
             const std::string& name) -> std::shared_ptr<TurboModule> {
    auto javaPart = weakJavaPart.lockLocal();
    if (!javaPart) {
      return nullptr;
    }

    auto cxxPart = javaPart->cthis();
    if (cxxPart == nullptr) {
      return nullptr;
    }

    return cxxPart->getTurboModule(javaPart, name, *runtime);
  };
}

std::shared_ptr<TurboModule> TurboModuleManager::getTurboModule(
    jni::alias_ref<jhybridobject> javaPart,
    const std::string& name,
    jsi::Runtime& runtime) {
  const char* moduleName = name.c_str();
  TurboModulePerfLogger::moduleJSRequireBeginningStart(moduleName);

  auto turboModuleLookup = turboModuleCache_.find(name);
  if (turboModuleLookup != turboModuleCache_.end()) {
    TurboModulePerfLogger::moduleJSRequireBeginningCacheHit(moduleName);
    TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);
    return turboModuleLookup->second;
  }

  TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);

  auto cxxDelegate = delegate_->cthis();

  auto cxxModule = cxxDelegate->getTurboModule(name, jsCallInvoker_);
  if (cxxModule) {
    turboModuleCache_.insert({name, cxxModule});
    return cxxModule;
  }

  auto& cxxTurboModuleMapProvider = globalExportedCxxTurboModuleMap();
  auto it = cxxTurboModuleMapProvider.find(name);
  if (it != cxxTurboModuleMapProvider.end()) {
    auto turboModule = it->second(jsCallInvoker_);
    turboModuleCache_.insert({name, turboModule});
    return turboModule;
  }

  static auto getTurboJavaModule =
      javaPart->getClass()
          ->getMethod<jni::alias_ref<JTurboModule>(const std::string&)>(
              "getTurboJavaModule");
  auto moduleInstance = getTurboJavaModule(javaPart.get(), name);
  if (moduleInstance) {
    TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);
    JavaTurboModule::InitParams params = {
        .moduleName = name,
        .instance = moduleInstance,
        .jsInvoker = jsCallInvoker_,
        .nativeMethodCallInvoker = nativeMethodCallInvoker_};

    auto turboModule = cxxDelegate->getTurboModule(name, params);
    if (moduleInstance->isInstanceOf(
            JTurboModuleWithJSIBindings::javaClassStatic())) {
      static auto getBindingsInstaller =
          JTurboModuleWithJSIBindings::javaClassStatic()
              ->getMethod<BindingsInstallerHolder::javaobject()>(
                  "getBindingsInstaller");
      auto installer = getBindingsInstaller(moduleInstance);
      if (installer) {
        installer->cthis()->installBindings(runtime, jsCallInvoker_);
      }
    }

    turboModuleCache_.insert({name, turboModule});
    TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
    return turboModule;
  }

  static auto getTurboLegacyCxxModule =
      javaPart->getClass()
          ->getMethod<jni::alias_ref<CxxModuleWrapper::javaobject>(
              const std::string&)>("getTurboLegacyCxxModule");
  auto legacyCxxModule = getTurboLegacyCxxModule(javaPart.get(), name);
  if (legacyCxxModule) {
    TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);

    auto turboModule = std::make_shared<react::TurboCxxModule>(
        legacyCxxModule->cthis()->getModule(), jsCallInvoker_);
    turboModuleCache_.insert({name, turboModule});

    TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
    return turboModule;
  }

  return nullptr;
}

TurboModuleProviderFunctionType TurboModuleManager::createLegacyModuleProvider(
    jni::alias_ref<jhybridobject> javaPart) {
  return [weakJavaPart = jni::make_weak(javaPart)](
             const std::string& name) -> std::shared_ptr<TurboModule> {
    auto javaPart = weakJavaPart.lockLocal();
    if (!javaPart) {
      return nullptr;
    }

    auto cxxPart = javaPart->cthis();
    if (cxxPart == nullptr) {
      return nullptr;
    }

    return cxxPart->getLegacyModule(javaPart, name);
  };
}

std::shared_ptr<TurboModule> TurboModuleManager::getLegacyModule(
    jni::alias_ref<jhybridobject> javaPart,
    const std::string& name) {
  const char* moduleName = name.c_str();
  TurboModulePerfLogger::moduleJSRequireBeginningStart(moduleName);

  auto legacyModuleLookup = legacyModuleCache_.find(name);
  if (legacyModuleLookup != legacyModuleCache_.end()) {
    TurboModulePerfLogger::moduleJSRequireBeginningCacheHit(moduleName);
    TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);
    return legacyModuleLookup->second;
  }

  TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);

  static auto getLegacyCxxModule =
      javaPart->getClass()
          ->getMethod<jni::alias_ref<CxxModuleWrapper::javaobject>(
              const std::string&)>("getLegacyCxxModule");
  auto legacyCxxModule = getLegacyCxxModule(javaPart.get(), name);

  if (legacyCxxModule) {
    TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);

    auto turboModule = std::make_shared<react::TurboCxxModule>(
        legacyCxxModule->cthis()->getModule(), jsCallInvoker_);
    legacyModuleCache_.insert({name, turboModule});

    TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
    return turboModule;
  }

  static auto getLegacyJavaModule =
      javaPart->getClass()
          ->getMethod<jni::alias_ref<JNativeModule>(const std::string&)>(
              "getLegacyJavaModule");
  auto moduleInstance = getLegacyJavaModule(javaPart.get(), name);

  if (moduleInstance) {
    TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);
    JavaTurboModule::InitParams params = {
        .moduleName = name,
        .instance = moduleInstance,
        .jsInvoker = jsCallInvoker_,
        .nativeMethodCallInvoker = nativeMethodCallInvoker_};

    static auto getMethodDescriptorsFromModule =
        javaPart->getClass()
            ->getStaticMethod<jni::alias_ref<
                jni::JList<JMethodDescriptor::javaobject>::javaobject>(
                jni::alias_ref<JNativeModule>)>(
                "getMethodDescriptorsFromModule");

    auto javaMethodDescriptors =
        getMethodDescriptorsFromModule(javaPart->getClass(), moduleInstance);

    std::vector<JavaInteropTurboModule::MethodDescriptor> methodDescriptors;
    for (jni::alias_ref<JMethodDescriptor> javaMethodDescriptor :
         *javaMethodDescriptors) {
      methodDescriptors.push_back(javaMethodDescriptor->toMethodDescriptor());
    }

    auto turboModule =
        std::make_shared<JavaInteropTurboModule>(params, methodDescriptors);

    legacyModuleCache_.insert({name, turboModule});
    TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
    return turboModule;
  }

  return nullptr;
}

void TurboModuleManager::installJSIBindings(
    jni::alias_ref<jhybridobject> javaPart,
    bool shouldCreateLegacyModules) {
  auto cxxPart = javaPart->cthis();
  if (cxxPart == nullptr || !cxxPart->jsCallInvoker_) {
    return; // Runtime doesn't exist when attached to Chrome debugger.
  }

  cxxPart->runtimeExecutor_([cxxPart,
                             javaPart = jni::make_global(javaPart),
                             shouldCreateLegacyModules](jsi::Runtime& runtime) {
    TurboModuleBinding::install(
        runtime,
        cxxPart->createTurboModuleProvider(javaPart, &runtime),
        shouldCreateLegacyModules
            ? cxxPart->createLegacyModuleProvider(javaPart)
            : nullptr);
  });
}

} // namespace facebook::react
