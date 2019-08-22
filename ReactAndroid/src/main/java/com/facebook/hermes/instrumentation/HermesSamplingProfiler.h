// Copyright 2004-present Facebook. All Rights Reserved.

#ifndef HERMESSAMPLINGPROFILER_H_
#define HERMESSAMPLINGPROFILER_H_

#include <fb/fbjni.h>
#include <jni/Registration.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {
namespace jni {

namespace jni = ::facebook::jni;

class HermesSamplingProfiler : public jni::JavaClass<HermesSamplingProfiler> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/hermes/instrumentation/HermesSamplingProfiler;";
  static void enable(jni::alias_ref<jclass>);
  static void disable(jni::alias_ref<jclass>);
  static void dumpSampledTraceToFile(
      jni::alias_ref<jclass>,
      std::string filename);

  static void registerNatives();

 private:
  HermesSamplingProfiler();
};

} // namespace jni
} // namespace jsi
} // namespace facebook

#endif /* HERMESSAMPLINGPROFILER_H_ */
