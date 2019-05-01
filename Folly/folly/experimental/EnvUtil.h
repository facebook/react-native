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
#pragma once

#include <map>
#include <string>
#include <unordered_map>
#include <vector>

#include <folly/CPortability.h>
#include <folly/Memory.h>

namespace folly {
namespace experimental {

// Class to model the process environment in idiomatic C++
//
// Changes to the modeled environment do not change the process environment
// unless `setAsCurrentEnvironment()` is called.
struct EnvironmentState {
  using EnvType = std::unordered_map<std::string, std::string>;

  // Returns an EnvironmentState containing a copy of the current process
  // environment. Subsequent changes to the process environment do not
  // alter the stored model. If the process environment is altered during the
  // execution of this method the results are not defined.
  //
  // Throws MalformedEnvironment if the process environment cannot be modeled.
  static EnvironmentState fromCurrentEnvironment();

  // Returns an empty EnvironmentState
  static EnvironmentState empty() {
    return {};
  }

  explicit EnvironmentState(EnvType const& env) : env_(env) {}
  explicit EnvironmentState(EnvType&& env) : env_(std::move(env)) {}

  // Get the model environment for querying.
  EnvType const& operator*() const {
    return env_;
  }
  EnvType const* operator->() const {
    return &env_;
  }

  // Get the model environment for mutation or querying.
  EnvType& operator*() {
    return env_;
  }
  EnvType* operator->() {
    return &env_;
  }

  // Update the process environment with the one in the stored model.
  // Subsequent changes to the model do not alter the process environment. The
  // state of the process environment during execution of this method is not
  // defined. If the process environment is altered by another thread during the
  // execution of this method the results are not defined.
  void setAsCurrentEnvironment();

  // Get a copy of the model environment in the form used by `folly::Subprocess`
  std::vector<std::string> toVector() const;

  // Get a copy of the model environment in the form commonly used by C routines
  // such as execve, execle, etc. Example usage:
  //
  // EnvironmentState forChild{};
  // ... manipulate `forChild` as needed ...
  // execve("/bin/program",pArgs,forChild.toPointerArray().get());
  std::unique_ptr<char*, void (*)(char**)> toPointerArray() const;

 private:
  EnvironmentState() {}
  EnvType env_;
};

struct FOLLY_EXPORT MalformedEnvironment : std::runtime_error {
  using std::runtime_error::runtime_error;
};
} // namespace experimental

namespace test {
// RAII class allowing scoped changes to the process environment. The
// environment state at the time of its construction is restored at the time
// of its destruction.
struct EnvVarSaver {
  EnvVarSaver()
      : state_(std::make_unique<experimental::EnvironmentState>(
            experimental::EnvironmentState::fromCurrentEnvironment())) {}

  EnvVarSaver(EnvVarSaver&& other) noexcept : state_(std::move(other.state_)) {}

  EnvVarSaver& operator=(EnvVarSaver&& other) noexcept {
    state_ = std::move(other.state_);
    return *this;
  }

  ~EnvVarSaver() {
    if (state_) {
      state_->setAsCurrentEnvironment();
    }
  }

 private:
  std::unique_ptr<experimental::EnvironmentState> state_;
};
} // namespace test
} // namespace folly
