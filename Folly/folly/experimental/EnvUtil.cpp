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

#include <folly/experimental/EnvUtil.h>

#include <folly/String.h>
#include <folly/portability/Stdlib.h>
#include <folly/portability/Unistd.h>

namespace folly {
namespace test {

static std::map<std::string, std::string> getEnvVarMap() {
  std::map<std::string, std::string> data;
  for (auto it = environ; *it != nullptr; ++it) {
    std::string key, value;
    split("=", *it, key, value);
    if (key.empty()) {
      continue;
    }
    CHECK(!data.count(key)) << "already contains: " << key;
    data.emplace(move(key), move(value));
  }
  return data;
}

EnvVarSaver::EnvVarSaver() {
  saved_ = getEnvVarMap();
}

EnvVarSaver::~EnvVarSaver() {
  for (const auto& kvp : getEnvVarMap()) {
    if (saved_.count(kvp.first)) {
      continue;
    }
    PCHECK(0 == unsetenv(kvp.first.c_str()));
  }
  for (const auto& kvp : saved_) {
    PCHECK(0 == setenv(kvp.first.c_str(), kvp.second.c_str(), (int)true));
  }
}
}
}
