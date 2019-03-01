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

#include <folly/portability/SysResource.h>

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
}
#endif
