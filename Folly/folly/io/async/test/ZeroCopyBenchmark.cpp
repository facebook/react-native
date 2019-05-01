/*
 * Copyright 2017-present Facebook, Inc.
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
#include <folly/io/async/test/ZeroCopy.h>
#include <folly/portability/GFlags.h>

using namespace folly;
namespace {
void runClient(
    const std::string& host,
    uint16_t port,
    int numLoops,
    bool zeroCopy,
    size_t bufferSize) {
  LOG(INFO) << "Running client. host = " << host << " port = " << port
            << " numLoops = " << numLoops << " zeroCopy = " << zeroCopy
            << " bufferSize = " << bufferSize;

  size_t counter = 1;
  EventBase evb;
  std::unique_ptr<ZeroCopyTestAsyncSocket> client(new ZeroCopyTestAsyncSocket(
      &counter, &evb, numLoops, bufferSize, zeroCopy));
  SocketAddress addr(host, port);
  evb.runInEventBaseThread([&]() { client->connect(addr); });

  evb.loopForever();
}

void runServer(uint16_t port, int numLoops, bool zeroCopy, size_t bufferSize) {
  LOG(INFO) << "Running server. port = " << port << " numLoops = " << numLoops
            << " zeroCopy = " << zeroCopy << " bufferSize = " << bufferSize;

  EventBase evb;
  folly::AsyncServerSocket::UniquePtr listenSock(
      new folly::AsyncServerSocket(&evb));
  ZeroCopyTestServer server(&evb, numLoops, bufferSize, zeroCopy);

  server.addCallbackToServerSocket(*listenSock);

  evb.runInEventBaseThread([&]() {
    listenSock->bind(port);
    listenSock->setZeroCopy(zeroCopy);
    listenSock->listen(10);
    listenSock->startAccepting();
  });

  evb.loopForever();
}
} // namespace

static auto constexpr kMaxLoops = 20000;

void zeroCopyOn(unsigned iters, size_t bufferSize, size_t numClients = 1) {
  BenchmarkSuspender susp;
  ZeroCopyTest test(numClients, iters, true, bufferSize);
  susp.dismiss();
  test.run();
  susp.rehire();
}

void zeroCopyOff(unsigned iters, size_t bufferSize, size_t numClients = 1) {
  BenchmarkSuspender susp;
  ZeroCopyTest test(numClients, iters, false, bufferSize);
  susp.dismiss();
  test.run();
  susp.rehire();
}

static auto constexpr kNumClients = 40;

void zeroCopyOnMulti(unsigned iters, size_t bufferSize) {
  zeroCopyOn(iters, bufferSize, kNumClients);
}

void zeroCopyOffMulti(unsigned iters, size_t bufferSize) {
  zeroCopyOff(iters, bufferSize, kNumClients);
}

BENCHMARK_PARAM(zeroCopyOn, 4096)
BENCHMARK_PARAM(zeroCopyOff, 4096)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 8192)
BENCHMARK_PARAM(zeroCopyOff, 8192)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 16384)
BENCHMARK_PARAM(zeroCopyOff, 16384)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 32768)
BENCHMARK_PARAM(zeroCopyOff, 32768)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 65536)
BENCHMARK_PARAM(zeroCopyOff, 65536)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 131072)
BENCHMARK_PARAM(zeroCopyOff, 131072)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 262144)
BENCHMARK_PARAM(zeroCopyOff, 262144)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 524288)
BENCHMARK_PARAM(zeroCopyOff, 524288)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOn, 1048576)
BENCHMARK_PARAM(zeroCopyOff, 1048576)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(zeroCopyOnMulti, 1048576)
BENCHMARK_PARAM(zeroCopyOffMulti, 1048576)
BENCHMARK_DRAW_LINE();

DEFINE_bool(client, false, "client mode");
DEFINE_bool(server, false, "server mode");
DEFINE_bool(zeroCopy, false, "use zerocopy");
DEFINE_int32(numLoops, kMaxLoops, "number of loops");
DEFINE_int32(bufferSize, 524288, "buffer size");
DEFINE_int32(port, 33130, "port");
DEFINE_string(host, "::1", "host");

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  if (FLAGS_client) {
    runClient(
        FLAGS_host,
        FLAGS_port,
        FLAGS_numLoops,
        FLAGS_zeroCopy,
        FLAGS_bufferSize);
  } else if (FLAGS_server) {
    runServer(FLAGS_port, FLAGS_numLoops, FLAGS_zeroCopy, FLAGS_bufferSize);
  } else {
    runBenchmarks();
  }
}
