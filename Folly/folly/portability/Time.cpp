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

#include <folly/portability/Time.h>

#include <folly/CPortability.h>
#include <folly/Likely.h>

#include <assert.h>

#include <chrono>

template <typename _Rep, typename _Period>
static void duration_to_ts(
    std::chrono::duration<_Rep, _Period> d,
    struct timespec* ts) {
  ts->tv_sec =
      time_t(std::chrono::duration_cast<std::chrono::seconds>(d).count());
  ts->tv_nsec = long(std::chrono::duration_cast<std::chrono::nanoseconds>(
                         d % std::chrono::seconds(1))
                         .count());
}

#if !FOLLY_HAVE_CLOCK_GETTIME || FOLLY_FORCE_CLOCK_GETTIME_DEFINITION
#if __MACH__
#include <errno.h>
#include <mach/mach_init.h> // @manual
#include <mach/mach_port.h> // @manual
#include <mach/mach_time.h> // @manual
#include <mach/mach_types.h> // @manual
#include <mach/task.h> // @manual
#include <mach/thread_act.h> // @manual
#include <mach/vm_map.h> // @manual

static std::chrono::nanoseconds time_value_to_ns(time_value_t t) {
  return std::chrono::seconds(t.seconds) +
      std::chrono::microseconds(t.microseconds);
}

static int clock_process_cputime(struct timespec* ts) {
  // Get CPU usage for live threads.
  task_thread_times_info thread_times_info;
  mach_msg_type_number_t thread_times_info_count = TASK_THREAD_TIMES_INFO_COUNT;
  kern_return_t kern_result = task_info(
      mach_task_self(),
      TASK_THREAD_TIMES_INFO,
      (thread_info_t)&thread_times_info,
      &thread_times_info_count);
  if (UNLIKELY(kern_result != KERN_SUCCESS)) {
    return -1;
  }

  // Get CPU usage for terminated threads.
  mach_task_basic_info task_basic_info;
  mach_msg_type_number_t task_basic_info_count = MACH_TASK_BASIC_INFO_COUNT;
  kern_result = task_info(
      mach_task_self(),
      MACH_TASK_BASIC_INFO,
      (thread_info_t)&task_basic_info,
      &task_basic_info_count);
  if (UNLIKELY(kern_result != KERN_SUCCESS)) {
    return -1;
  }

  auto cputime = time_value_to_ns(thread_times_info.user_time) +
      time_value_to_ns(thread_times_info.system_time) +
      time_value_to_ns(task_basic_info.user_time) +
      time_value_to_ns(task_basic_info.system_time);
  duration_to_ts(cputime, ts);
  return 0;
}

static int clock_thread_cputime(struct timespec* ts) {
  mach_msg_type_number_t count = THREAD_BASIC_INFO_COUNT;
  thread_basic_info_data_t thread_info_data;
  thread_act_t thread = mach_thread_self();
  kern_return_t kern_result = thread_info(
      thread, THREAD_BASIC_INFO, (thread_info_t)&thread_info_data, &count);
  mach_port_deallocate(mach_task_self(), thread);
  if (UNLIKELY(kern_result != KERN_SUCCESS)) {
    return -1;
  }
  auto cputime = time_value_to_ns(thread_info_data.system_time) +
      time_value_to_ns(thread_info_data.user_time);
  duration_to_ts(cputime, ts);
  return 0;
}

FOLLY_ATTR_WEAK int clock_gettime(clockid_t clk_id, struct timespec* ts) {
  switch (clk_id) {
    case CLOCK_REALTIME: {
      auto now = std::chrono::system_clock::now().time_since_epoch();
      duration_to_ts(now, ts);
      return 0;
    }
    case CLOCK_MONOTONIC: {
      auto now = std::chrono::steady_clock::now().time_since_epoch();
      duration_to_ts(now, ts);
      return 0;
    }
    case CLOCK_PROCESS_CPUTIME_ID:
      return clock_process_cputime(ts);
    case CLOCK_THREAD_CPUTIME_ID:
      return clock_thread_cputime(ts);
    default:
      errno = EINVAL;
      return -1;
  }
}

int clock_getres(clockid_t clk_id, struct timespec* ts) {
  if (clk_id != CLOCK_MONOTONIC) {
    return -1;
  }

  static auto info = [] {
    static mach_timebase_info_data_t info;
    auto result = (mach_timebase_info(&info) == KERN_SUCCESS) ? &info : nullptr;
    assert(result);
    return result;
  }();

  ts->tv_sec = 0;
  ts->tv_nsec = info->numer / info->denom;

  return 0;
}
#elif defined(_WIN32)
#include <errno.h>
#include <locale.h>
#include <stdint.h>
#include <stdlib.h>

#include <folly/portability/Windows.h>

using unsigned_nanos = std::chrono::duration<uint64_t, std::nano>;

static unsigned_nanos filetimeToUnsignedNanos(FILETIME ft) {
  ULARGE_INTEGER i;
  i.HighPart = ft.dwHighDateTime;
  i.LowPart = ft.dwLowDateTime;

  // FILETIMEs are in units of 100ns.
  return unsigned_nanos(i.QuadPart * 100);
};

static LARGE_INTEGER performanceFrequency() {
  static auto result = [] {
    LARGE_INTEGER freq;
    // On Windows XP or later, this will never fail.
    BOOL res = QueryPerformanceFrequency(&freq);
    assert(res);
    return freq;
  }();
  return result;
}

