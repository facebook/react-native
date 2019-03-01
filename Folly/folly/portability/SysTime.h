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

#pragma once

#ifndef _WIN32
#include <sys/time.h>
#else
// Someone decided this was a good place to define timeval.....
#include <folly/portability/Windows.h>
struct timezone {
  int tz_minuteswest;
  int tz_dsttime;
};

extern "C" {
int gettimeofday(timeval* tv, timezone*);
void timeradd(timeval* a, timeval* b, timeval* res);
void timersub(timeval* a, timeval* b, timeval* res);
}
#endif
