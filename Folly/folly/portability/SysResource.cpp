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

#include <folly/portability/SysResource.h>

#include <errno.h>

#ifdef _WIN32
#include <folly/portability/Windows.h>

extern "C" {
int getrlimit(int type, rlimit* dst) {
  if (type == RLIMIT_STACK) {
    NT_TIB* tib = (NT_TIB*)NtCurrentTeb();
    dst->rlim_cur = (size_t)tib->StackBase - (size_t)tib->StackLimit;
    dst->rlim_max = dst->rlim_cur;
    return 0;
  }
  return -1;
}

int getrusage(int /* who */, rusage* usage) {
  // You get NOTHING! Good day to you sir.
  ZeroMemory(usage, sizeof(rusage));
  return 0;
}

int setrlimit(int /* type */, rlimit* /* src */) {
  // Do nothing for setting them for now.
  // We couldn't set the stack size at runtime even if we wanted to.
  return 0;
}

int getpriority(int which, int who) {
  if (which != PRIO_PROCESS || who != 0) {
    errno = EINVAL;
    return -1;
  }

  auto ret = GetPriorityClass(GetCurrentProcess());
  switch (ret) {
    case 0:
      errno = EACCES;
      return -1;
    case IDLE_PRIORITY_CLASS:
      return 39;
    case BELOW_NORMAL_PRIORITY_CLASS:
      return 30;
    case NORMAL_PRIORITY_CLASS:
      return 20;
    case ABOVE_NORMAL_PRIORITY_CLASS:
      return 10;
    case HIGH_PRIORITY_CLASS:
      return 0;
    case REALTIME_PRIORITY_CLASS:
      // I'd return -1 if it weren't an error :(
      // Realtime priority processes can't be set
      // through these APIs because it's a terrible idea.
      return 0;
    default:
      errno = EINVAL;
      return -1;
  }
}

int setpriority(int which, int who, int value) {
  if (which != PRIO_PROCESS || who != 0) {
    errno = EINVAL;
    return -1;
  }

  auto newClass = [value] {
    if (value >= 39) {
      return IDLE_PRIORITY_CLASS;
    } else if (value >= 30) {
      return BELOW_NORMAL_PRIORITY_CLASS;
    } else if (value >= 20) {
      return NORMAL_PRIORITY_CLASS;
    } else if (value >= 10) {
      return ABOVE_NORMAL_PRIORITY_CLASS;
    } else {
      return HIGH_PRIORITY_CLASS;
    }
  }();

  if (!SetPriorityClass(GetCurrentProcess(), newClass)) {
    errno = EACCES;
    return -1;
  }
  return 0;
}
}
#endif
