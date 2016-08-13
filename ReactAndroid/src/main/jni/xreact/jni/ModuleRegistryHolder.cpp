// Copyright 2004-present Facebook. All Rights Reserved.

#include "ModuleRegistryHolder.h"

#include <folly/json.h>

#include <fb/fbjni.h>

#include <cxxreact/CxxModule.h>
#include <cxxreact/CxxNativeModule.h>
#include <cxxreact/Instance.h>
#include <cxxreact/JsArgumentHelpers.h>
#include <cxxreact/NativeModule.h>

#include "CatalystInstanceImpl.h"
#include "MethodInvoker.h"
#include "ReadableNativeArray.h"

using facebook::xplat::module::CxxModule;

namespace facebook {
namespace react {

namespace {

class JavaNativeModule : public NativeModule {
 public:
  JavaNativeModule(jni::alias_ref<JavaModuleWrapper::javaobject> wrapper)
      : wrapper_(make_global(wrapper)) {}

  std::string getName() override {
    static auto getNameMethod = wrapper_->getClass()->getMethod<jstring()>("getName");
    return getNameMethod(wrapper_)->toStdString();
  }

  std::vector<MethodDescriptor> getMethods() override {
    static auto getMDMethod =
      wrapper_->getClass()->getMethod<jni::JList<JMethodDescriptor::javaobject>::javaobject()>(
        "getMethodDescriptors");

    std::vector<MethodDescriptor> ret;
    auto descs = getMDMethod(wrapper_);
    for (const auto& desc : *descs) {
      static auto nameField =
        JMethodDescriptor::javaClassStatic()->getField<jstring>("name");
      static auto typeField =
        JMethodDescriptor::javaClassStatic()->getField<jstring>("type");

      ret.emplace_back(
        desc->getFieldValue(nameField)->toStdString(),
        desc->getFieldValue(typeField)->toStdString()
      );
    }
    return ret;
  }

  folly::dynamic getConstants() override {
    static auto constantsMethod =
      wrapper_->getClass()->getMethod<NativeArray::javaobject()>("getConstants");
    auto constants = constantsMethod(wrapper_);
    if (!constants) {
      return nullptr;
    } else {
      // See JavaModuleWrapper#getConstants for the other side of this hack.
      return cthis(constants)->array[0];
    }
  }

  virtual bool supportsWebWorkers() override {
    static auto supportsWebWorkersMethod =
      wrapper_->getClass()->getMethod<jboolean()>("supportsWebWorkers");
    return supportsWebWorkersMethod(wrapper_);
  }

  void invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override {
    static auto invokeMethod =
      wrapper_->getClass()->getMethod<void(JExecutorToken::javaobject, jint, ReadableNativeArray::javaobject)>("invoke");
    invokeMethod(wrapper_, JExecutorToken::extractJavaPartFromToken(token).get(), static_cast<jint>(reactMethodId),
                 ReadableNativeArray::newObjectCxxArgs(std::move(params)).get());
  }

  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override {
		throw std::runtime_error("Unsupported operation.");
  }

 private:
  jni::global_ref<JavaModuleWrapper::javaobject> wrapper_;
};

class NewJavaNativeModule : public NativeModule {
 public:
  NewJavaNativeModule(std::weak_ptr<Instance> instance, jni::alias_ref<JavaModuleWrapper::javaobject> wrapper)
      : instance_(std::move(instance)),
      wrapper_(make_global(wrapper)),
      module_(make_global(wrapper->getModule())) {
    auto descs = wrapper_->getMethodDescriptors();
    std::string moduleName = getName();
    methods_.reserve(descs->size());

    for (const auto& desc : *descs) {
      auto type = desc->getType();
      auto name = desc->getName();
      methods_.emplace_back(
          desc->getMethod(),
          desc->getSignature(),
          moduleName + "." + name,
          type == "syncHook");

      methodDescriptors_.emplace_back(name, type);
    }
  }

