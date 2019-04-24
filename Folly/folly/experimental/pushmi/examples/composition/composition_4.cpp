/*
 * Copyright 2018-present Facebook, Inc.
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
#include <algorithm>
#include <cassert>
#include <iostream>
#include <vector>

#include <folly/experimental/pushmi/examples/pool.h>

#include <folly/experimental/pushmi/strand.h>

#include <folly/experimental/pushmi/o/request_via.h>

#include <folly/experimental/pushmi/o/tap.h>
#include <folly/experimental/pushmi/o/transform.h>

using namespace pushmi::aliases;

template <class Io>
auto io_operation(Io io) {
  return io | op::transform([](auto) { return 42; }) |
      op::tap([](int v) { printf("io pool producing, %d\n", v); }) |
      op::request_via();
}

int main() {
  mi::pool cpuPool{std::max(1u, std::thread::hardware_concurrency())};
  mi::pool ioPool{std::max(1u, std::thread::hardware_concurrency())};

  auto io = ioPool.executor();
  auto cpu = cpuPool.executor();

  io_operation(io).via(mi::strands(cpu)) |
      op::tap([](int v) { printf("cpu pool processing, %d\n", v); }) |
      op::submit();

  // when the caller is not going to process the result (only side-effect
  // matters) or the caller is just going to push the result into a queue.
  // provide a way to skip the transition to a different executor and make it
  // stand out so that it has to be justified in code reviews.
  mi::via_cast<mi::is_sender<>>(io_operation(io)) | op::submit();

  ioPool.wait();
  cpuPool.wait();

  std::cout << "OK" << std::endl;
}
