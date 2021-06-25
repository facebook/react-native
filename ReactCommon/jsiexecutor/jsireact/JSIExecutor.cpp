/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "jsireact/JSIExecutor.h"

#include <cxxreact/ErrorUtils.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/ModuleRegistry.h>
#include <cxxreact/ReactMarker.h>
#include <cxxreact/SystraceSection.h>
#include <folly/Conv.h>
#include <folly/json.h>
#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <jsi/instrumentation.h>
#include <reactperflogger/BridgeNativeModulePerfLogger.h>

#include <sstream>
#include <stdexcept>

using namespace facebook::jsi;

namespace facebook {
namespace react {

class JSIExecutor::NativeModuleProxy : public jsi::HostObject {
 public:
  NativeModuleProxy(std::shared_ptr<JSINativeModules> nativeModules)
      : weakNativeModules_(nativeModules) {}

  Value get(Runtime &rt, const PropNameID &name) override {
    if (name.utf8(rt) == "name") {
      return jsi::String::createFromAscii(rt, "NativeModules");
    }

    auto nativeModules = weakNativeModules_.lock();
    if (!nativeModules) {
      return nullptr;
    }

    return nativeModules->getModule(rt, name);
  }

  void set(Runtime &, const PropNameID &, const Value &) override {
    throw std::runtime_error(
        "Unable to put on NativeModules: Operation unsupported");
  }