  std::string getName() override {
    static auto getNameMethod = wrapper_->getClass()->getMethod<jstring()>("getName");
    return getNameMethod(wrapper_)->toStdString();
  }

  std::vector<MethodDescriptor> getMethods() override {
    return methodDescriptors_;
  }

  folly::dynamic getConstants() override {
    static auto constantsMethod =
      wrapper_->getClass()->getMethod<NativeArray::javaobject()>("getConstants");
    auto constants = constantsMethod(wrapper_);
    if (!constants) {
      return nullptr;
    } else {
      // See JavaModuleWrapper#getConstants for the other side of this hack.
      return cthis(constants)->array[0];
    }
  }

  virtual bool supportsWebWorkers() override {
    static auto supportsWebWorkersMethod =
      wrapper_->getClass()->getMethod<jboolean()>("supportsWebWorkers");
    return supportsWebWorkersMethod(wrapper_);
  }

  void invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override {
    if (reactMethodId >= methods_.size()) {
      throw std::invalid_argument(
        folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", methods_.size(), "]"));
    }
    CHECK(!methods_[reactMethodId].isSyncHook()) << "Trying to invoke a synchronous hook asynchronously";
    invokeInner(token, reactMethodId, std::move(params));
  }

  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override {
    if (reactMethodId >= methods_.size()) {
      throw std::invalid_argument(
        folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", methods_.size(), "]"));
    }
    CHECK(methods_[reactMethodId].isSyncHook()) << "Trying to invoke a asynchronous method as synchronous hook";
    return invokeInner(token, reactMethodId, std::move(params));
  }

 private:
  std::weak_ptr<Instance> instance_;
  jni::global_ref<JavaModuleWrapper::javaobject> wrapper_;
  jni::global_ref<JBaseJavaModule::javaobject> module_;
  std::vector<MethodInvoker> methods_;
  std::vector<MethodDescriptor> methodDescriptors_;

  MethodCallResult invokeInner(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
    if (!params.isArray()) {
      throw std::invalid_argument(
        folly::to<std::string>("method parameters should be array, but are ", params.typeName()));
    }
    return methods_[reactMethodId].invoke(instance_, module_.get(), token, params);
  }
};

}

jni::local_ref<JReflectMethod::javaobject> JMethodDescriptor::getMethod() const {
  static auto method = javaClassStatic()->getField<JReflectMethod::javaobject>("method");
  return getFieldValue(method);
}

std::string JMethodDescriptor::getSignature() const {
  static auto signature = javaClassStatic()->getField<jstring>("signature");
  return getFieldValue(signature)->toStdString();
}

std::string JMethodDescriptor::getName() const {
  static auto name = javaClassStatic()->getField<jstring>("name");
  return getFieldValue(name)->toStdString();
}

std::string JMethodDescriptor::getType() const {
  static auto type = javaClassStatic()->getField<jstring>("type");
  return getFieldValue(type)->toStdString();
}

void ModuleRegistryHolder::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ModuleRegistryHolder::initHybrid),
  });
}

ModuleRegistryHolder::ModuleRegistryHolder(
    CatalystInstanceImpl* catalystInstanceImpl,
    jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
    jni::alias_ref<jni::JCollection<CxxModuleWrapper::javaobject>::javaobject> cxxModules) {
  std::vector<std::unique_ptr<NativeModule>> modules;
  std::weak_ptr<Instance> winstance(catalystInstanceImpl->getInstance());
  for (const auto& jm : *javaModules) {
    modules.emplace_back(folly::make_unique<JavaNativeModule>(jm));
  }
  for (const auto& cm : *cxxModules) {
    modules.emplace_back(
      folly::make_unique<CxxNativeModule>(winstance, std::move(cthis(cm)->getModule())));
  }

  registry_ = std::make_shared<ModuleRegistry>(std::move(modules));
}

}
}
