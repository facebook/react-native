/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactInstance.h"

#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/ErrorUtils.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/JSExecutor.h>
#include <cxxreact/ReactMarker.h>
#include <cxxreact/SystraceSection.h>
#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <jsi/instrumentation.h>
#include <jsinspector-modern/HostTarget.h>
#include <jsireact/JSIExecutor.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/utils/jsi-utils.h>
#include <iostream>
#include <memory>
#include <utility>

namespace facebook::react {

ReactInstance::ReactInstance(
    std::unique_ptr<JSRuntime> runtime,
    std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
    std::shared_ptr<TimerManager> timerManager,
    JsErrorHandler::OnJsError onJsError,
    jsinspector_modern::HostTarget* parentInspectorTarget)
    : runtime_(std::move(runtime)),
      jsMessageQueueThread_(jsMessageQueueThread),
      timerManager_(std::move(timerManager)),
      jsErrorHandler_(std::make_shared<JsErrorHandler>(std::move(onJsError))),
      parentInspectorTarget_(parentInspectorTarget) {
  RuntimeExecutor runtimeExecutor = [weakRuntime = std::weak_ptr(runtime_),
                                     weakTimerManager =
                                         std::weak_ptr(timerManager_),
                                     weakJsThread =
                                         std::weak_ptr(jsMessageQueueThread_),
                                     jsErrorHandler =
                                         jsErrorHandler_](auto callback) {
    if (weakRuntime.expired()) {
      return;
    }

    /**
     * If a fatal error was caught while executing the main bundle, assume the
     * js runtime is invalid. And stop executing any more js.
     */
    if (!jsErrorHandler->isRuntimeReady() &&
        jsErrorHandler->hasHandledFatalError()) {
      LOG(INFO)
          << "RuntimeExecutor: Detected fatal error. Dropping work on non-js thread."
          << std::endl;
      return;
    }

    if (auto jsThread = weakJsThread.lock()) {
      jsThread->runOnQueue([jsErrorHandler,
                            weakRuntime,
                            weakTimerManager,
                            callback = std::move(callback)]() {
        auto runtime = weakRuntime.lock();
        if (!runtime) {
          return;
        }

        jsi::Runtime& jsiRuntime = runtime->getRuntime();
        SystraceSection s("ReactInstance::_runtimeExecutor[Callback]");
        try {
          callback(jsiRuntime);

          // If we have first-class support for microtasks,
          // they would've been called as part of the previous callback.
          if (!ReactNativeFeatureFlags::enableMicrotasks()) {
            if (auto timerManager = weakTimerManager.lock()) {
              timerManager->callReactNativeMicrotasks(jsiRuntime);
            }
          }
        } catch (jsi::JSError& originalError) {
          jsErrorHandler->handleFatalError(jsiRuntime, originalError);
        }
      });
    }
  };

  if (parentInspectorTarget_) {
    auto executor = parentInspectorTarget_->executorFromThis();

    auto runtimeExecutorThatWaitsForInspectorSetup =
        std::make_shared<BufferedRuntimeExecutor>(runtimeExecutor);

    // This code can execute from any thread, so we need to make sure we set up
    // the inspector logic in the right one. The callback executes immediately
    // if we are already in the right thread.
    executor([this, runtimeExecutor, runtimeExecutorThatWaitsForInspectorSetup](
                 jsinspector_modern::HostTarget& hostTarget) {
      // Callbacks scheduled through the page target executor are generally
      // not guaranteed to run (e.g.: if the page target is destroyed)
      // but in this case it is because the page target cannot be destroyed
      // before the instance finishes its setup:
      // * On iOS it's because we do the setup synchronously.
      // * On Android it's because we explicitly wait for the instance
      //   creation task to finish before starting the destruction.
      inspectorTarget_ = &hostTarget.registerInstance(*this);
      runtimeInspectorTarget_ = &inspectorTarget_->registerRuntime(
          runtime_->getRuntimeTargetDelegate(), runtimeExecutor);
      runtimeExecutorThatWaitsForInspectorSetup->flush();
    });

    // We decorate the runtime executor used everywhere else to wait for the
    // inspector to finish its setup.
    runtimeExecutor =
        [runtimeExecutorThatWaitsForInspectorSetup](
            std::function<void(jsi::Runtime & runtime)>&& callback) {
          runtimeExecutorThatWaitsForInspectorSetup->execute(
              std::move(callback));
        };
  }

  runtimeScheduler_ = std::make_shared<RuntimeScheduler>(
      runtimeExecutor,
      RuntimeSchedulerClock::now,
      [jsErrorHandler = jsErrorHandler_](
          jsi::Runtime& runtime, jsi::JSError& error) {
        jsErrorHandler->handleFatalError(runtime, error);
      });
  runtimeScheduler_->setPerformanceEntryReporter(
      // FIXME: Move creation of PerformanceEntryReporter to here and guarantee
      // that its lifetime is the same as the runtime.
      PerformanceEntryReporter::getInstance().get());

  bufferedRuntimeExecutor_ = std::make_shared<BufferedRuntimeExecutor>(
      [runtimeScheduler = runtimeScheduler_.get()](
          std::function<void(jsi::Runtime & runtime)>&& callback) {
        runtimeScheduler->scheduleWork(std::move(callback));
      });
}

void ReactInstance::unregisterFromInspector() {
  if (inspectorTarget_) {
    assert(runtimeInspectorTarget_);
    inspectorTarget_->unregisterRuntime(*runtimeInspectorTarget_);

    assert(parentInspectorTarget_);
    parentInspectorTarget_->unregisterInstance(*inspectorTarget_);

    inspectorTarget_ = nullptr;
  }
}

RuntimeExecutor ReactInstance::getUnbufferedRuntimeExecutor() noexcept {
  return [runtimeScheduler = runtimeScheduler_.get()](
             std::function<void(jsi::Runtime & runtime)>&& callback) {
    runtimeScheduler->scheduleWork(std::move(callback));
  };
}

// This BufferedRuntimeExecutor ensures that the main JS bundle finished
// execution before any JS queued into it from C++ are executed. Use
// getUnbufferedRuntimeExecutor() instead if you do not need the main JS bundle
// to have finished. e.g. setting global variables into JS runtime.
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

// TODO(T184010230): Should the RuntimeScheduler returned from this method be
// buffered?
std::shared_ptr<RuntimeScheduler>
ReactInstance::getRuntimeScheduler() noexcept {
  return runtimeScheduler_;
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
        SystraceSection s("ReactInstance::loadScript");
        bool hasLogger(ReactMarker::logTaggedMarkerBridgelessImpl);
        if (hasLogger) {
          ReactMarker::logTaggedMarkerBridgeless(
              ReactMarker::RUN_JS_BUNDLE_START, scriptName.c_str());
        }

        runtime.evaluateJavaScript(buffer, sourceURL);

        /**
         * TODO(T183610671): We need a safe/reliable way to enable the js
         * pipeline from javascript. Remove this after we figure that out, or
         * after we just remove the js pipeline.
         */
        if (!jsErrorHandler_->hasHandledFatalError()) {
          jsErrorHandler_->setRuntimeReady();
        }

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
      });
}

