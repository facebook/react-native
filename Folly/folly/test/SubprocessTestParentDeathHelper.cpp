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

// This is a helper for the parentDeathSignal test in SubprocessTest.cpp.
//
// Basically, we create two processes, a parent and a child, and set the
// child to receive SIGUSR1 when the parent exits.  We set the child to
// create a file when that happens.  The child then kills the parent; the test
// will verify that the file actually gets created, which means that everything
// worked as intended.

#include <sys/types.h>
#include <fcntl.h>
#include <signal.h>

#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/Subprocess.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/Unistd.h>

using folly::Subprocess;

DEFINE_bool(child, false, "");

namespace {
constexpr int kSignal = SIGUSR1;
}  // namespace

void runChild(const char* file) {
  // Block SIGUSR1 so it's queued
  sigset_t sigs;
  CHECK_ERR(sigemptyset(&sigs));
  CHECK_ERR(sigaddset(&sigs, kSignal));
  CHECK_ERR(sigprocmask(SIG_BLOCK, &sigs, nullptr));

  // Kill the parent, wait for our signal.
  CHECK_ERR(kill(getppid(), SIGKILL));

  int sig = 0;
  CHECK_ERR(sigwait(&sigs, &sig));
  CHECK_EQ(sig, kSignal);

  // Signal completion by creating the file
  CHECK_ERR(creat(file, 0600));
}

[[noreturn]] void runParent(const char* file) {
  std::vector<std::string> args {"/proc/self/exe", "--child", file};
  Subprocess proc(
      args,
      Subprocess::Options().parentDeathSignal(kSignal));
  CHECK(proc.poll().running());

  // The child will kill us.
  for (;;) {
    pause();
  }
}

int main(int argc, char *argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  CHECK_EQ(argc, 2);
  if (FLAGS_child) {
    runChild(argv[1]);
  } else {
    runParent(argv[1]);
  }
  return 0;
}
