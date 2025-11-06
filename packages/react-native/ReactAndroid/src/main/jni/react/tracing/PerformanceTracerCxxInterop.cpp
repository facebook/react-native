/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceTracerCxxInterop.h"

#include <folly/dynamic.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/timing/primitives.h>

#include <map>
#include <memory>
#include <mutex>

namespace facebook::react {

void TracingStateCallback::onTracingStateChanged(bool isTracing) const {
  static const auto method =
      javaClassStatic()->getMethod<void(jboolean)>("onTracingStateChanged");
  method(self(), static_cast<jboolean>(isTracing));
}

namespace {

class TracingCallbackRegistry {
 public:
  static TracingCallbackRegistry& getInstance() {
    static TracingCallbackRegistry instance;
    return instance;
  }

  void registerCallback(
      uint32_t subscriptionId,
      jni::global_ref<jobject> callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    callbacks_[subscriptionId] = std::move(callback);
  }

  void unregisterCallback(uint32_t subscriptionId) {
    std::lock_guard<std::mutex> lock(mutex_);
    callbacks_.erase(subscriptionId);
  }

  jni::global_ref<jobject> getCallback(uint32_t subscriptionId) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = callbacks_.find(subscriptionId);
    if (it != callbacks_.end()) {
      return it->second;
    }
    return nullptr;
  }

 private:
  std::mutex mutex_;
  std::map<uint32_t, jni::global_ref<jobject>> callbacks_;
};

} // namespace

void PerformanceTracerCxxInterop::reportMark(
    jni::alias_ref<PerformanceTracerCxxInterop> /*jthis*/,
    jni::alias_ref<jstring> name,
    jlong timestampNanos,
    jni::alias_ref<ReadableNativeMap::javaobject> detail) {
  auto& tracer = jsinspector_modern::tracing::PerformanceTracer::getInstance();

  if (!tracer.isTracing()) {
    return;
  }

  std::string nameStr = name->toStdString();
  HighResTimeStamp timestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point(
          std::chrono::nanoseconds(timestampNanos)));

  folly::dynamic detailDynamic = nullptr;
  if (detail) {
    detailDynamic = detail->cthis()->consume();
  }

  tracer.reportMark(nameStr, timestamp, std::move(detailDynamic));
}

void PerformanceTracerCxxInterop::reportMeasure(
    jni::alias_ref<PerformanceTracerCxxInterop> /*jthis*/,
    jni::alias_ref<jstring> name,
    jlong startTimestampNanos,
    jlong durationNanos,
    jni::alias_ref<ReadableNativeMap::javaobject> detail) {
  auto& tracer = jsinspector_modern::tracing::PerformanceTracer::getInstance();

  if (!tracer.isTracing()) {
    return;
  }

  std::string nameStr = name->toStdString();
  HighResTimeStamp startTimestamp =
      HighResTimeStamp::fromChronoSteadyClockTimePoint(
          std::chrono::steady_clock::time_point(
              std::chrono::nanoseconds(startTimestampNanos)));
  HighResDuration duration = HighResDuration::fromNanoseconds(durationNanos);

  folly::dynamic detailDynamic = nullptr;
  if (detail) {
    detailDynamic = detail->cthis()->consume();
  }

  tracer.reportMeasure(
      nameStr, startTimestamp, duration, std::move(detailDynamic));
}