/*
 * Calls a method on a JS module that has been registered with
 * `registerCallableModule`. Used to invoke a JS function from platform code.
 */
void ReactInstance::callFunctionOnModule(
    const std::string& moduleName,
    const std::string& methodName,
    folly::dynamic&& args) {
  bufferedRuntimeExecutor_->execute([this,
                                     moduleName = moduleName,
                                     methodName = methodName,
                                     args = std::move(args)](
                                        jsi::Runtime& runtime) {
    SystraceSection s(
        "ReactInstance::callFunctionOnModule",
        "moduleName",
        moduleName,
        "methodName",
        methodName);
    auto it = callableModules_.find(moduleName);
    if (it == callableModules_.end()) {
      std::ostringstream knownModules;
      int i = 0;
      for (it = callableModules_.begin(); it != callableModules_.end();
           it++, i++) {
        const char* space = (i > 0 ? ", " : " ");
        knownModules << space << it->first;
      }
      throw jsi::JSError(
          runtime,
          "Failed to call into JavaScript module method " + moduleName + "." +
              methodName +
              "(). Module has not been registered as callable. Registered callable JavaScript modules (n = " +
              std::to_string(callableModules_.size()) +
              "):" + knownModules.str() +
              ". Did you forget to call `registerCallableModule`?");
    }

    if (std::holds_alternative<jsi::Function>(it->second)) {
      auto module =
          std::get<jsi::Function>(it->second).call(runtime).asObject(runtime);
      it->second = std::move(module);
    }

    auto& module = std::get<jsi::Object>(it->second);
    auto method = module.getPropertyAsFunction(runtime, methodName.c_str());

    std::vector<jsi::Value> jsArgs;
    for (auto& arg : args) {
      jsArgs.push_back(jsi::valueFromDynamic(runtime, arg));
    }
    method.callWithThis(
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

bool isTruthy(jsi::Runtime& runtime, const jsi::Value& value) {
  auto Boolean = runtime.global().getPropertyAsFunction(runtime, "Boolean");
  return Boolean.call(runtime, value).getBool();
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

    runtime_->unstable_initializeOnJsThread();

    defineReactInstanceFlags(runtime, options);

    // TODO(T196834299): We should really use a C++ turbomodule for this
    defineReadOnlyGlobal(
        runtime,
        "RN$handleException",
        jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "handleException"),
            2,
            [jsErrorHandler = jsErrorHandler_](
                jsi::Runtime& runtime,
                const jsi::Value& /*unused*/,
                const jsi::Value* args,
                size_t count) {
              if (count < 2) {
                throw jsi::JSError(
                    runtime,
                    "handleException requires 2 arguments: error, isFatal");
              }

              auto isFatal = isTruthy(runtime, args[1]);
              if (jsErrorHandler->isRuntimeReady()) {
                if (isFatal) {
                  jsErrorHandler->notifyOfFatalError();
                }

                return jsi::Value(false);
              }

              if (isFatal) {
                auto jsError =
                    jsi::JSError(runtime, jsi::Value(runtime, args[0]));
                jsErrorHandler->handleFatalError(runtime, jsError);
                return jsi::Value(true);
              }

              return jsi::Value(false);
            }));

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
                  !args[1].getObject(runtime).isFunction(runtime)) {
                throw jsi::JSError(
                    runtime,
                    "The second argument to registerCallableModule must be a function that returns the JS module.");
              }
              callableModules_.emplace(
                  std::move(name),
                  args[1].getObject(runtime).getFunction(runtime));
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

void* ReactInstance::getJavaScriptContext() {
  return &runtime_->getRuntime();
}

} // namespace facebook::react
