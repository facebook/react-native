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

#include <folly/portability/SysTime.h>

#ifdef _WIN32

#include <cstdint>

extern "C" {
int gettimeofday(timeval* tv, struct timezone*) {
  constexpr auto posixWinFtOffset = 116444736000000000ULL;

  if (tv) {
    FILETIME ft;
    ULARGE_INTEGER lft;
    GetSystemTimeAsFileTime(&ft);
    // As per the docs of FILETIME, don't just do an indirect
    // pointer cast, to avoid alignment faults.
    lft.HighPart = ft.dwHighDateTime;
    lft.LowPart = ft.dwLowDateTime;
    uint64_t ns = lft.QuadPart;
    tv->tv_usec = (long)((ns / 10ULL) % 1000000ULL);
    tv->tv_sec = (long)((ns - posixWinFtOffset) / 10000000ULL);
  }

  return 0;
}

void timeradd(timeval* a, timeval* b, timeval* res) {
  res->tv_sec = a->tv_sec + b->tv_sec;
  res->tv_usec = a->tv_usec + b->tv_usec;
  if (res->tv_usec >= 1000000) {
    res->tv_sec++;
    res->tv_usec -= 1000000;
  }
}

void timersub(timeval* a, timeval* b, timeval* res) {
  res->tv_sec = a->tv_sec - b->tv_sec;
  res->tv_usec = a->tv_usec - b->tv_usec;
  if (res->tv_usec < 0) {
    res->tv_sec--;
    res->tv_usec += 1000000;
  }
}
}

#endif
