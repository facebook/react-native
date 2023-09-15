/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstance.h"

#include <cxxreact/ErrorUtils.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/JSExecutor.h>
#include <cxxreact/SystraceSection.h>
#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <jsi/instrumentation.h>
#include <jsireact/JSIExecutor.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

#include <cxxreact/ReactMarker.h>
#include <iostream>
#include <tuple>
#include <utility>

namespace facebook::react {

// Looping on \c drainMicrotasks until it completes or hits the retries bound.
static void performMicrotaskCheckpoint(jsi::Runtime& runtime) {
  uint8_t retries = 0;
  // A heuristic number to guard inifinite or absurd numbers of retries.
  constexpr unsigned int kRetriesBound = 255;

  while (retries < kRetriesBound) {
    try {
      // The default behavior of \c drainMicrotasks is unbounded execution.
      // We may want to make it bounded in the future.
      if (runtime.drainMicrotasks()) {
        break;
      }
    } catch (jsi::JSError& error) {
      handleJSError(runtime, error, true);
    }
    retries++;
  }

  if (retries == kRetriesBound) {
    throw std::runtime_error("Hits microtasks retries bound.");
  }
}

ReactInstance::ReactInstance(
    std::unique_ptr<jsi::Runtime> runtime,
    std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
    std::shared_ptr<TimerManager> timerManager,
    JsErrorHandler::JsErrorHandlingFunc jsErrorHandlingFunc)
    : runtime_(std::move(runtime)),
      jsMessageQueueThread_(jsMessageQueueThread),
      timerManager_(std::move(timerManager)),
      jsErrorHandler_(jsErrorHandlingFunc),
      hasFatalJsError_(std::make_shared<bool>(false)) {
  auto runtimeExecutor = [weakRuntime = std::weak_ptr<jsi::Runtime>(runtime_),
                          weakTimerManager =
                              std::weak_ptr<TimerManager>(timerManager_),
                          weakJsMessageQueueThread =
                              std::weak_ptr<MessageQueueThread>(
                                  jsMessageQueueThread_),
                          weakHasFatalJsError =
                              std::weak_ptr<bool>(hasFatalJsError_)](
                             std::function<void(jsi::Runtime & runtime)>&&
                                 callback) {
    if (std::shared_ptr<bool> sharedHasFatalJsError =
            weakHasFatalJsError.lock()) {
      if (*sharedHasFatalJsError) {
        LOG(INFO)
            << "Calling into JS using runtimeExecutor but hasFatalJsError_ is true";
        return;
      }
    }
    if (weakRuntime.expired()) {
      return;
    }

    if (std::shared_ptr<MessageQueueThread> sharedJsMessageQueueThread =
            weakJsMessageQueueThread.lock()) {
      sharedJsMessageQueueThread->runOnQueue(
          [weakRuntime, weakTimerManager, callback = std::move(callback)]() {
            if (auto strongRuntime = weakRuntime.lock()) {
              SystraceSection s("ReactInstance::_runtimeExecutor[Callback]");
              try {
                callback(*strongRuntime);
                if (auto strongTimerManager = weakTimerManager.lock()) {
                  strongTimerManager->callReactNativeMicrotasks(*strongRuntime);
                }
                performMicrotaskCheckpoint(*strongRuntime);
              } catch (jsi::JSError& originalError) {
                handleJSError(*strongRuntime, originalError, true);
              }
            }
          });
    }
  };

  runtimeScheduler_ =
      std::make_shared<RuntimeScheduler>(std::move(runtimeExecutor));

  auto pipedRuntimeExecutor =
      [runtimeScheduler = runtimeScheduler_.get()](
          std::function<void(jsi::Runtime & runtime)>&& callback) {
        runtimeScheduler->scheduleWork(std::move(callback));
      };

  bufferedRuntimeExecutor_ =
      std::make_shared<BufferedRuntimeExecutor>(pipedRuntimeExecutor);
}

RuntimeExecutor ReactInstance::getUnbufferedRuntimeExecutor() noexcept {
  return [runtimeScheduler = runtimeScheduler_.get()](
             std::function<void(jsi::Runtime & runtime)>&& callback) {
    runtimeScheduler->scheduleWork(std::move(callback));
  };
}

// This BufferedRuntimeExecutor ensures that the main JS bundle finished
// execution before any JS queued into it from C++ are executed. Use
// getBufferedRuntimeExecutor() instead if you do not need the main JS bundle to
// have finished. e.g. setting global variables into JS runtime.
RuntimeExecutor ReactInstance::getBufferedRuntimeExecutor() noexcept {
  return [weakBufferedRuntimeExecutor_ =
              std::weak_ptr<BufferedRuntimeExecutor>(bufferedRuntimeExecutor_)](
             std::function<void(jsi::Runtime & runtime)>&& callback) {
    if (auto strongBufferedRuntimeExecutor_ =
            weakBufferedRuntimeExecutor_.lock()) {
      strongBufferedRuntimeExecutor_->execute(std::move(callback));
    }
  };
}

std::shared_ptr<RuntimeScheduler>
ReactInstance::getRuntimeScheduler() noexcept {
  return runtimeScheduler_;
}

/**
 * Defines a property on the global object that is neither enumerable, nor
 * configurable, nor writable. This ensures that the private globals exposed by
 * ReactInstance cannot overwritten by third-party JavaScript code. It also
 * ensures that third-party JavaScript code unaware of these globals isn't able
 * to accidentally access them. In JavaScript, equivalent to:
 *
 * Object.defineProperty(global, propName, {
 *   value: value
 * })
 */
static void defineReadOnlyGlobal(
    jsi::Runtime& runtime,
    std::string propName,
    jsi::Value&& value) {
  if (runtime.global().hasProperty(runtime, propName.c_str())) {
    throw jsi::JSError(
        runtime,
        "Tried to redefine read-only global \"" + propName +
            "\", but read-only globals can only be defined once.");
  }
  jsi::Object jsObject =
      runtime.global().getProperty(runtime, "Object").asObject(runtime);
  jsi::Function defineProperty = jsObject.getProperty(runtime, "defineProperty")
                                     .asObject(runtime)
                                     .asFunction(runtime);

  jsi::Object descriptor = jsi::Object(runtime);
  descriptor.setProperty(runtime, "value", std::move(value));
  defineProperty.callWithThis(
      runtime,
      jsObject,
      runtime.global(),
      jsi::String::createFromUtf8(runtime, propName),
      descriptor);
}

namespace {

// Copied from JSIExecutor.cpp
// basename_r isn't in all iOS SDKs, so use this simple version instead.
std::string simpleBasename(const std::string& path) {
  size_t pos = path.rfind("/");
  return (pos != std::string::npos) ? path.substr(pos) : path;
}

} // namespace

/**
 * Load the JS bundle and flush buffered JS calls, future JS calls won't be
 * buffered after calling this.
 * Note that this method is asynchronous. However, a completion callback
 * isn't needed because all calls into JS should be dispatched to the JSThread,
 * preferably via the runtimeExecutor_.
 */
void ReactInstance::loadScript(
    std::unique_ptr<const JSBigString> script,
    const std::string& sourceURL) {
  auto buffer = std::make_shared<BigStringBuffer>(std::move(script));
  std::string scriptName = simpleBasename(sourceURL);

  runtimeScheduler_->scheduleWork(
      [this,
       scriptName,
       sourceURL,
       buffer = std::move(buffer),
       weakBufferedRuntimeExecuter = std::weak_ptr<BufferedRuntimeExecutor>(
           bufferedRuntimeExecutor_)](jsi::Runtime& runtime) {
        try {
          SystraceSection s("ReactInstance::loadScript");
          bool hasLogger(ReactMarker::logTaggedMarkerBridgelessImpl);
          if (hasLogger) {
            ReactMarker::logTaggedMarkerBridgeless(
                ReactMarker::RUN_JS_BUNDLE_START, scriptName.c_str());
          }

          runtime.evaluateJavaScript(buffer, sourceURL);
          if (hasLogger) {
            ReactMarker::logTaggedMarkerBridgeless(
                ReactMarker::RUN_JS_BUNDLE_STOP, scriptName.c_str());
            ReactMarker::logMarkerBridgeless(
                ReactMarker::INIT_REACT_RUNTIME_STOP);
            ReactMarker::logMarkerBridgeless(ReactMarker::APP_STARTUP_STOP);
          }
          if (auto strongBufferedRuntimeExecuter =
                  weakBufferedRuntimeExecuter.lock()) {
            strongBufferedRuntimeExecuter->flush();
          }
        } catch (jsi::JSError& error) {
          // Handle uncaught JS errors during loading JS bundle
          *hasFatalJsError_ = true;
          this->jsErrorHandler_.handleJsError(error, true);
        }
      });
}

/*
 * Calls a method on a JS module that has been registered with
 * `registerCallableModule`. Used to invoke a JS function from platform code.
 */
void ReactInstance::callFunctionOnModule(
    const std::string& moduleName,
    const std::string& methodName,
    const folly::dynamic& args) {
  // TODO (C++ 20): This code previously implicitly captured `this` in a [=]
  // capture group. Was it meaning to pass modules_ by value?
  bufferedRuntimeExecutor_->execute([=, this](jsi::Runtime& runtime) {
    SystraceSection s(
        "ReactInstance::callFunctionOnModule",
        "moduleName",
        moduleName,
        "methodName",
        methodName);
    if (modules_.find(moduleName) == modules_.end()) {
      std::ostringstream knownModules;
      int i = 0;
      for (auto it = modules_.begin(); it != modules_.end(); it++, i++) {
        const char* space = (i > 0 ? ", " : " ");
        knownModules << space << it->first;
      }
      throw jsi::JSError(
          runtime,
          "Failed to call into JavaScript module method " + moduleName + "." +
              methodName +
              "(). Module has not been registered as callable. Registered callable JavaScript modules (n = " +
              std::to_string(modules_.size()) + "):" + knownModules.str() +
              ". Did you forget to call `RN$registerCallableModule`?");
    }

    auto module = modules_[moduleName]->factory.call(runtime).asObject(runtime);
    auto method = module.getProperty(runtime, methodName.c_str());
    if (method.isUndefined()) {
      throw jsi::JSError(
          runtime,
          "Failed to call into JavaScript module method " + moduleName + "." +
              methodName + ". Module exists, but the method is undefined.");
    }

    std::vector<jsi::Value> jsArgs;
    for (auto& arg : args) {
      jsArgs.push_back(jsi::valueFromDynamic(runtime, arg));
    }
    method.asObject(runtime).asFunction(runtime).callWithThis(
        runtime, module, (const jsi::Value*)jsArgs.data(), jsArgs.size());
  });
}

void ReactInstance::registerSegment(
    uint32_t segmentId,
    const std::string& segmentPath) {
  LOG(WARNING) << "Starting to run ReactInstance::registerSegment with segment "
               << segmentId;
  runtimeScheduler_->scheduleWork([=](jsi::Runtime& runtime) {
    SystraceSection s("ReactInstance::registerSegment");
    const auto tag = folly::to<std::string>(segmentId);
    auto script = JSBigFileString::fromPath(segmentPath);
    if (script->size() == 0) {
      throw std::invalid_argument(
          "Empty segment registered with ID " + tag + " from " + segmentPath);
    }
    auto buffer = std::make_shared<BigStringBuffer>(std::move(script));

    bool hasLogger(ReactMarker::logTaggedMarkerBridgelessImpl);
    if (hasLogger) {
      ReactMarker::logTaggedMarkerBridgeless(
          ReactMarker::REGISTER_JS_SEGMENT_START, tag.c_str());
    }
    LOG(WARNING) << "Starting to evaluate segment " << segmentId
                 << " in ReactInstance::registerSegment";
    runtime.evaluateJavaScript(
        buffer, JSExecutor::getSyntheticBundlePath(segmentId, segmentPath));
    LOG(WARNING) << "Finished evaluating segment " << segmentId
                 << " in ReactInstance::registerSegment";
    if (hasLogger) {
      ReactMarker::logTaggedMarkerBridgeless(
          ReactMarker::REGISTER_JS_SEGMENT_STOP, tag.c_str());
    }
  });
}

namespace {
void defineReactInstanceFlags(
    jsi::Runtime& runtime,
    ReactInstance::JSRuntimeFlags options) noexcept {
  defineReadOnlyGlobal(runtime, "RN$Bridgeless", jsi::Value(true));

  if (options.isProfiling) {
    defineReadOnlyGlobal(runtime, "__RCTProfileIsProfiling", jsi::Value(true));
  }

  if (options.runtimeDiagnosticFlags.length() > 0) {
    defineReadOnlyGlobal(
        runtime,
        "RN$DiagnosticFlags",
        jsi::String::createFromUtf8(runtime, options.runtimeDiagnosticFlags));
  }
}

} // namespace

void ReactInstance::initializeRuntime(
    JSRuntimeFlags options,
    BindingsInstallFunc bindingsInstallFunc) noexcept {
  runtimeScheduler_->scheduleWork([this, options, bindingsInstallFunc](
                                      jsi::Runtime& runtime) {
    SystraceSection s("ReactInstance::initializeRuntime");

    bindNativePerformanceNow(runtime);

    RuntimeSchedulerBinding::createAndInstallIfNeeded(
        runtime, runtimeScheduler_);

    defineReactInstanceFlags(runtime, options);

    defineReadOnlyGlobal(
        runtime,
        "RN$registerCallableModule",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "registerCallableModule"),
            2,
            [this](
                jsi::Runtime& runtime,
                const jsi::Value& /*unused*/,
                const jsi::Value* args,
                size_t count) {
              if (count != 2) {
                throw jsi::JSError(
                    runtime,
                    "registerCallableModule requires exactly 2 arguments");
              }
              if (!args[0].isString()) {
                throw jsi::JSError(
                    runtime,
                    "The first argument to registerCallableModule must be a string (the name of the JS module).");
              }
              auto name = args[0].asString(runtime).utf8(runtime);
              if (!args[1].isObject() ||
                  !args[1].asObject(runtime).isFunction(runtime)) {
                throw jsi::JSError(
                    runtime,
                    "The second argument to registerCallableModule must be a function that returns the JS module.");
              }
              modules_[name] = std::make_shared<CallableModule>(
                  args[1].getObject(runtime).asFunction(runtime));
              return jsi::Value::undefined();
            }));

    timerManager_->attachGlobals(runtime);

    bindingsInstallFunc(runtime);
  });
}

void ReactInstance::handleMemoryPressureJs(int pressureLevel) {
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
  const char* levelName;
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
      runtimeScheduler_->scheduleWork([=](jsi::Runtime& runtime) {
        SystraceSection s("ReactInstance::handleMemoryPressure");
        runtime.instrumentation().collectGarbage(levelName);
      });
      break;
    default:
      // Use the raw number instead of the name here since the name is
      // meaningless.
      LOG(WARNING) << "Memory warning (pressure level: " << pressureLevel
                   << ") received by JS VM, unrecognized pressure level";
      break;
  }
}

} // namespace facebook::react
