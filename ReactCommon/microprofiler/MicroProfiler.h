/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <atomic>
#include <thread>

// #define WITH_MICRO_PROFILER 1

#ifdef WITH_MICRO_PROFILER
#define MICRO_PROFILER_SECTION(name) MicroProfilerSection __b(name)
#define MICRO_PROFILER_SECTION_NAMED(var_name, name) \
  MicroProfilerSection var_name(name)
#else
#define MICRO_PROFILER_SECTION(name)
#define MICRO_PROFILER_SECTION_NAMED(var_name, name)
#endif

namespace facebook {
namespace react {

enum MicroProfilerName {
  __INTERNAL_BENCHMARK_INNER,
  __INTERNAL_BENCHMARK_OUTER,
  __LENGTH__,
};

/**
 * MicroProfiler is a performance profiler for measuring the cumulative impact
 * of a large number of small-ish calls. This is normally a problem for standard
 * profilers like Systrace because the overhead of the profiler itself skews the
 * timings you are able to collect. This is especially a problem when doing
 * nested calls to profiled functions, as the parent calls will contain the
 * overhead of their profiling plus the overhead of all their childrens'
 * profiling.
 *
 * MicroProfiler attempts to be low overhead by 1) aggregating timings in memory
 * and 2) trying to remove estimated profiling overhead from the returned
 * timings.
 *
 * To remove estimated overhead, at the beginning of each trace we calculate the
 * average cost of profiling a no-op code section, as well as invoking the
 * average cost of invoking the system clock. The former is subtracted out for
 * each child profiler section that is invoked within a parent profiler section.
 * The latter is subtracted from each section, child or not.
 *
 * After MicroProfiler::stopProfiling() is called, a table of tracing data is
 * emitted to glog (which shows up in logcat on Android).
 */
struct MicroProfiler {
  static const char *profilingNameToString(MicroProfilerName name) {
    switch (name) {
      case __INTERNAL_BENCHMARK_INNER:
        return "__INTERNAL_BENCHMARK_INNER";
      case __INTERNAL_BENCHMARK_OUTER:
        return "__INTERNAL_BENCHMARK_OUTER";
      case __LENGTH__:
        throw std::runtime_error("__LENGTH__ has no name");
      default:
        throw std::runtime_error(
            "Trying to convert unknown MicroProfilerName to string");
    }
  }

  static void startProfiling();
  static void stopProfiling();
  static bool isProfiling();
  static void runInternalBenchmark();
};

class MicroProfilerSection {
 public:
  MicroProfilerSection(MicroProfilerName name);
  ~MicroProfilerSection();

 private:
  bool isProfiling_;
  MicroProfilerName name_;
  uint_fast64_t startTime_;
  uint_fast32_t startNumProfileSections_;
};

} // namespace react
} // namespace facebook
