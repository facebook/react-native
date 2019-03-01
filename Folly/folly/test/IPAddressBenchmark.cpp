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

#include <folly/IPAddress.h>

#include <glog/logging.h>

#include <folly/Benchmark.h>

using namespace folly;
using std::string;

BENCHMARK(ipv4_to_string_inet_ntop, iters) {
  folly::IPAddressV4 ipv4Addr("127.0.0.1");
  in_addr ip = ipv4Addr.toAddr();
  char outputString[INET_ADDRSTRLEN] = {0};

  while (iters--) {
    const char* val = inet_ntop(
      AF_INET,
      &ip,
      outputString,
      sizeof(outputString));
  }
}

BENCHMARK_RELATIVE(ipv4_to_fully_qualified, iters) {
  IPAddressV4 ip("127.0.0.1");
  while (iters--) {
    string outputString = ip.toFullyQualified();
  }
}

BENCHMARK_DRAW_LINE()

BENCHMARK(ipv6_to_string_inet_ntop, iters) {
  IPAddressV6 ipv6Addr("F1E0:0ACE:FB94:7ADF:22E8:6DE6:9672:3725");
  in6_addr ip = ipv6Addr.toAddr();
  char outputString[INET6_ADDRSTRLEN] = {0};
  bool checkResult = (iters == 1);

  while (iters--) {
    const char* val = inet_ntop(
      AF_INET6,
      &ip,
      outputString,
      sizeof(outputString));
  }
}

BENCHMARK_RELATIVE(ipv6_to_fully_qualified, iters) {
  IPAddressV6 ip("F1E0:0ACE:FB94:7ADF:22E8:6DE6:9672:3725");
  string outputString;
  while (iters--) {
    outputString = ip.toFullyQualified();
  }
}

// Benchmark results on Intel Xeon CPU E5-2660 @ 2.20GHz
// ============================================================================
// folly/test/IPAddressBenchmark.cpp               relative  time/iter  iters/s
// ============================================================================
// ipv4_to_string_inet_ntop                                   237.87ns    4.20M
// ipv4_to_fully_qualified                          362.31%    65.65ns   15.23M
// ----------------------------------------------------------------------------
// ipv6_to_string_inet_ntop                                   768.60ns    1.30M
// ipv6_to_fully_qualified                          821.81%    93.53ns   10.69M
// ============================================================================

int main(int argc, char *argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  runBenchmarks();
  return 0;
}