extern "C" int clock_getres(clockid_t clock_id, struct timespec* res) {
  if (!res) {
    errno = EFAULT;
    return -1;
  }

  static constexpr size_t kNsPerSec = 1000000000;
  switch (clock_id) {
    case CLOCK_REALTIME: {
      constexpr auto perSec = double(std::chrono::system_clock::period::num) /
          std::chrono::system_clock::period::den;
      res->tv_sec = time_t(perSec);
      res->tv_nsec = time_t(perSec * kNsPerSec);
      return 0;
    }
    case CLOCK_MONOTONIC: {
      constexpr auto perSec = double(std::chrono::steady_clock::period::num) /
          std::chrono::steady_clock::period::den;
      res->tv_sec = time_t(perSec);
      res->tv_nsec = time_t(perSec * kNsPerSec);
      return 0;
    }
    case CLOCK_PROCESS_CPUTIME_ID:
    case CLOCK_THREAD_CPUTIME_ID: {
      DWORD adj, timeIncrement;
      BOOL adjDisabled;
      if (!GetSystemTimeAdjustment(&adj, &timeIncrement, &adjDisabled)) {
        errno = EINVAL;
        return -1;
      }

      res->tv_sec = 0;
      res->tv_nsec = long(timeIncrement * 100);
      return 0;
    }

    default:
      errno = EINVAL;
      return -1;
  }
}

extern "C" int clock_gettime(clockid_t clock_id, struct timespec* tp) {
  if (!tp) {
    errno = EFAULT;
    return -1;
  }

  const auto unanosToTimespec = [](timespec* tp, unsigned_nanos t) -> int {
    static constexpr unsigned_nanos one_sec{std::chrono::seconds(1)};
    tp->tv_sec =
        time_t(std::chrono::duration_cast<std::chrono::seconds>(t).count());
    tp->tv_nsec = long((t % one_sec).count());
    return 0;
  };

  FILETIME createTime, exitTime, kernalTime, userTime;
  switch (clock_id) {
    case CLOCK_REALTIME: {
      auto now = std::chrono::system_clock::now().time_since_epoch();
      duration_to_ts(now, tp);
      return 0;
    }
    case CLOCK_MONOTONIC: {
      auto now = std::chrono::steady_clock::now().time_since_epoch();
      duration_to_ts(now, tp);
      return 0;
    }
    case CLOCK_PROCESS_CPUTIME_ID: {
      if (!GetProcessTimes(
              GetCurrentProcess(),
              &createTime,
              &exitTime,
              &kernalTime,
              &userTime)) {
        errno = EINVAL;
        return -1;
      }

      return unanosToTimespec(
          tp,
          filetimeToUnsignedNanos(kernalTime) +
              filetimeToUnsignedNanos(userTime));
    }
    case CLOCK_THREAD_CPUTIME_ID: {
      if (!GetThreadTimes(
              GetCurrentThread(),
              &createTime,
              &exitTime,
              &kernalTime,
              &userTime)) {
        errno = EINVAL;
        return -1;
      }

      return unanosToTimespec(
          tp,
          filetimeToUnsignedNanos(kernalTime) +
              filetimeToUnsignedNanos(userTime));
    }

    default:
      errno = EINVAL;
      return -1;
  }
}
#else
#error No clock_gettime(3) compatibility wrapper available for this platform.
#endif
#endif

#ifdef _WIN32
#include <iomanip>
#include <sstream>

#include <folly/portability/Windows.h>

extern "C" {
char* asctime_r(const tm* tm, char* buf) {
  char tmpBuf[64];
  if (asctime_s(tmpBuf, tm)) {
    return nullptr;
  }
  // Nothing we can do if the buff is to small :(
  return strcpy(buf, tmpBuf);
}

char* ctime_r(const time_t* t, char* buf) {
  char tmpBuf[64];
  if (ctime_s(tmpBuf, 64, t)) {
    return nullptr;
  }
  // Nothing we can do if the buff is to small :(
  return strcpy(buf, tmpBuf);
}

tm* gmtime_r(const time_t* t, tm* res) {
  if (!gmtime_s(res, t)) {
    return res;
  }
  return nullptr;
}

tm* localtime_r(const time_t* t, tm* o) {
  if (!localtime_s(o, t)) {
    return o;
  }
  return nullptr;
}

int nanosleep(const struct timespec* request, struct timespec* remain) {
  Sleep((DWORD)((request->tv_sec * 1000) + (request->tv_nsec / 1000000)));
  if (remain != nullptr) {
    remain->tv_nsec = 0;
    remain->tv_sec = 0;
  }
  return 0;
}

char* strptime(
    const char* __restrict s,
    const char* __restrict f,
    struct tm* __restrict tm) {
  // Isn't the C++ standard lib nice? std::get_time is defined such that its
  // format parameters are the exact same as strptime. Of course, we have to
  // create a string stream first, and imbue it with the current C locale, and
  // we also have to make sure we return the right things if it fails, or
  // if it succeeds, but this is still far simpler an implementation than any
  // of the versions in any of the C standard libraries.
  std::istringstream input(s);
  input.imbue(std::locale(setlocale(LC_ALL, nullptr)));
  input >> std::get_time(tm, f);
  if (input.fail()) {
    return nullptr;
  }
  return const_cast<char*>(s + input.tellg());
}
}
#endif