void PerformanceTracerCxxInterop::reportTimeStamp(
    jni::alias_ref<PerformanceTracerCxxInterop> /*jthis*/,
    jni::alias_ref<jstring> name,
    jlong startTimeNanos,
    jlong endTimeNanos,
    jni::alias_ref<jstring> trackName,
    jni::alias_ref<jstring> trackGroup,
    jni::alias_ref<jstring> color) {
  auto& tracer = jsinspector_modern::tracing::PerformanceTracer::getInstance();

  if (!tracer.isTracing()) {
    return;
  }

  std::string nameStr = name->toStdString();

  // Convert start timestamp
  HighResTimeStamp startTimestamp =
      HighResTimeStamp::fromChronoSteadyClockTimePoint(
          std::chrono::steady_clock::time_point(
              std::chrono::nanoseconds(startTimeNanos)));

  // Convert end timestamp
  HighResTimeStamp endTimestamp =
      HighResTimeStamp::fromChronoSteadyClockTimePoint(
          std::chrono::steady_clock::time_point(
              std::chrono::nanoseconds(endTimeNanos)));

  // Handle optional string parameters
  std::optional<std::string> trackNameOpt = std::nullopt;
  if (trackName) {
    trackNameOpt = trackName->toStdString();
  }

  std::optional<std::string> trackGroupOpt = std::nullopt;
  if (trackGroup) {
    trackGroupOpt = trackGroup->toStdString();
  }

  // Handle optional color parameter
  std::optional<jsinspector_modern::tracing::ConsoleTimeStampColor> colorOpt =
      std::nullopt;
  if (color) {
    colorOpt = jsinspector_modern::tracing::getConsoleTimeStampColorFromString(
        color->toStdString());
  }

  tracer.reportTimeStamp(
      nameStr,
      startTimestamp,
      endTimestamp,
      trackNameOpt,
      trackGroupOpt,
      colorOpt);
}

jboolean PerformanceTracerCxxInterop::isTracing(
    jni::alias_ref<PerformanceTracerCxxInterop> /*jthis*/) {
  return static_cast<jboolean>(
      jsinspector_modern::tracing::PerformanceTracer::getInstance()
          .isTracing());
}

jint PerformanceTracerCxxInterop::subscribeToTracingStateChanges(
    jni::alias_ref<PerformanceTracerCxxInterop> /*jthis*/,
    jni::alias_ref<TracingStateCallback::javaobject> callback) {
  auto globalCallback = jni::make_global(callback);

  auto& tracer = jsinspector_modern::tracing::PerformanceTracer::getInstance();

  auto callbackWrapper = std::make_shared<uint32_t>(0);

  uint32_t subscriptionId =
      tracer.subscribeToTracingStateChanges([callbackWrapper](bool isTracing) {
        auto callback = TracingCallbackRegistry::getInstance().getCallback(
            *callbackWrapper);
        if (callback) {
          try {
            jni::ThreadScope::WithClassLoader([&] {
              auto callbackClass = callback->getClass();
              auto onTracingStateChangedMethod =
                  callbackClass->getMethod<void(jboolean)>(
                      "onTracingStateChanged");
              onTracingStateChangedMethod(
                  callback, static_cast<jboolean>(isTracing));
            });
          } catch (const std::exception& e) {
          }
        }
      });

  *callbackWrapper = subscriptionId;
  TracingCallbackRegistry::getInstance().registerCallback(
      subscriptionId, globalCallback);

  return static_cast<jint>(subscriptionId);
}

void PerformanceTracerCxxInterop::unsubscribeFromTracingStateChanges(
    jni::alias_ref<PerformanceTracerCxxInterop> /*jthis*/,
    jint subscriptionId) {
  auto& tracer = jsinspector_modern::tracing::PerformanceTracer::getInstance();
  tracer.unsubscribeFromTracingStateChanges(
      static_cast<uint32_t>(subscriptionId));
  TracingCallbackRegistry::getInstance().unregisterCallback(
      static_cast<uint32_t>(subscriptionId));
}

void PerformanceTracerCxxInterop::registerNatives() {
  javaClassLocal()->registerNatives(
      {makeNativeMethod("reportMark", PerformanceTracerCxxInterop::reportMark),
       makeNativeMethod(
           "reportMeasure", PerformanceTracerCxxInterop::reportMeasure),
       makeNativeMethod(
           "reportTimeStamp", PerformanceTracerCxxInterop::reportTimeStamp),
       makeNativeMethod("isTracing", PerformanceTracerCxxInterop::isTracing),
       makeNativeMethod(
           "subscribeToTracingStateChanges",
           PerformanceTracerCxxInterop::subscribeToTracingStateChanges),
       makeNativeMethod(
           "unsubscribeFromTracingStateChanges",
           PerformanceTracerCxxInterop::unsubscribeFromTracingStateChanges)});
}

} // namespace facebook::react
