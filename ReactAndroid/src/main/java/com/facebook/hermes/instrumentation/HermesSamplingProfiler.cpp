// Copyright 2004-present Facebook. All Rights Reserved.

#include "HermesSamplingProfiler.h"

#include <hermes/hermes.h>

namespace facebook {
namespace jsi {
namespace jni {

void HermesSamplingProfiler::enable(jni::alias_ref<jclass>) {
  hermes::HermesRuntime::enableSamplingProfiler();
}

void HermesSamplingProfiler::disable(jni::alias_ref<jclass>) {
  hermes::HermesRuntime::disableSamplingProfiler();
}

void HermesSamplingProfiler::dumpSampledTraceToFile(
    jni::alias_ref<jclass>,
    std::string filename) {
  hermes::HermesRuntime::dumpSampledTraceToFile(filename);
}

void HermesSamplingProfiler::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("enable", HermesSamplingProfiler::enable),
      makeNativeMethod("disable", HermesSamplingProfiler::enable),
      makeNativeMethod(
          "dumpSampledTraceToFile",
          HermesSamplingProfiler::dumpSampledTraceToFile),
  });
}

} // namespace jni
} // namespace jsi
} // namespace facebook
