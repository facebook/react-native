/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeCPUTime.h"

#include "CPUTime.h"

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeCPUTimeModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeCPUTime>(std::move(jsInvoker));
}

namespace facebook::react {

NativeCPUTime::NativeCPUTime(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeCPUTimeCxxSpec(std::move(jsInvoker)) {}

double NativeCPUTime::getCPUTimeNanos(jsi::Runtime& /*runtime*/) {
  return facebook::react::getCPUTimeNanos();
}

bool NativeCPUTime::hasAccurateCPUTimeNanosForBenchmarks(
    jsi::Runtime& /*runtime*/) {
  return facebook::react::hasAccurateCPUTimeNanosForBenchmarks();
}

} // namespace facebook::react
