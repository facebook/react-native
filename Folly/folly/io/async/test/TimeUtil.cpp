/*
 * Copyright 2017 Facebook, Inc.
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
#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS
#endif

#include <folly/io/async/test/TimeUtil.h>

#include <errno.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#ifndef _MSC_VER
#include <sys/utsname.h>
#endif

#include <chrono>
#include <ostream>
#include <stdexcept>

#include <folly/Conv.h>
#include <folly/portability/SysSyscall.h>
#include <folly/portability/Unistd.h>
#include <folly/portability/Windows.h>

#include <glog/logging.h>

using std::string;
using namespace std::chrono;

namespace folly {

#ifdef _MSC_VER
static pid_t gettid() {
  return pid_t(GetCurrentThreadId());
}
#else
/**
 * glibc doesn't provide gettid(), so define it ourselves.
 */
static pid_t gettid() {
  return syscall(FOLLY_SYS_gettid);
}

/**
 * The /proc/<pid>/schedstat file reports time values in jiffies.
 *
 * Determine how many jiffies are in a second.
 * Returns -1 if the number of jiffies/second cannot be determined.
 */
static int64_t determineJiffiesHZ() {
  // It seems like the only real way to figure out the CONFIG_HZ value used by
  // this kernel is to look it up in the config file.
  //
  // Look in /boot/config-<kernel_release>
  struct utsname unameInfo;
  if (uname(&unameInfo) != 0) {
    LOG(ERROR) << "unable to determine jiffies/second: uname failed: %s"
               << strerror(errno);
    return -1;
  }

  char configPath[256];
  snprintf(configPath, sizeof(configPath), "/boot/config-%s",
           unameInfo.release);

  FILE* f = fopen(configPath, "r");
  if (f == nullptr) {
    LOG(ERROR) << "unable to determine jiffies/second: "
      "cannot open kernel config file %s" << configPath;
    return -1;
  }

  int64_t hz = -1;
  char buf[1024];
  while (fgets(buf, sizeof(buf), f) != nullptr) {
    if (strcmp(buf, "CONFIG_NO_HZ=y\n") == 0) {
      // schedstat info seems to be reported in nanoseconds on tickless
      // kernels.
      //
      // The CONFIG_HZ value doesn't matter for our purposes,
      // so return as soon as we see CONFIG_NO_HZ.
      fclose(f);
      return 1000000000;
    } else if (strcmp(buf, "CONFIG_HZ=1000\n") == 0) {
      hz = 1000;
    } else if (strcmp(buf, "CONFIG_HZ=300\n") == 0) {
      hz = 300;
    } else if (strcmp(buf, "CONFIG_HZ=250\n") == 0) {
      hz = 250;
    } else if (strcmp(buf, "CONFIG_HZ=100\n") == 0) {
      hz = 100;
    }
  }
  fclose(f);

  if (hz == -1) {
    LOG(ERROR) << "unable to determine jiffies/second: no CONFIG_HZ setting "
      "found in %s" << configPath;
    return -1;
  }

  return hz;
}
#endif

/**
 * Determine how long this process has spent waiting to get scheduled on the
 * CPU.
 *
 * Returns the number of milliseconds spent waiting, or -1 if the amount of
 * time cannot be determined.
 */
