/*
 * Copyright 2016-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <folly/experimental/exception_tracer/ExceptionCounterLib.h>

#include <iosfwd>
#include <unordered_map>

#include <folly/Range.h>
#include <folly/Synchronized.h>
#include <folly/ThreadLocal.h>
#include <folly/hash/SpookyHashV2.h>
#include <folly/synchronization/RWSpinLock.h>

#include <folly/experimental/exception_tracer/ExceptionTracerLib.h>
#include <folly/experimental/exception_tracer/StackTrace.h>
#include <folly/experimental/symbolizer/Symbolizer.h>

using namespace folly::exception_tracer;

namespace {

// We use the hash of stack trace and exception type to uniquely
// identify the exception.
using ExceptionId = uint64_t;

using ExceptionStatsHolderType =
    std::unordered_map<ExceptionId, ExceptionStats>;

struct ExceptionStatsStorage {
  void appendTo(ExceptionStatsHolderType& data) {
    ExceptionStatsHolderType tempHolder;
    statsHolder->swap(tempHolder);

    for (const auto& myData : tempHolder) {
      auto inserted = data.insert(myData);
      if (!inserted.second) {
        inserted.first->second.count += myData.second.count;
      }
    }
  }

  folly::Synchronized<ExceptionStatsHolderType, folly::RWSpinLock> statsHolder;
};

class Tag {};

folly::ThreadLocal<ExceptionStatsStorage, Tag> gExceptionStats;

} // namespace

namespace folly {
namespace exception_tracer {

std::vector<ExceptionStats> getExceptionStatistics() {
  ExceptionStatsHolderType accumulator;
  for (auto& threadStats : gExceptionStats.accessAllThreads()) {
    threadStats.appendTo(accumulator);
  }

  std::vector<ExceptionStats> result;
  result.reserve(accumulator.size());
  for (auto& item : accumulator) {
    result.push_back(std::move(item.second));
  }

  std::sort(
      result.begin(),
      result.end(),
      [](const ExceptionStats& lhs, const ExceptionStats& rhs) {
        return lhs.count > rhs.count;
      });

  return result;
}

std::ostream& operator<<(std::ostream& out, const ExceptionStats& stats) {
  out << "Exception report: \n"
      << "Exception count: " << stats.count << "\n"
      << stats.info;

  return out;
}

} // namespace exception_tracer
} // namespace folly

namespace {

/*
 * This handler gathers statistics on all exceptions thrown by the program
 * Information is being stored in thread local storage.
 */
void throwHandler(void*, std::type_info* exType, void (*)(void*)) noexcept {
  // This array contains the exception type and the stack frame
  // pointers so they get all hashed together.
  uintptr_t frames[kMaxFrames + 1];
  frames[0] = reinterpret_cast<uintptr_t>(exType);
  auto n = folly::symbolizer::getStackTrace(frames + 1, kMaxFrames);

  if (n == -1) {
    // If we fail to collect the stack trace for this exception we
    // just log it under empty stack trace.
    n = 0;
  }

  auto exceptionId =
      folly::hash::SpookyHashV2::Hash64(frames, (n + 1) * sizeof(frames[0]), 0);

  gExceptionStats->statsHolder.withWLock([&](auto& holder) {
    auto it = holder.find(exceptionId);
    if (it != holder.end()) {
      ++it->second.count;
    } else {
      ExceptionInfo info;
      info.type = exType;
      info.frames.assign(frames + 1, frames + 1 + n);
      holder.emplace(exceptionId, ExceptionStats{1, std::move(info)});
    }
  });
}

struct Initializer {
  Initializer() {
    registerCxaThrowCallback(throwHandler);
  }
};

Initializer initializer;

} // namespace
