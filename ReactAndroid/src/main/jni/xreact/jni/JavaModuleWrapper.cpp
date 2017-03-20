// Copyright 2004-present Facebook. All Rights Reserved.

#include "JavaModuleWrapper.h"

#include <fb/fbjni.h>
#include <folly/json.h>
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
  syncMethods_.clear();
  auto descs = wrapper_->getMethodDescriptors();
  for (const auto& desc : *descs) {
    auto methodName = desc->getName();
    auto methodType = desc->getType();

    if (methodType == "sync") {
      // allow for the sync methods vector to have empty values, resize on demand
      size_t methodIndex = ret.size();
      if (methodIndex >= syncMethods_.size()) {
        syncMethods_.resize(methodIndex + 1);
      }
      syncMethods_.insert(syncMethods_.begin() + methodIndex, MethodInvoker(
        desc->getMethod(),
        desc->getSignature(),
        getName() + "." + methodName,
        true
      ));
    }

    ret.emplace_back(
      std::move(methodName),
      std::move(methodType)
    );
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
    return cthis(constants)->consume()[0];
  }
}

bool JavaNativeModule::supportsWebWorkers() {
  static auto supportsWebWorkersMethod =
    wrapper_->getClass()->getMethod<jboolean()>("supportsWebWorkers");
  return supportsWebWorkersMethod(wrapper_);
}

void JavaNativeModule::invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  messageQueueThread_->runOnQueue([this, token, reactMethodId, params=std::move(params)] {
    static auto invokeMethod = wrapper_->getClass()->
      getMethod<void(JExecutorToken::javaobject, jint, ReadableNativeArray::javaobject)>("invoke");
    invokeMethod(wrapper_,
        JExecutorToken::extractJavaPartFromToken(token).get(),
        static_cast<jint>(reactMethodId),
        ReadableNativeArray::newObjectCxxArgs(std::move(params)).get());
  });
}

MethodCallResult JavaNativeModule::callSerializableNativeHook(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) {
  // TODO: evaluate whether calling through invoke is potentially faster
  if (reactMethodId >= syncMethods_.size()) {
    throw std::invalid_argument(
      folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", syncMethods_.size(), "]"));
  }

  auto& method = syncMethods_[reactMethodId];
  CHECK(method.hasValue() && method->isSyncHook()) << "Trying to invoke a asynchronous method as synchronous hook";
  return method->invoke(instance_, wrapper_->getModule(), token, params);
}

NewJavaNativeModule::NewJavaNativeModule(
  std::weak_ptr<Instance> instance,
  jni::alias_ref<JavaModuleWrapper::javaobject> wrapper,
  std::shared_ptr<MessageQueueThread> messageQueueThread)
: instance_(std::move(instance))
, wrapper_(make_global(wrapper))
, module_(make_global(wrapper->getModule()))
, messageQueueThread_(std::move(messageQueueThread)) {
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
    return cthis(constants)->consume()[0];
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
  messageQueueThread_->runOnQueue([this, token, reactMethodId, params=std::move(params)] () mutable {
    invokeInner(token, reactMethodId, std::move(params));
  });
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
