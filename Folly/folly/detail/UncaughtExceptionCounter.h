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

#pragma once

#include <exception>

#include <folly/UncaughtExceptions.h>

namespace folly { namespace detail {

/**
 * Used to check if a new uncaught exception was thrown by monitoring the
 * number of uncaught exceptions.
 *
 * Usage:
 *  - create a new UncaughtExceptionCounter object
 *  - call isNewUncaughtException() on the new object to check if a new
 *    uncaught exception was thrown since the object was created
 */
class UncaughtExceptionCounter {
 public:
  UncaughtExceptionCounter() noexcept
      : exceptionCount_(folly::uncaught_exceptions()) {}

  UncaughtExceptionCounter(const UncaughtExceptionCounter& other) noexcept
      : exceptionCount_(other.exceptionCount_) {}

  bool isNewUncaughtException() noexcept {
    return folly::uncaught_exceptions() > exceptionCount_;
  }

 private:
  int exceptionCount_;
};

}} // namespaces
