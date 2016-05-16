// Copyright 2004-present Facebook. All Rights Reserved.

#include "Instance.h"

#include "Executor.h"
#include "MethodCall.h"
#include "SystraceSection.h"

#include <folly/json.h>
#include <folly/Memory.h>

#include <glog/logging.h>

#include <condition_variable>
#include <fstream>
#include <mutex>
#include <string>

namespace facebook {
namespace react {

namespace {
struct ExecutorTokenFactoryImpl : ExecutorTokenFactory {
  ExecutorTokenFactoryImpl(InstanceCallback* callback): callback_(callback) {}
  virtual ExecutorToken createExecutorToken() const {
    return callback_->createExecutorToken();
  }
 private:
  InstanceCallback* callback_;
};
}

class Instance::BridgeCallbackImpl : public BridgeCallback {
 public:
  explicit BridgeCallbackImpl(Instance* instance) : instance_(instance) {}
  virtual void onCallNativeModules(
      ExecutorToken executorToken,
      const std::string& calls,
      bool isEndOfBatch) override {
    instance_->callNativeModules(executorToken, calls, isEndOfBatch);
  }

  virtual void onExecutorUnregistered(ExecutorToken executorToken) override {
    // TODO(cjhopman): implement this.
  }

  virtual MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int hookId, folly::dynamic&& params) override {
    return instance_->callSerializableNativeHook(token, moduleId, hookId, std::move(params));
  }
 private:
  Instance* instance_;
};

Instance::~Instance() {
  if (nativeQueue_) {
    nativeQueue_->quitSynchronous();
    bridge_->destroy();
  }
}

void Instance::initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<MessageQueueThread> nativeQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry) {
  callback_ = std::move(callback);
  nativeQueue_ = std::move(nativeQueue);
  jsQueue_ = jsQueue;
  moduleRegistry_ = moduleRegistry;

  jsQueue_->runOnQueueSync([this, &jsef] {
    bridge_ = folly::make_unique<Bridge>(
      jsef.get(), jsQueue_, folly::make_unique<ExecutorTokenFactoryImpl>(callback_.get()), folly::make_unique<BridgeCallbackImpl>(this));
  });
  SystraceSection s("setBatchedBridgeConfig");

  CHECK(bridge_);

  folly::dynamic nativeModuleDescriptions = folly::dynamic::array();
  {
    SystraceSection s("collectNativeModuleDescriptions");
    nativeModuleDescriptions = moduleRegistry_->moduleDescriptions();
  }

  folly::dynamic config =
    folly::dynamic::object
    ("remoteModuleConfig", std::move(nativeModuleDescriptions));

  SystraceSection t("setGlobalVariable");
  setGlobalVariable(
    "__fbBatchedBridgeConfig",
    folly::make_unique<JSBigStdString>(folly::toJson(config)));
}

void Instance::loadScriptFromString(std::unique_ptr<const JSBigString> string,
                                    std::string sourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("reactbridge_xplat_loadScriptFromString",
                    "sourceURL", sourceURL);
  // TODO mhorowitz: ReactMarker around loadApplicationScript
  bridge_->loadApplicationScript(std::move(string), std::move(sourceURL));
}

void Instance::loadScriptFromFile(const std::string& filename,
                                  const std::string& sourceURL) {
  // TODO mhorowitz: ReactMarker around file read
  std::unique_ptr<JSBigBufferString> buf;
  {
    SystraceSection s("reactbridge_xplat_loadScriptFromFile",
                      "fileName", filename);

    std::ifstream jsfile(filename);
    if (!jsfile) {
      LOG(ERROR) << "Unable to load script from file" << filename;
    } else {
      jsfile.seekg(0, std::ios::end);
      buf.reset(new JSBigBufferString(jsfile.tellg()));
      jsfile.seekg(0, std::ios::beg);
      jsfile.read(buf->data(), buf->size());
    }
  }

  loadScriptFromString(std::move(buf), sourceURL);
}

void Instance::loadUnbundle(std::unique_ptr<JSModulesUnbundle> unbundle,
                            std::unique_ptr<const JSBigString> startupScript,
                            std::string startupScriptSourceURL) {
  callback_->incrementPendingJSCalls();
  SystraceSection s("reactbridge_xplat_setJSModulesUnbundle");
  bridge_->loadApplicationUnbundle(std::move(unbundle), std::move(startupScript),
                                   std::move(startupScriptSourceURL));
}

bool Instance::supportsProfiling() {
  return bridge_->supportsProfiling();
}

void Instance::startProfiler(const std::string& title) {
  return bridge_->startProfiler(title);
}

void Instance::stopProfiler(const std::string& title, const std::string& filename) {
  return bridge_->stopProfiler(title, filename);
}

void Instance::setGlobalVariable(std::string propName,
                                 std::unique_ptr<const JSBigString> jsonValue) {
  bridge_->setGlobalVariable(std::move(propName), std::move(jsonValue));
}

void Instance::callJSFunction(ExecutorToken token, const std::string& module, const std::string& method,
                              folly::dynamic&& params, const std::string& tracingName) {
  SystraceSection s(tracingName.c_str());
  callback_->incrementPendingJSCalls();
  bridge_->callFunction(token, module, method, std::move(params), tracingName);
}

void Instance::callJSCallback(ExecutorToken token, uint64_t callbackId, folly::dynamic&& params) {
  SystraceSection s("<callback>");
  callback_->incrementPendingJSCalls();
  bridge_->invokeCallback(token, (double) callbackId, std::move(params));
}

ExecutorToken Instance::getMainExecutorToken() {
  return bridge_->getMainExecutorToken();
}

void Instance::callNativeModules(ExecutorToken token, const std::string& calls, bool isEndOfBatch) {
  // TODO mhorowitz: avoid copying calls here.
  nativeQueue_->runOnQueue([this, token, calls, isEndOfBatch] {
      try {
        // An exception anywhere in here stops processing of the batch.  This
        // was the behavior of the Android bridge, and since exception handling
        // terminates the whole bridge, there's not much point in continuing.
        for (auto& call : react::parseMethodCalls(calls)) {
          moduleRegistry_->callNativeMethod(
            token, call.moduleId, call.methodId, std::move(call.arguments), call.callId);
        }
        if (isEndOfBatch) {
          callback_->onBatchComplete();
          callback_->decrementPendingJSCalls();
        }
      } catch (const std::exception& e) {
        LOG(ERROR) << folly::exceptionStr(e).toStdString();
        callback_->onNativeException(folly::exceptionStr(e).toStdString());
      } catch (...) {
        LOG(ERROR) << "Unknown exception";
        callback_->onNativeException("Unknown exception");
      }
    });
}

MethodCallResult Instance::callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int methodId, folly::dynamic&& params) {
  return moduleRegistry_->callSerializableNativeHook(token, moduleId, methodId, std::move(params));
}

} // namespace react
} // namespace facebook