static milliseconds getTimeWaitingMS(pid_t tid) {
#ifdef _MSC_VER
  return milliseconds(0);
#else
  static int64_t jiffiesHZ = 0;
  if (jiffiesHZ == 0) {
    jiffiesHZ = determineJiffiesHZ();
  }

  if (jiffiesHZ < 0) {
    // We couldn't figure out how many jiffies there are in a second.
    // Don't bother reading the schedstat info if we can't interpret it.
    return milliseconds(0);
  }

  int fd = -1;
  try {
    char schedstatFile[256];
    snprintf(schedstatFile, sizeof(schedstatFile),
             "/proc/%d/schedstat", tid);
    fd = open(schedstatFile, O_RDONLY);
    if (fd < 0) {
      throw std::runtime_error(
        folly::to<string>("failed to open process schedstat file", errno));
    }

    char buf[512];
    ssize_t bytesReadRet = read(fd, buf, sizeof(buf) - 1);
    if (bytesReadRet <= 0) {
      throw std::runtime_error(
        folly::to<string>("failed to read process schedstat file", errno));
    }
    size_t bytesRead = size_t(bytesReadRet);

    if (buf[bytesRead - 1] != '\n') {
      throw std::runtime_error("expected newline at end of schedstat data");
    }
    assert(bytesRead < sizeof(buf));
    buf[bytesRead] = '\0';

    uint64_t activeJiffies = 0;
    uint64_t waitingJiffies = 0;
    uint64_t numTasks = 0;
    int rc = sscanf(buf, "%" PRIu64 " %" PRIu64 " %" PRIu64 "\n",
                    &activeJiffies, &waitingJiffies, &numTasks);
    if (rc != 3) {
      throw std::runtime_error("failed to parse schedstat data");
    }

    close(fd);
    return milliseconds((waitingJiffies * 1000) / jiffiesHZ);
  } catch (const std::runtime_error& e) {
    if (fd >= 0) {
      close(fd);
    }
    LOG(ERROR) << "error determining process wait time: %s" << e.what();
    return milliseconds(0);
  }
#endif
}

void TimePoint::reset() {
  // Remember the current time
  timeStart_ = system_clock::now();

  // Remember how long this process has spent waiting to be scheduled
  tid_ = gettid();
  timeWaiting_ = getTimeWaitingMS(tid_);

  // In case it took a while to read the schedstat info,
  // also record the time after the schedstat check
  timeEnd_ = system_clock::now();
}

std::ostream& operator<<(std::ostream& os, const TimePoint& timePoint) {
  os << "TimePoint(" << timePoint.getTimeStart().time_since_epoch().count()
     << ", " << timePoint.getTimeEnd().time_since_epoch().count() << ", "
     << timePoint.getTimeWaiting().count() << ")";
  return os;
}

bool
checkTimeout(const TimePoint& start, const TimePoint& end,
             milliseconds expectedMS, bool allowSmaller,
             milliseconds tolerance) {
  auto elapsedMS = end.getTimeStart() - start.getTimeEnd();

  if (!allowSmaller) {
    // Timeouts should never fire before the time was up.
    // Allow 1ms of wiggle room for rounding errors.
    if (elapsedMS < expectedMS - milliseconds(1)) {
      return false;
    }
  }

  // Check that the event fired within a reasonable time of the timout.
  //
  // If the system is under heavy load, our process may have had to wait for a
  // while to be run.  The time spent waiting for the processor shouldn't
  // count against us, so exclude this time from the check.
  milliseconds excludedMS;
  if (end.getTid() != start.getTid()) {
    // We can only correctly compute the amount of time waiting to be scheduled
    // if both TimePoints were set in the same thread.
    excludedMS = milliseconds(0);
  } else {
    excludedMS = end.getTimeWaiting() - start.getTimeWaiting();
    assert(end.getTimeWaiting() >= start.getTimeWaiting());
    // Add a tolerance here due to precision issues on linux, see below note.
    assert( (elapsedMS + tolerance) >= excludedMS);
  }

  milliseconds effectiveElapsedMS = milliseconds(0);
  if (elapsedMS > excludedMS) {
    effectiveElapsedMS =  duration_cast<milliseconds>(elapsedMS) - excludedMS;
  }

  // On x86 Linux, sleep calls generally have precision only to the nearest
  // millisecond.  The tolerance parameter lets users allow a few ms of slop.
  milliseconds overrun = effectiveElapsedMS - expectedMS;
  if (overrun > tolerance) {
    return false;
  }

  return true;
}

}
