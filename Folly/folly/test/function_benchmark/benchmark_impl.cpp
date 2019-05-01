/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/test/function_benchmark/benchmark_impl.h>

#include <folly/test/function_benchmark/test_functions.h>

/*
 * These functions are defined in a separate file so that gcc won't be able to
 * inline them and optimize away the indirect calls.
 */

void BM_fn_ptr_invoke_impl(int iters, void (*fn)()) {
  for (int n = 0; n < iters; ++n) {
    fn();
  }
}

void BM_std_function_invoke_impl(int iters, const std::function<void()>& fn) {
  for (int n = 0; n < iters; ++n) {
    fn();
  }
}

void BM_Function_invoke_impl(
    int iters,
    const folly::Function<void() const>& fn) {
  for (int n = 0; n < iters; ++n) {
    fn();
  }
}

void BM_mem_fn_invoke_impl(
    int iters,
    TestClass* tc,
    void (TestClass::*memfn)()) {
  for (int n = 0; n < iters; ++n) {
    (tc->*memfn)();
  }
}

void BM_virtual_fn_invoke_impl(int iters, VirtualClass* vc) {
  for (int n = 0; n < iters; ++n) {
    vc->doNothing();
  }
}
