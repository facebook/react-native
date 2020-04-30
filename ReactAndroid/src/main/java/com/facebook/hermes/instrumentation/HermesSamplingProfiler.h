/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMESSAMPLINGPROFILER_H_
#define HERMESSAMPLINGPROFILER_H_

#include <fbjni/fbjni.h>
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
