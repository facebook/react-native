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

#include <stdexcept>
#include <string>

namespace folly {

class FutureException : public std::logic_error {
 public:
  using std::logic_error::logic_error;
};

class BrokenPromise : public FutureException {
 public:
  explicit BrokenPromise(const std::string& type)
      : FutureException("Broken promise for type name `" + type + '`') {}

  explicit BrokenPromise(const char* type) : BrokenPromise(std::string(type)) {}
};

class NoState : public FutureException {
 public:
  NoState() : FutureException("No state") {}
};

class PromiseAlreadySatisfied : public FutureException {
 public:
  PromiseAlreadySatisfied() : FutureException("Promise already satisfied") {}
};

class FutureNotReady : public FutureException {
 public:
  FutureNotReady() : FutureException("Future not ready") {}
};

class FutureAlreadyRetrieved : public FutureException {
 public:
  FutureAlreadyRetrieved() : FutureException("Future already retrieved") {}
};

class FutureCancellation : public FutureException {
 public:
  FutureCancellation() : FutureException("Future was cancelled") {}
};

class TimedOut : public FutureException {
 public:
  TimedOut() : FutureException("Timed out") {}
};

class PredicateDoesNotObtain : public FutureException {
 public:
  PredicateDoesNotObtain() : FutureException("Predicate does not obtain") {}
};

struct NoFutureInSplitter : FutureException {
  NoFutureInSplitter() : FutureException("No Future in this FutureSplitter") {}
};
}
