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

#pragma once

#include <functional>

#include <folly/Function.h>

class TestClass;
class VirtualClass;

void BM_fn_ptr_invoke_impl(int iters, void (*fn)());
void BM_std_function_invoke_impl(int iters, const std::function<void()>& fn);
void BM_Function_invoke_impl(
    int iters,
    const folly::Function<void() const>& fn);
void BM_mem_fn_invoke_impl(
    int iters,
    TestClass* tc,
    void (TestClass::*memfn)());
void BM_virtual_fn_invoke_impl(int iters, VirtualClass* vc);

// Inlined version of BM_fn_ptr_invoke_impl().
// The compiler could potentially even optimize the call to the function
// pointer if it is a constexpr.
inline void BM_fn_ptr_invoke_inlined_impl(int iters, void (*fn)()) {
  for (int n = 0; n < iters; ++n) {
    fn();
  }
}

// Invoke a function object as a template parameter.
// This can be used to directly invoke lambda functions
template <typename T>
void BM_invoke_fn_template_impl(int iters, const T& fn) {
  for (int n = 0; n < iters; ++n) {
    fn();
  }
}
