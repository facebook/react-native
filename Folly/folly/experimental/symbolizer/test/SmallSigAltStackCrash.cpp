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

#include <signal.h>

#include <folly/experimental/symbolizer/SignalHandler.h>

namespace {
std::array<char, 8192> stack;
}

int main() {
  stack_t ss;
  ss.ss_sp = stack.data();
  ss.ss_size = stack.size();
  ss.ss_flags = 0;
  sigaltstack(&ss, nullptr);

  folly::symbolizer::installFatalSignalHandler();
  __builtin_trap();
  return 0;
}
