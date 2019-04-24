/*
 * Copyright 2014-present Facebook, Inc.
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
#ifdef __linux__
#include <sys/utsname.h>
#endif

#include <chrono>
#include <ostream>
#include <stdexcept>

#include <folly/Conv.h>
#include <folly/ScopeGuard.h>
#include <folly/String.h>
#include <folly/portability/Unistd.h>
#include <folly/system/ThreadId.h>

#include <glog/logging.h>

using std::string;
using namespace std::chrono;

namespace folly {

static int getLinuxVersion(StringPiece release) {
  auto dot1 = release.find('.');
  if (dot1 == StringPiece::npos) {
    throw std::invalid_argument("could not find first dot");
  }
  auto v1 = folly::to<int>(release.subpiece(0, dot1));

  auto dot2 = release.find('.', dot1 + 1);
  if (dot2 == StringPiece::npos) {
    throw std::invalid_argument("could not find second dot");
  }
  auto v2 = folly::to<int>(release.subpiece(dot1 + 1, dot2 - (dot1 + 1)));

  int dash = release.find('-', dot2 + 1);
  auto v3 = folly::to<int>(release.subpiece(dot2 + 1, dash - (dot2 + 1)));

  return ((v1 * 1000 + v2) * 1000) + v3;
}

#ifdef __linux__
/**
 * Determine the time units used in /proc/<pid>/schedstat
 *
 * Returns the number of nanoseconds per time unit,
 * or -1 if we cannot determine the units.
 */
static int64_t determineSchedstatUnits() {
  struct utsname unameInfo;
  if (uname(&unameInfo) != 0) {
    LOG(ERROR) << "unable to determine jiffies/second: uname failed: %s"
               << errnoStr(errno);
    return -1;
  }

  // In Linux version 2.6.23 and later, time time values are always
  // reported in nanoseconds.
  //
  // This change appears to have been made in commit 425e0968a25f, which
  // moved some of the sched stats code to a new file.  Despite the commit
  // message claiming "no code changes are caused by this patch", it changed
  // the task.sched_info.cpu_time and task.sched_info.run_delay counters to be
  // computed using sched_clock() rather than jiffies.
  int linuxVersion;
  try {
    linuxVersion = getLinuxVersion(unameInfo.release);
  } catch (const std::exception&) {
    LOG(ERROR) << "unable to determine jiffies/second: failed to parse "
               << "kernel release string \"" << unameInfo.release << "\"";
    return -1;
  }
  if (linuxVersion >= 2006023) {
    // The units are nanoseconds
    return 1;
  }

  // In Linux versions prior to 2.6.23, the time values are reported in
  // jiffies.  This is somewhat unfortunate, as the number of jiffies per
  // second is configurable.  We have to determine the units being used.
  //
  // It seems like the only real way to figure out the CONFIG_HZ value used by
  // this kernel is to look it up in the config file.
  //
  // Look in /boot/config-<kernel_release>
  char configPath[256];
  snprintf(
      configPath, sizeof(configPath), "/boot/config-%s", unameInfo.release);

  FILE* f = fopen(configPath, "r");
  if (f == nullptr) {
    LOG(ERROR) << "unable to determine jiffies/second: "
                  "cannot open kernel config file %s"
               << configPath;
    return -1;
  }
  SCOPE_EXIT {
    fclose(f);
  };

  int64_t hz = -1;
  char buf[1024];
  while (fgets(buf, sizeof(buf), f) != nullptr) {
    if (strcmp(buf, "CONFIG_NO_HZ=y\n") == 0) {
      LOG(ERROR) << "unable to determine jiffies/second: tickless kernel";
      return -1;
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

  if (hz == -1) {
    LOG(ERROR) << "unable to determine jiffies/second: no CONFIG_HZ setting "
                  "found in %s"
               << configPath;
    return -1;
  }

  return hz;
}
#endif

/**
 * Determine how long this process has spent waiting to get scheduled on the
 * CPU.
 *
 * Returns the number of nanoseconds spent waiting, or -1 if the amount of
 * time cannot be determined.
 */
static nanoseconds getSchedTimeWaiting(pid_t tid) {
#ifndef __linux__
  (void)tid;
  return nanoseconds(0);
#else
  static int64_t timeUnits = determineSchedstatUnits();
  if (timeUnits < 0) {
    // We couldn't figure out how many jiffies there are in a second.
    // Don't bother reading the schedstat info if we can't interpret it.
    return nanoseconds(0);
  }

  int fd = -1;
  try {
    char schedstatFile[256];
    snprintf(schedstatFile, sizeof(schedstatFile), "/proc/%d/schedstat", tid);
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
    int rc = sscanf(
        buf,
        "%" PRIu64 " %" PRIu64 " %" PRIu64 "\n",
        &activeJiffies,
        &waitingJiffies,
        &numTasks);
    if (rc != 3) {
      throw std::runtime_error("failed to parse schedstat data");
    }

    close(fd);
    return nanoseconds(waitingJiffies * timeUnits);
  } catch (const std::runtime_error& e) {
    if (fd >= 0) {
      close(fd);
    }
    LOG(ERROR) << "error determining process wait time: %s" << e.what();
    return nanoseconds(0);
  }
#endif
}

void TimePoint::reset() {
  // Remember the current time
  timeStart_ = steady_clock::now();

  // Remember how long this process has spent waiting to be scheduled
  tid_ = getOSThreadID();
  timeWaiting_ = getSchedTimeWaiting(tid_);

  // In case it took a while to read the schedstat info,
  // also record the time after the schedstat check
  timeEnd_ = steady_clock::now();
}

std::ostream& operator<<(std::ostream& os, const TimePoint& timePoint) {
  os << "TimePoint(" << timePoint.getTimeStart().time_since_epoch().count()
     << ", " << timePoint.getTimeEnd().time_since_epoch().count() << ", "
     << timePoint.getTimeWaiting().count() << ")";
  return os;
}

bool checkTimeout(
    const TimePoint& start,
    const TimePoint& end,
    nanoseconds expected,
    bool allowSmaller,
    nanoseconds tolerance) {
  auto elapsedTime = end.getTimeStart() - start.getTimeEnd();

  if (!allowSmaller) {
    // Timeouts should never fire before the time was up.
    // Allow 1ms of wiggle room for rounding errors.
    if (elapsedTime < (expected - milliseconds(1))) {
      return false;
    }
  }

  // Check that the event fired within a reasonable time of the timout.
  //
  // If the system is under heavy load, our process may have had to wait for a
  // while to be run.  The time spent waiting for the processor shouldn't
  // count against us, so exclude this time from the check.
  nanoseconds timeExcluded;
  if (end.getTid() != start.getTid()) {
    // We can only correctly compute the amount of time waiting to be scheduled
    // if both TimePoints were set in the same thread.
    timeExcluded = nanoseconds(0);
  } else {
    timeExcluded = end.getTimeWaiting() - start.getTimeWaiting();
    assert(end.getTimeWaiting() >= start.getTimeWaiting());
    // Add a tolerance here due to precision issues on linux, see below note.
    assert((elapsedTime + tolerance) >= timeExcluded);
  }

  nanoseconds effectiveElapsedTime(0);
  if (elapsedTime > timeExcluded) {
    effectiveElapsedTime = elapsedTime - timeExcluded;
  }

  // On x86 Linux, sleep calls generally have precision only to the nearest
  // millisecond.  The tolerance parameter lets users allow a few ms of slop.
  auto overrun = effectiveElapsedTime - expected;
  if (overrun > tolerance) {
    return false;
  }

  return true;
}

} // namespace folly
