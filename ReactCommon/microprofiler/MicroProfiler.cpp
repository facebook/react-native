// Copyright 2004-present Facebook. All Rights Reserved.

#include <algorithm>
#include <chrono>
#include <mutex>
#include <vector>
#include <time.h>

#include <glog/logging.h>

#include "MicroProfiler.h"

// iOS doesn't support 'thread_local'. If we reimplement this to use pthread_setspecific
// we can get rid of this
#if defined(__APPLE__)
#define MICRO_PROFILER_STUB_IMPLEMENTATION 1
#else
#define MICRO_PROFILER_STUB_IMPLEMENTATION 0
#endif

namespace facebook {
namespace react {

#if !MICRO_PROFILER_STUB_IMPLEMENTATION
struct TraceData {
  TraceData();
  ~TraceData();

  void addTime(MicroProfilerName name, uint_fast64_t time, uint_fast32_t internalClockCalls);

  std::thread::id threadId_;
  uint_fast64_t startTime_;
  std::atomic_uint_fast64_t times_[MicroProfilerName::__LENGTH__] = {};
  std::atomic_uint_fast32_t calls_[MicroProfilerName::__LENGTH__] = {};
  std::atomic_uint_fast32_t childProfileSections_[MicroProfilerName::__LENGTH__] = {};
};

struct ProfilingImpl {
  std::mutex mutex_;
  std::vector<TraceData*> allTraceData_;
  bool isProfiling_ = false;
  uint_fast64_t startTime_;
  uint_fast64_t endTime_;
  uint_fast64_t clockOverhead_;
  uint_fast64_t profileSectionOverhead_;
};

static ProfilingImpl profiling;
thread_local TraceData myTraceData;
thread_local uint_fast32_t profileSections = 0;

static uint_fast64_t nowNs() {
  struct timespec time;
  clock_gettime(CLOCK_REALTIME, &time);
  return uint_fast64_t(1000000000) * time.tv_sec + time.tv_nsec;
}

static uint_fast64_t diffNs(uint_fast64_t start, uint_fast64_t end) {
  return end - start;
}

static std::string formatTimeNs(uint_fast64_t timeNs) {
  std::ostringstream out;
  out.precision(2);
  if (timeNs < 1000) {
    out << timeNs << "ns";
  } else if (timeNs < 1000000) {
    out << timeNs / 1000.0 << "us";
  } else {
    out << std::fixed << timeNs / 1000000.0 << "ms";
  }
  return out.str();
}

MicroProfilerSection::MicroProfilerSection(MicroProfilerName name) :
    isProfiling_(profiling.isProfiling_),
    name_(name),
    startNumProfileSections_(profileSections) {
  if (!isProfiling_) {
    return;
  }
  profileSections++;
  startTime_ = nowNs();
}
MicroProfilerSection::~MicroProfilerSection() {
  if (!isProfiling_ || !profiling.isProfiling_) {
    return;
  }
  auto endTime = nowNs();
  auto endNumProfileSections = profileSections;
  myTraceData.addTime(name_, endTime - startTime_, endNumProfileSections - startNumProfileSections_ - 1);
}

TraceData::TraceData() :
    threadId_(std::this_thread::get_id()) {
  std::lock_guard<std::mutex> lock(profiling.mutex_);
  profiling.allTraceData_.push_back(this);
}

TraceData::~TraceData() {
  std::lock_guard<std::mutex> lock(profiling.mutex_);
  auto& infos = profiling.allTraceData_;
  infos.erase(std::remove(infos.begin(), infos.end(), this), infos.end());
}

void TraceData::addTime(MicroProfilerName name, uint_fast64_t time, uint_fast32_t childprofileSections) {
  times_[name] += time;
  calls_[name]++;
  childProfileSections_[name] += childprofileSections;
}

static void printReport() {
  LOG(ERROR) << "======= MICRO PROFILER REPORT =======";
  LOG(ERROR) << "- Total Time: " << formatTimeNs(diffNs(profiling.startTime_, profiling.endTime_));
  LOG(ERROR) << "- Clock Overhead: " << formatTimeNs(profiling.clockOverhead_);
  LOG(ERROR) << "- Profiler Section Overhead: " << formatTimeNs(profiling.profileSectionOverhead_);
  for (auto info : profiling.allTraceData_) {
    LOG(ERROR) << "--- Thread ID 0x" << std::hex << info->threadId_ << " ---";
    for (int i = 0; i < MicroProfilerName::__LENGTH__; i++) {
      if (info->times_[i] > 0) {
        auto totalTime = info->times_[i].load();
        auto calls = info->calls_[i].load();
        auto clockOverhead = profiling.clockOverhead_ * calls + profiling.profileSectionOverhead_ * info->childProfileSections_[i].load();
        if (totalTime < clockOverhead) {
          LOG(ERROR) << "- " << MicroProfiler::profilingNameToString(static_cast<MicroProfilerName>(i)) << ": "
              << "ERROR: Total time was " << totalTime << "ns but clock overhead was calculated to be " << clockOverhead << "ns!";
        } else {
          auto correctedTime = totalTime - clockOverhead;
          auto timePerCall = correctedTime / calls;
          LOG(ERROR) << "- " << MicroProfiler::profilingNameToString(static_cast<MicroProfilerName>(i)) << ": "
              << formatTimeNs(correctedTime) << " (" << calls << " calls, " << formatTimeNs(timePerCall) << "/call)";
        }
      }
    }
  }
}

static void clearProfiling() {
  CHECK(!profiling.isProfiling_) << "Trying to clear profiling but profiling was already started!";
  for (auto info : profiling.allTraceData_) {
    for (unsigned int i = 0; i < MicroProfilerName::__LENGTH__; i++) {
      info->times_[i] = 0;
      info->calls_[i] = 0;
      info->childProfileSections_[i] = 0;
    }
  }
}

static uint_fast64_t calculateClockOverhead() {
  int numCalls = 1000000;
  uint_fast64_t start = nowNs();
  for (int i = 0; i < numCalls; i++) {
    nowNs();
  }
  uint_fast64_t end = nowNs();
  return (end - start) / numCalls;
}

static uint_fast64_t calculateProfileSectionOverhead() {
  int numCalls = 1000000;
  uint_fast64_t start = nowNs();
  profiling.isProfiling_ = true;
  for (int i = 0; i < numCalls; i++) {
    MICRO_PROFILER_SECTION(static_cast<MicroProfilerName>(0));
  }
  uint_fast64_t end = nowNs();
  profiling.isProfiling_ = false;
  return (end - start) / numCalls;
}

void MicroProfiler::startProfiling() {
  CHECK(!profiling.isProfiling_) << "Trying to start profiling but profiling was already started!";

  profiling.clockOverhead_ = calculateClockOverhead();
  profiling.profileSectionOverhead_ = calculateProfileSectionOverhead();

  std::lock_guard<std::mutex> lock(profiling.mutex_);
  clearProfiling();

  profiling.startTime_ = nowNs();
  profiling.isProfiling_ = true;
}

void MicroProfiler::stopProfiling() {
  CHECK(profiling.isProfiling_) << "Trying to stop profiling but profiling hasn't been started!";

  profiling.isProfiling_ = false;
  profiling.endTime_ = nowNs();

  std::lock_guard<std::mutex> lock(profiling.mutex_);

  printReport();

  clearProfiling();
}

bool MicroProfiler::isProfiling() {
  return profiling.isProfiling_;
}

void MicroProfiler::runInternalBenchmark() {
  MicroProfiler::startProfiling();
  for (int i = 0; i < 1000000; i++) {
    MICRO_PROFILER_SECTION_NAMED(outer, __INTERNAL_BENCHMARK_OUTER);
    {
      MICRO_PROFILER_SECTION_NAMED(inner, __INTERNAL_BENCHMARK_INNER);
    }
  }
  MicroProfiler::stopProfiling();
}
#else
void MicroProfiler::startProfiling() {
  CHECK(false) << "This platform has a stub implementation of the micro profiler and cannot collect traces";
}
void MicroProfiler::stopProfiling() {
}
bool MicroProfiler::isProfiling() {
  return false;
}
void MicroProfiler::runInternalBenchmark() {
}
#endif

} }
