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

#include <thread>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/File.h>
#include <folly/gen/Base.h>
#include <folly/gen/File.h>

using namespace folly::gen;

BENCHMARK(ByLine_Pipes, iters) {
  std::thread thread;
  int rfd = -1;
  int wfd;
  BENCHMARK_SUSPEND {
    int p[2];
    CHECK_ERR(::pipe(p));
    rfd = p[0];
    wfd = p[1];
    thread = std::thread([wfd, iters] {
      char x = 'x';
      PCHECK(::write(wfd, &x, 1) == 1); // signal startup
      FILE* f = fdopen(wfd, "w");
      PCHECK(f);
      for (size_t i = 1; i <= iters; ++i) {
        fprintf(f, "%zu\n", i);
      }
      fclose(f);
    });
    char buf;
    PCHECK(::read(rfd, &buf, 1) == 1); // wait for startup
  }

  CHECK_ERR(rfd);
  auto s = byLine(folly::File(rfd)) | eachTo<int64_t>() | sum;
  folly::doNotOptimizeAway(s);

  BENCHMARK_SUSPEND {
    ::close(rfd);
    CHECK_EQ(s, int64_t(iters) * (iters + 1) / 2);
    thread.join();
  }
}

// Results from an Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
// ============================================================================
// folly/gen/test/FileBenchmark.cpp                relative  time/iter  iters/s
// ============================================================================
// ByLine_Pipes                                               148.63ns    6.73M
// ============================================================================

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