 private:
  std::weak_ptr<JSINativeModules> weakNativeModules_;
};

namespace {

// basename_r isn't in all iOS SDKs, so use this simple version instead.
std::string simpleBasename(const std::string &path) {
  size_t pos = path.rfind("/");
  return (pos != std::string::npos) ? path.substr(pos) : path;
}

} // namespace

JSIExecutor::JSIExecutor(
    std::shared_ptr<jsi::Runtime> runtime,
    std::shared_ptr<ExecutorDelegate> delegate,
    const JSIScopedTimeoutInvoker &scopedTimeoutInvoker,
    RuntimeInstaller runtimeInstaller)
    : runtime_(runtime),
      delegate_(delegate),
      nativeModules_(std::make_shared<JSINativeModules>(
          delegate ? delegate->getModuleRegistry() : nullptr)),
      moduleRegistry_(delegate ? delegate->getModuleRegistry() : nullptr),
      scopedTimeoutInvoker_(scopedTimeoutInvoker),
      runtimeInstaller_(runtimeInstaller) {
  runtime_->global().setProperty(
      *runtime, "__jsiExecutorDescription", runtime->description());
}

void JSIExecutor::initializeRuntime() {
  SystraceSection s("JSIExecutor::initializeRuntime");
  runtime_->global().setProperty(
      *runtime_,
      "nativeModuleProxy",
      Object::createFromHostObject(
          *runtime_, std::make_shared<NativeModuleProxy>(nativeModules_)));

  runtime_->global().setProperty(
      *runtime_,
      "nativeFlushQueueImmediate",
      Function::createFromHostFunction(
          *runtime_,
          PropNameID::forAscii(*runtime_, "nativeFlushQueueImmediate"),
          1,
          [this](
              jsi::Runtime &,
              const jsi::Value &,
              const jsi::Value *args,
              size_t count) {
            if (count != 1) {
              throw std::invalid_argument(
                  "nativeFlushQueueImmediate arg count must be 1");
            }
            callNativeModules(args[0], false);
            return Value::undefined();
          }));

  runtime_->global().setProperty(
      *runtime_,
      "nativeCallSyncHook",
      Function::createFromHostFunction(
          *runtime_,
          PropNameID::forAscii(*runtime_, "nativeCallSyncHook"),
          1,
          [this](
              jsi::Runtime &,
              const jsi::Value &,
              const jsi::Value *args,
              size_t count) { return nativeCallSyncHook(args, count); }));

#if DEBUG
  runtime_->global().setProperty(
      *runtime_,
      "globalEvalWithSourceUrl",
      Function::createFromHostFunction(
          *runtime_,
          PropNameID::forAscii(*runtime_, "globalEvalWithSourceUrl"),
          1,
          [this](
              jsi::Runtime &,
              const jsi::Value &,
              const jsi::Value *args,
              size_t count) { return globalEvalWithSourceUrl(args, count); }));
#endif

  if (runtimeInstaller_) {
    runtimeInstaller_(*runtime_);
  }
  bool hasLogger(ReactMarker::logTaggedMarker);
  if (hasLogger) {
    ReactMarker::logMarker(ReactMarker::CREATE_REACT_CONTEXT_STOP);
  }
}

void JSIExecutor::loadBundle(
    std::unique_ptr<const JSBigString> script,
    std::string sourceURL) {
  SystraceSection s("JSIExecutor::loadBundle");

  bool hasLogger(ReactMarker::logTaggedMarker);
  std::string scriptName = simpleBasename(sourceURL);
  if (hasLogger) {
    ReactMarker::logTaggedMarker(
        ReactMarker::RUN_JS_BUNDLE_START, scriptName.c_str());
  }
  runtime_->evaluateJavaScript(
      std::make_unique<BigStringBuffer>(std::move(script)), sourceURL);
  flush();
  if (hasLogger) {
    ReactMarker::logTaggedMarker(
        ReactMarker::RUN_JS_BUNDLE_STOP, scriptName.c_str());
  }
}

void JSIExecutor::setBundleRegistry(std::unique_ptr<RAMBundleRegistry> r) {
  if (!bundleRegistry_) {
    runtime_->global().setProperty(
        *runtime_,
        "nativeRequire",
        Function::createFromHostFunction(
            *runtime_,
            PropNameID::forAscii(*runtime_, "nativeRequire"),
            2,
            [this](
                __unused Runtime &rt,
                const facebook::jsi::Value &,
                const facebook::jsi::Value *args,
                size_t count) { return nativeRequire(args, count); }));
  }
  bundleRegistry_ = std::move(r);
}

void JSIExecutor::registerBundle(
    uint32_t bundleId,
    const std::string &bundlePath) {
  const auto tag = folly::to<std::string>(bundleId);
  ReactMarker::logTaggedMarker(
      ReactMarker::REGISTER_JS_SEGMENT_START, tag.c_str());
  if (bundleRegistry_) {
    bundleRegistry_->registerBundle(bundleId, bundlePath);
  } else {
    auto script = JSBigFileString::fromPath(bundlePath);
    if (script->size() == 0) {
      throw std::invalid_argument(
          "Empty bundle registered with ID " + tag + " from " + bundlePath);
    }
    runtime_->evaluateJavaScript(
        std::make_unique<BigStringBuffer>(std::move(script)),
        JSExecutor::getSyntheticBundlePath(bundleId, bundlePath));
  }
  ReactMarker::logTaggedMarker(
      ReactMarker::REGISTER_JS_SEGMENT_STOP, tag.c_str());
}

// Looping on \c drainMicrotasks until it completes or hits the retries bound.
static void performMicrotaskCheckpoint(jsi::Runtime &runtime) {
  uint8_t retries = 0;
  // A heuristic number to guard inifinite or absurd numbers of retries.
  const static unsigned int kRetriesBound = 255;

  while (retries < kRetriesBound) {
    try {
      // The default behavior of \c drainMicrotasks is unbounded execution.
      // We may want to make it bounded in the future.
      if (runtime.drainMicrotasks()) {
        break;
      }
    } catch (jsi::JSError &error) {
      handleJSError(runtime, error, true);
    }
    retries++;
  }

  if (retries == kRetriesBound) {
    throw std::runtime_error("Hits microtasks retries bound.");
  }
}

void JSIExecutor::callFunction(
    const std::string &moduleId,
    const std::string &methodId,
    const folly::dynamic &arguments) {
  SystraceSection s(
      "JSIExecutor::callFunction", "moduleId", moduleId, "methodId", methodId);
  if (!callFunctionReturnFlushedQueue_) {
    bindBridge();
  }

  // Construct the error message producer in case this times out.
  // This is executed on a background thread, so it must capture its parameters
  // by value.
  auto errorProducer = [=] {
    std::stringstream ss;
    ss << "moduleID: " << moduleId << " methodID: " << methodId
       << " arguments: " << folly::toJson(arguments);
    return ss.str();
  };

  Value ret = Value::undefined();
  try {
    scopedTimeoutInvoker_(
        [&] {
          ret = callFunctionReturnFlushedQueue_->call(
              *runtime_,
              moduleId,
              methodId,
              valueFromDynamic(*runtime_, arguments));
        },
        std::move(errorProducer));
  } catch (...) {
    std::throw_with_nested(
        std::runtime_error("Error calling " + moduleId + "." + methodId));
  }

  performMicrotaskCheckpoint(*runtime_);

  callNativeModules(ret, true);
}

void JSIExecutor::invokeCallback(
    const double callbackId,
    const folly::dynamic &arguments) {
  SystraceSection s("JSIExecutor::invokeCallback", "callbackId", callbackId);
  if (!invokeCallbackAndReturnFlushedQueue_) {
    bindBridge();
  }
  Value ret;
  try {
    ret = invokeCallbackAndReturnFlushedQueue_->call(
        *runtime_, callbackId, valueFromDynamic(*runtime_, arguments));
  } catch (...) {
    std::throw_with_nested(std::runtime_error(
        folly::to<std::string>("Error invoking callback ", callbackId)));
  }

  performMicrotaskCheckpoint(*runtime_);

  callNativeModules(ret, true);
}

void JSIExecutor::setGlobalVariable(
    std::string propName,
    std::unique_ptr<const JSBigString> jsonValue) {
  SystraceSection s("JSIExecutor::setGlobalVariable", "propName", propName);
  runtime_->global().setProperty(
      *runtime_,
      propName.c_str(),
      Value::createFromJsonUtf8(
          *runtime_,
          reinterpret_cast<const uint8_t *>(jsonValue->c_str()),
          jsonValue->size()));
}

std::string JSIExecutor::getDescription() {
  return "JSI (" + runtime_->description() + ")";
}

void *JSIExecutor::getJavaScriptContext() {
  return runtime_.get();
}

bool JSIExecutor::isInspectable() {
  return runtime_->isInspectable();
}

void JSIExecutor::handleMemoryPressure(int pressureLevel) {
  // The level is an enum value passed by the Android OS to an onTrimMemory
  // event callback. Defined in ComponentCallbacks2.
  enum AndroidMemoryPressure {
    TRIM_MEMORY_BACKGROUND = 40,
    TRIM_MEMORY_COMPLETE = 80,
    TRIM_MEMORY_MODERATE = 60,
    TRIM_MEMORY_RUNNING_CRITICAL = 15,
    TRIM_MEMORY_RUNNING_LOW = 10,
    TRIM_MEMORY_RUNNING_MODERATE = 5,
    TRIM_MEMORY_UI_HIDDEN = 20,
  };
  const char *levelName;
  switch (pressureLevel) {
    case TRIM_MEMORY_BACKGROUND:
      levelName = "TRIM_MEMORY_BACKGROUND";
      break;
    case TRIM_MEMORY_COMPLETE:
      levelName = "TRIM_MEMORY_COMPLETE";
      break;
    case TRIM_MEMORY_MODERATE:
      levelName = "TRIM_MEMORY_MODERATE";
      break;
    case TRIM_MEMORY_RUNNING_CRITICAL:
      levelName = "TRIM_MEMORY_RUNNING_CRITICAL";
      break;
    case TRIM_MEMORY_RUNNING_LOW:
      levelName = "TRIM_MEMORY_RUNNING_LOW";
      break;
    case TRIM_MEMORY_RUNNING_MODERATE:
      levelName = "TRIM_MEMORY_RUNNING_MODERATE";
      break;
    case TRIM_MEMORY_UI_HIDDEN:
      levelName = "TRIM_MEMORY_UI_HIDDEN";
      break;
    default:
      levelName = "UNKNOWN";
      break;
  }

  switch (pressureLevel) {
    case TRIM_MEMORY_RUNNING_LOW:
    case TRIM_MEMORY_RUNNING_MODERATE:
    case TRIM_MEMORY_UI_HIDDEN:
      // For non-severe memory trims, do nothing.
      LOG(INFO) << "Memory warning (pressure level: " << levelName
                << ") received by JS VM, ignoring because it's non-severe";
      break;
    case TRIM_MEMORY_BACKGROUND:
    case TRIM_MEMORY_COMPLETE:
    case TRIM_MEMORY_MODERATE:
    case TRIM_MEMORY_RUNNING_CRITICAL:
      // For now, pressureLevel is unused by collectGarbage.
      // This may change in the future if the JS GC has different styles of
      // collections.
      LOG(INFO) << "Memory warning (pressure level: " << levelName
                << ") received by JS VM, running a GC";
      runtime_->instrumentation().collectGarbage(levelName);
      break;
    default:
      // Use the raw number instead of the name here since the name is
      // meaningless.
      LOG(WARNING) << "Memory warning (pressure level: " << pressureLevel
                   << ") received by JS VM, unrecognized pressure level";
      break;
  }
}

void JSIExecutor::bindBridge() {
  std::call_once(bindFlag_, [this] {
    SystraceSection s("JSIExecutor::bindBridge (once)");
    Value batchedBridgeValue =
        runtime_->global().getProperty(*runtime_, "__fbBatchedBridge");
    if (batchedBridgeValue.isUndefined() || !batchedBridgeValue.isObject()) {
      throw JSINativeException(
          "Could not get BatchedBridge, make sure your bundle is packaged correctly");
    }

    Object batchedBridge = batchedBridgeValue.asObject(*runtime_);
    callFunctionReturnFlushedQueue_ = batchedBridge.getPropertyAsFunction(
        *runtime_, "callFunctionReturnFlushedQueue");
    invokeCallbackAndReturnFlushedQueue_ = batchedBridge.getPropertyAsFunction(
        *runtime_, "invokeCallbackAndReturnFlushedQueue");
    flushedQueue_ =
        batchedBridge.getPropertyAsFunction(*runtime_, "flushedQueue");
  });
}

void JSIExecutor::callNativeModules(const Value &queue, bool isEndOfBatch) {
  SystraceSection s("JSIExecutor::callNativeModules");
  // If this fails, you need to pass a fully functional delegate with a
  // module registry to the factory/ctor.
  CHECK(delegate_) << "Attempting to use native modules without a delegate";
#if 0 // maybe useful for debugging
  std::string json = runtime_->global().getPropertyAsObject(*runtime_, "JSON")
    .getPropertyAsFunction(*runtime_, "stringify").call(*runtime_, queue)
    .getString(*runtime_).utf8(*runtime_);
#endif
  BridgeNativeModulePerfLogger::asyncMethodCallBatchPreprocessStart();

  delegate_->callNativeModules(
      *this, dynamicFromValue(*runtime_, queue), isEndOfBatch);
}

void JSIExecutor::flush() {
  SystraceSection s("JSIExecutor::flush");
  if (flushedQueue_) {
    Value ret = flushedQueue_->call(*runtime_);
    performMicrotaskCheckpoint(*runtime_);
    callNativeModules(ret, true);
    return;
  }

  // When a native module is called from JS, BatchedBridge.enqueueNativeCall()
  // is invoked.  For that to work, require('BatchedBridge') has to be called,
  // and when that happens, __fbBatchedBridge is set as a side effect.
  Value batchedBridge =
      runtime_->global().getProperty(*runtime_, "__fbBatchedBridge");
  // So here, if __fbBatchedBridge doesn't exist, then we know no native calls
  // have happened, and we were able to determine this without forcing
  // BatchedBridge to be loaded as a side effect.
  if (!batchedBridge.isUndefined()) {
    // If calls were made, we bind to the JS bridge methods, and use them to
    // get the pending queue of native calls.
    bindBridge();
    Value ret = flushedQueue_->call(*runtime_);
    performMicrotaskCheckpoint(*runtime_);
    callNativeModules(ret, true);
  } else if (delegate_) {
    // If we have a delegate, we need to call it; we pass a null list to
    // callNativeModules, since we know there are no native calls, without
    // calling into JS again.  If no calls were made and there's no delegate,
    // nothing happens, which is correct.
    callNativeModules(nullptr, true);
  }
}

Value JSIExecutor::nativeRequire(const Value *args, size_t count) {
  if (count > 2 || count == 0) {
    throw std::invalid_argument("Got wrong number of args");
  }

  uint32_t moduleId = folly::to<uint32_t>(args[0].getNumber());
  uint32_t bundleId = count == 2 ? folly::to<uint32_t>(args[1].getNumber()) : 0;
  auto module = bundleRegistry_->getModule(bundleId, moduleId);

  runtime_->evaluateJavaScript(
      std::make_unique<StringBuffer>(module.code), module.name);
  return facebook::jsi::Value();
}

Value JSIExecutor::nativeCallSyncHook(const Value *args, size_t count) {
  if (count != 3) {
    throw std::invalid_argument("nativeCallSyncHook arg count must be 3");
  }

  if (!args[2].isObject() || !args[2].asObject(*runtime_).isArray(*runtime_)) {
    throw std::invalid_argument(
        folly::to<std::string>("method parameters should be array"));
  }

  unsigned int moduleId = static_cast<unsigned int>(args[0].getNumber());
  unsigned int methodId = static_cast<unsigned int>(args[1].getNumber());
  std::string moduleName;
  std::string methodName;

  if (moduleRegistry_) {
    moduleName = moduleRegistry_->getModuleName(moduleId);
    methodName = moduleRegistry_->getModuleSyncMethodName(moduleId, methodId);

    BridgeNativeModulePerfLogger::syncMethodCallStart(
        moduleName.c_str(), methodName.c_str());

    BridgeNativeModulePerfLogger::syncMethodCallArgConversionStart(
        moduleName.c_str(), methodName.c_str());
  }

  MethodCallResult result = delegate_->callSerializableNativeHook(
      *this, moduleId, methodId, dynamicFromValue(*runtime_, args[2]));

  /**
   * Note:
   * In RCTNativeModule, folly::none is returned from callSerializableNativeHook
   * when executing a NativeModule method fails. Therefore, it's safe to not
   * terminate the syncMethodCall when folly::none is returned.
   *
   * TODO: In JavaNativeModule, folly::none is returned when the synchronous
   * NativeModule method has the void return type. Change this to return
   * folly::dynamic(nullptr) instead, so that folly::none is reserved for
   * exceptional scenarios.
   *
   * TODO: Investigate CxxModule infra to see if folly::none is used for
   * returns in exceptional scenarios.
   **/

  if (!result.hasValue()) {
    return Value::undefined();
  }

  Value returnValue = valueFromDynamic(*runtime_, result.value());

  if (moduleRegistry_) {
    BridgeNativeModulePerfLogger::syncMethodCallReturnConversionEnd(
        moduleName.c_str(), methodName.c_str());
    BridgeNativeModulePerfLogger::syncMethodCallEnd(
        moduleName.c_str(), methodName.c_str());
  }

  return returnValue;
}

#if DEBUG
Value JSIExecutor::globalEvalWithSourceUrl(const Value *args, size_t count) {
  if (count != 1 && count != 2) {
    throw std::invalid_argument(
        "globalEvalWithSourceUrl arg count must be 1 or 2");
  }

  auto code = args[0].asString(*runtime_).utf8(*runtime_);
  std::string url;
  if (count > 1 && args[1].isString()) {
    url = args[1].asString(*runtime_).utf8(*runtime_);
  }

  return runtime_->evaluateJavaScript(
      std::make_unique<StringBuffer>(std::move(code)), url);
}
#endif

void bindNativeLogger(Runtime &runtime, Logger logger) {
  runtime.global().setProperty(
      runtime,
      "nativeLoggingHook",
      Function::createFromHostFunction(
          runtime,
          PropNameID::forAscii(runtime, "nativeLoggingHook"),
          2,
          [logger = std::move(logger)](
              jsi::Runtime &runtime,
              const jsi::Value &,
              const jsi::Value *args,
              size_t count) {
            if (count != 2) {
              throw std::invalid_argument(
                  "nativeLoggingHook takes 2 arguments");
            }
            logger(
                args[0].asString(runtime).utf8(runtime),
                folly::to<unsigned int>(args[1].asNumber()));
            return Value::undefined();
          }));
}

void bindNativePerformanceNow(Runtime &runtime, PerformanceNow performanceNow) {
  runtime.global().setProperty(
      runtime,
      "nativePerformanceNow",
      Function::createFromHostFunction(
          runtime,
          PropNameID::forAscii(runtime, "nativePerformanceNow"),
          0,
          [performanceNow = std::move(performanceNow)](
              jsi::Runtime &runtime,
              const jsi::Value &,
              const jsi::Value *args,
              size_t count) { return Value(performanceNow()); }));
}

} // namespace react
} // namespace facebook
