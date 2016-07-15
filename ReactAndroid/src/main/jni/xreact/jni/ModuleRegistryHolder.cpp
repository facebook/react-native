// Copyright 2004-present Facebook. All Rights Reserved.

#include "ModuleRegistryHolder.h"

#include <folly/json.h>

#include <fb/fbjni.h>

#include <cxxreact/CxxModule.h>
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

class CxxNativeModule : public NativeModule {
 public:
  CxxNativeModule(std::weak_ptr<Instance> instance,
                  std::unique_ptr<CxxModule> module)
      : instance_(instance)
      , module_(std::move(module))
      , methods_(module_->getMethods()) {}

  std::string getName() override {
    return module_->getName();
  }

  virtual std::vector<MethodDescriptor> getMethods() override {
    // Same as MessageQueue.MethodTypes.remote
    static const auto kMethodTypeRemote = "remote";

    std::vector<MethodDescriptor> descs;
    for (auto& method : methods_) {
      descs.emplace_back(method.name, kMethodTypeRemote);
    }
    return descs;
  }

  virtual folly::dynamic getConstants() override {
    folly::dynamic constants = folly::dynamic::object();
    for (auto& pair : module_->getConstants()) {
      constants.insert(std::move(pair.first), std::move(pair.second));
    }
    return constants;
  }

  virtual bool supportsWebWorkers() override {
    // TODO(andrews): web worker support in cxxmodules
    return true;
  }

  // TODO mhorowitz: do we need initialize()/onCatalystInstanceDestroy() in C++
  // or only Java?
  virtual void invoke(ExecutorToken token, unsigned int reactMethodId, folly::dynamic&& params) override {
    if (reactMethodId >= methods_.size()) {
      throw std::invalid_argument(
        folly::to<std::string>("methodId ", reactMethodId, " out of range [0..", methods_.size(), "]"));
    }
    if (!params.isArray()) {
      throw std::invalid_argument(
        folly::to<std::string>("method parameters should be array, but are ", params.typeName()));
    }

    CxxModule::Callback first;
    CxxModule::Callback second;

    const auto& method = methods_[reactMethodId];

    if (params.size() < method.callbacks) {
      throw std::invalid_argument(
        folly::to<std::string>("Expected ", method.callbacks, " callbacks, but only ",
                               params.size(), " parameters provided"));
    }

    if (method.callbacks == 1) {
      first = makeCallback(instance_, token, params[params.size() - 1]);
    } else if (method.callbacks == 2) {
      first = makeCallback(instance_, token, params[params.size() - 2]);
      second = makeCallback(instance_, token, params[params.size() - 1]);
    }

    params.resize(params.size() - method.callbacks);

    // I've got a few flawed options here.  I can let the C++ exception
    // propogate, and the registry will log/convert them to java exceptions.
    // This lets all the java and red box handling work ok, but the only info I
    // can capture about the C++ exception is the what() string, not the stack.
    // I can std::terminate() the app.  This causes the full, accurate C++
    // stack trace to be added to logcat by debuggerd.  The java state is lost,
    // but in practice, the java stack is always the same in this case since
    // the javascript stack is not visible, and the crash is unfriendly to js
    // developers, but crucial to C++ developers.  The what() value is also
    // lost.  Finally, I can catch, log the java stack, then rethrow the C++
    // exception.  In this case I get java and C++ stack data, but the C++
    // stack is as of the rethrow, not the original throw, both the C++ and
    // java stacks always look the same.
    //
    // I am going with option 2, since that seems like the most useful
    // choice.  It would be nice to be able to get what() and the C++
    // stack.  I'm told that will be possible in the future.  TODO
    // mhorowitz #7128529: convert C++ exceptions to Java

    try {
      method.func(std::move(params), first, second);
    } catch (const facebook::xplat::JsArgumentException& ex) {
      // This ends up passed to the onNativeException callback.
      throw;
    } catch (...) {
      // This means some C++ code is buggy.  As above, we fail hard so the C++
      // developer can debug and fix it.
      std::terminate();
    }
  }

  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int hookId, folly::dynamic&& args) override {
    throw std::runtime_error("Not supported");
  }

 private:
  std::weak_ptr<Instance> instance_;
  std::unique_ptr<CxxModule> module_;
  std::vector<CxxModule::Method> methods_;
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

Callback makeCallback(std::weak_ptr<Instance> instance, ExecutorToken token, const folly::dynamic& callbackId) {
  if (!callbackId.isInt()) {
    throw std::invalid_argument("Expected callback(s) as final argument");
  }

  auto id = callbackId.getInt();
  return [winstance = std::move(instance), token, id](folly::dynamic args) {
    if (auto instance = winstance.lock()) {
      jni::ThreadScope guard;
      instance->callJSCallback(token, id, std::move(args));
    }
  };
}

}
}
