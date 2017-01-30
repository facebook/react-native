// Copyright 2004-present Facebook. All Rights Reserved.

#include "JavaModuleWrapper.h"

#include <folly/json.h>

#include <fb/fbjni.h>

#include <cxxreact/CxxModule.h>
#include <cxxreact/CxxNativeModule.h>
#include <cxxreact/Instance.h>
#include <cxxreact/JsArgumentHelpers.h>
#include <cxxreact/NativeModule.h>

#include "CatalystInstanceImpl.h"
#include "ReadableNativeArray.h"

using facebook::xplat::module::CxxModule;

namespace facebook {
namespace react {

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

std::string JavaNativeModule::getName() {
  static auto getNameMethod = wrapper_->getClass()->getMethod<jstring()>("getName");
  return getNameMethod(wrapper_)->toStdString();
}

std::vector<MethodDescriptor> JavaNativeModule::getMethods() {
  std::vector<MethodDescriptor> ret;
  auto descs = wrapper_->getMethodDescriptors();
  for (const auto& desc : *descs) {
    ret.emplace_back(desc->getName(), desc->getType());
  }
  return ret;
}

folly::dynamic JavaNativeModule::getConstants() {
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

bool JavaNativeModule::supportsWebWorkers() {
  static auto supportsWebWorkersMethod =
    wrapper_->getClass()->getMethod<jboolean()>("supportsWebWorkers");
  return supportsWebWorkersMethod(wrapper_);
}

void JavaNativeModule::invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  static auto invokeMethod =
    wrapper_->getClass()->getMethod<void(JExecutorToken::javaobject, jint, ReadableNativeArray::javaobject)>("invoke");
  invokeMethod(wrapper_, JExecutorToken::extractJavaPartFromToken(token).get(), static_cast<jint>(reactMethodId),
               ReadableNativeArray::newObjectCxxArgs(std::move(params)).get());
}

MethodCallResult JavaNativeModule::callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  throw std::runtime_error("Unsupported operation.");
}

NewJavaNativeModule::NewJavaNativeModule(
  std::weak_ptr<Instance> instance,
  jni::alias_ref<JavaModuleWrapper::javaobject> wrapper)
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

std::string NewJavaNativeModule::getName() {
  static auto getNameMethod = wrapper_->getClass()->getMethod<jstring()>("getName");
  return getNameMethod(wrapper_)->toStdString();
}

std::vector<MethodDescriptor> NewJavaNativeModule::getMethods() {
  return methodDescriptors_;
}

folly::dynamic NewJavaNativeModule::getConstants() {
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

bool NewJavaNativeModule::supportsWebWorkers() {
  static auto supportsWebWorkersMethod =
    wrapper_->getClass()->getMethod<jboolean()>("supportsWebWorkers");
  return supportsWebWorkersMethod(wrapper_);
}

void NewJavaNativeModule::invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  if (reactMethodId >= methods_.size()) {
    throw std::invalid_argument(
      folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", methods_.size(), "]"));
  }
  CHECK(!methods_[reactMethodId].isSyncHook()) << "Trying to invoke a synchronous hook asynchronously";
  invokeInner(token, reactMethodId, std::move(params));
}

MethodCallResult NewJavaNativeModule::callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  if (reactMethodId >= methods_.size()) {
    throw std::invalid_argument(
      folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", methods_.size(), "]"));
  }
  CHECK(methods_[reactMethodId].isSyncHook()) << "Trying to invoke a asynchronous method as synchronous hook";
  return invokeInner(token, reactMethodId, std::move(params));
}

MethodCallResult NewJavaNativeModule::invokeInner(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  return methods_[reactMethodId].invoke(instance_, module_.get(), token, params);
}

jni::local_ref<JReflectMethod::javaobject> JMethodDescriptor::getMethod() const {
  static auto method = javaClassStatic()->getField<JReflectMethod::javaobject>("method");
  return getFieldValue(method);
}

}
}
