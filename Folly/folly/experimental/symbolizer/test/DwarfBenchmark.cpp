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

#include <folly/Benchmark.h>
#include <folly/experimental/symbolizer/Dwarf.h>
#include <folly/portability/GFlags.h>

void dummy() {}

namespace {

using namespace folly::symbolizer;

void run(Dwarf::LocationInfoMode mode, size_t n) {
  folly::BenchmarkSuspender suspender;
  // NOTE: Using '/proc/self/exe' only works if the code for @dummy is
  // statically linked into the binary.
  ElfFile elf("/proc/self/exe");
  Dwarf dwarf(&elf);
  suspender.dismiss();
  for (size_t i = 0; i < n; i++) {
    Dwarf::LocationInfo info;
    dwarf.findAddress(uintptr_t(&dummy), info, mode);
  }
}

} // namespace

BENCHMARK(DwarfFindAddressFast, n) {
  run(folly::symbolizer::Dwarf::LocationInfoMode::FAST, n);
}

BENCHMARK(DwarfFindAddressFull, n) {
  run(folly::symbolizer::Dwarf::LocationInfoMode::FULL, n);
}

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  google::InitGoogleLogging(argv[0]);
  folly::runBenchmarksOnFlag();
  return 0;
}
