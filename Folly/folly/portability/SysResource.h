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

#pragma once

#ifndef _WIN32
#include <sys/resource.h>
#else
#include <cstdint>

#include <folly/portability/SysTime.h>

#define PRIO_PROCESS 1

#define RLIMIT_CORE 0
#define RLIMIT_NOFILE 0
#define RLIMIT_DATA 0
#define RLIMIT_STACK 3
#define RLIM_INFINITY SIZE_MAX

#define RUSAGE_SELF 0
#define RUSAGE_CHILDREN 0
#define RUSAGE_THREAD 0

using rlim_t = size_t;
struct rlimit {
  rlim_t rlim_cur;
  rlim_t rlim_max;
};

struct rusage {
  timeval ru_utime;
  timeval ru_stime;
  long ru_maxrss;
  long ru_ixrss;
  long ru_idrss;
  long ru_isrss;
  long ru_minflt;
  long ru_majflt;
  long ru_nswap;
  long ru_inblock;
  long ru_oublock;
  long ru_msgsnd;
  long ru_msgrcv;
  long ru_nsignals;
  long ru_nvcsw;
  long ru_nivcsw;
};

extern "C" {
int getrlimit(int type, rlimit* dst);
int getrusage(int who, rusage* usage);
int setrlimit(int type, rlimit* src);

int getpriority(int which, int who);
int setpriority(int which, int who, int value);
}
#endif
