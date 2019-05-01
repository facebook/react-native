/*
 * Copyright 2012-present Facebook, Inc.
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
#include <iostream>
#include <stdexcept>

#include <folly/experimental/exception_tracer/ExceptionTracer.h>

// clang-format off
[[noreturn]] void bar() {
  throw std::runtime_error("hello");
}
// clang-format on

void dumpExceptions(const char* prefix) {
  std::cerr << "--- " << prefix << "\n";
  auto exceptions = ::folly::exception_tracer::getCurrentExceptions();
  for (auto& exc : exceptions) {
    std::cerr << exc << "\n";
  }
}

void foo() {
  try {
    try {
      bar();
    } catch (const std::exception& e) {
      dumpExceptions("foo: simple catch");
      bar();
    }
  } catch (const std::exception& e) {
    dumpExceptions("foo: catch, exception thrown from previous catch block");
  }
}

[[noreturn]] void baz() {
  try {
    try {
      bar();
    } catch (...) {
      dumpExceptions("baz: simple catch");
      throw;
    }
  } catch (const std::exception& e) {
    dumpExceptions("baz: catch rethrown exception");
    throw "hello";
  }
}

void testExceptionPtr1() {
  std::exception_ptr exc;
  try {
    bar();
  } catch (...) {
    exc = std::current_exception();
  }

  try {
    std::rethrow_exception(exc);
  } catch (...) {
    dumpExceptions("std::rethrow_exception 1");
  }
}

void testExceptionPtr2() {
  std::exception_ptr exc;
  try {
    throw std::out_of_range("x");
  } catch (...) {
    exc = std::current_exception();
  }

  try {
    std::rethrow_exception(exc);
  } catch (...) {
    dumpExceptions("std::rethrow_exception 2");
  }
}

int main(int /* argc */, char* /* argv */ []) {
  foo();
  testExceptionPtr1();
  testExceptionPtr2();
  baz();
  // no return because baz() is [[noreturn]]
}
