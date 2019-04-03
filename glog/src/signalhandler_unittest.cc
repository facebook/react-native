// Copyright (c) 2008, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Author: Satoru Takabayashi
//
// This is a helper binary for testing signalhandler.cc.  The actual test
// is done in signalhandler_unittest.sh.

#include "utilities.h"

#include <pthread.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include "glog/logging.h"

#ifdef HAVE_LIB_GFLAGS
#include <gflags/gflags.h>
using namespace GFLAGS_NAMESPACE;
#endif

using namespace GOOGLE_NAMESPACE;

void* DieInThread(void*) {
  // We assume pthread_t is an integral number or a pointer, rather
  // than a complex struct.  In some environments, pthread_self()
  // returns an uint64 but in some other environments pthread_self()
  // returns a pointer.  Hence we use C-style cast here, rather than
  // reinterpret/static_cast, to support both types of environments.
  fprintf(stderr, "0x%lx is dying\n", (long)pthread_self());
  // Use volatile to prevent from these to be optimized away.
  volatile int a = 0;
  volatile int b = 1 / a;
  fprintf(stderr, "We should have died: b=%d\n", b);
  return NULL;
}

void WriteToStdout(const char* data, int size) {
  if (write(STDOUT_FILENO, data, size) < 0) {
    // Ignore errors.
  }
}

int main(int argc, char **argv) {
#if defined(HAVE_STACKTRACE) && defined(HAVE_SYMBOLIZE)
  InitGoogleLogging(argv[0]);
#ifdef HAVE_LIB_GFLAGS
  ParseCommandLineFlags(&argc, &argv, true);
#endif
  InstallFailureSignalHandler();
  const std::string command = argc > 1 ? argv[1] : "none";
  if (command == "segv") {
    // We'll check if this is outputted.
    LOG(INFO) << "create the log file";
    LOG(INFO) << "a message before segv";
    // We assume 0xDEAD is not writable.
    int *a = (int*)0xDEAD;
    *a = 0;
  } else if (command == "loop") {
    fprintf(stderr, "looping\n");
    while (true);
  } else if (command == "die_in_thread") {
    pthread_t thread;
    pthread_create(&thread, NULL, &DieInThread, NULL);
    pthread_join(thread, NULL);
  } else if (command == "dump_to_stdout") {
    InstallFailureWriter(WriteToStdout);
    abort();
  } else {
    // Tell the shell script
    puts("OK");
  }
#endif
  return 0;
}
