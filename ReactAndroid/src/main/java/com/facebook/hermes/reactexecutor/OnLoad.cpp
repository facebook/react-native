/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <../instrumentation/HermesMemoryDumper.h>
#include <HermesExecutorFactory.h>
#include <fb/fbjni.h>
#include <folly/Memory.h>
#include <hermes/Public/GCConfig.h>
#include <hermes/Public/RuntimeConfig.h>
#include <jni.h>
#include <react/jni/JReactMarker.h>
#include <react/jni/JSLogging.h>
#include <react/jni/JavaScriptExecutorHolder.h>

namespace facebook {
namespace react {

/// Converts a duration given as a long from Java, into a std::chrono duration.
static constexpr std::chrono::hours msToHours(jlong ms) {
  using namespace std::chrono;
  return duration_cast<hours>(milliseconds(ms));
}

static ::hermes::vm::RuntimeConfig makeRuntimeConfig(
    jlong heapSizeMB,
    bool es6Symbol,
    jint bytecodeWarmupPercent,
    bool tripWireEnabled,
    jni::alias_ref<jsi::jni::HermesMemoryDumper> heapDumper,
    jlong tripWireCooldownMS,
    jlong tripWireLimitBytes) {
  namespace vm = ::hermes::vm;
  auto gcConfigBuilder =
      vm::GCConfig::Builder()
          .withMaxHeapSize(heapSizeMB << 20)
          .withName("RN")
          // For the next two arguments: avoid GC before TTI by initializing the
          // runtime to allocate directly in the old generation, but revert to
          // normal operation when we reach the (first) TTI point.
          .withAllocInYoung(false)
          .withRevertToYGAtTTI(true);

  if (tripWireEnabled) {
    assert(
        heapDumper &&
        "Must provide a heap dumper instance if tripwire is enabled");

    gcConfigBuilder.withTripwireConfig(
        vm::GCTripwireConfig::Builder()
            .withLimit(tripWireLimitBytes)
            .withCooldown(msToHours(tripWireCooldownMS))
            .withCallback([globalHeapDumper = jni::make_global(heapDumper)](
                              vm::GCTripwireContext &ctx) mutable {
              if (!globalHeapDumper->shouldSaveSnapshot()) {
                return;
              }

              std::string crashId = globalHeapDumper->getId();
              std::string path = globalHeapDumper->getInternalStorage();
              path += "/dump_";
              path += crashId;
              path += ".hermes";

              bool successful = ctx.createSnapshotToFile(path, true);
              if (!successful) {
                LOG(ERROR) << "Failed to write Hermes Memory Dump to " << path
                           << "\n";
                return;
              }

              LOG(INFO) << "Hermes Memory Dump saved on: " << path << "\n";
              globalHeapDumper->setMetaData(crashId);
            })
            .build());
  }

  return vm::RuntimeConfig::Builder()
      .withGCConfig(gcConfigBuilder.build())
      .withES6Symbol(es6Symbol)
      .withBytecodeWarmupPercent(bytecodeWarmupPercent)
      .build();
}

static void installBindings(jsi::Runtime &runtime) {
  react::Logger androidLogger =
      static_cast<void (*)(const std::string &, unsigned int)>(
          &reactAndroidLoggingHook);
  react::bindNativeLogger(runtime, androidLogger);
}

class HermesExecutorHolder
    : public jni::HybridClass<HermesExecutorHolder, JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/hermes/reactexecutor/HermesExecutor;";

  static jni::local_ref<jhybriddata> initHybridDefaultConfig(
      jni::alias_ref<jclass>) {
    JReactMarker::setLogPerfMarkerIfNeeded();

    return makeCxxInstance(
        folly::make_unique<HermesExecutorFactory>(installBindings));
  }

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      jlong heapSizeMB,
      bool es6Symbol,
      jint bytecodeWarmupPercent,
      bool tripWireEnabled,
      jni::alias_ref<jsi::jni::HermesMemoryDumper> heapDumper,
      jlong tripWireCooldownMS,
      jlong tripWireLimitBytes) {
    JReactMarker::setLogPerfMarkerIfNeeded();
    auto runtimeConfig = makeRuntimeConfig(
        heapSizeMB,
        es6Symbol,
        bytecodeWarmupPercent,
        tripWireEnabled,
        heapDumper,
        tripWireCooldownMS,
        tripWireLimitBytes);
    return makeCxxInstance(folly::make_unique<HermesExecutorFactory>(
        installBindings, JSIExecutor::defaultTimeoutInvoker, runtimeConfig));
  }

  static bool canLoadFile(jni::alias_ref<jclass>, const std::string &path) {
    return true;
  }

  static void registerNatives() {
    registerHybrid(
        {makeNativeMethod("initHybrid", HermesExecutorHolder::initHybrid),
         makeNativeMethod(
             "initHybridDefaultConfig",
             HermesExecutorHolder::initHybridDefaultConfig),
         makeNativeMethod("canLoadFile", HermesExecutorHolder::canLoadFile)});
  }

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
};

} // namespace react
} // namespace facebook

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::HermesExecutorHolder::registerNatives(); });
}
