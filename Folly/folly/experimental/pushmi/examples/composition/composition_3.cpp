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

#include <folly/experimental/pushmi/o/defer.h>
#include <folly/experimental/pushmi/o/share.h>

#include <folly/experimental/pushmi/o/just.h>
#include <folly/experimental/pushmi/o/tap.h>

// https://godbolt.org/g/rVLMTu

using namespace pushmi::aliases;

// three models of submission deferral
//  (none of these use an executor, they are all running
//  synchronously on the main thread)

// this constructs eagerly and submits just() lazily
auto defer_execution() {
  printf("construct just\n");
  return op::just(42) | op::tap([](int v) { printf("just - %d\n", v); });
}

// this constructs defer() eagerly, constructs just() and submits just() lazily
auto defer_construction() {
  return op::defer([] { return defer_execution(); });
}

// this constructs defer(), constructs just() and submits just() eagerly
auto eager_execution() {
  return defer_execution() | op::share<int>();
}

int main() {
  printf("\ncall defer_execution\n");
  auto de = defer_execution();
  printf("submit defer_execution\n");
  de | op::submit();
  // call defer_execution
  // construct just
  // submit defer_execution
  // just - 42

  printf("\ncall defer_construction\n");
  auto dc = defer_construction();
  printf("submit defer_construction\n");
  dc | op::submit();
  // call defer_construction
  // submit defer_construction
  // construct just
  // just - 42

  printf("\ncall eager_execution\n");
  auto ee = eager_execution();
  printf("submit eager_execution\n");
  ee | op::submit();
  // call eager_execution
  // construct just
  // just - 42
  // submit eager_execution

  std::cout << "OK" << std::endl;
  // OK
}
