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

#include <folly/experimental/EnvUtil.h>

#include <folly/String.h>
#include <folly/portability/Stdlib.h>
#include <folly/portability/Unistd.h>

using namespace folly;
using namespace folly::experimental;

EnvironmentState EnvironmentState::fromCurrentEnvironment() {
  std::unordered_map<std::string, std::string> data;
  for (auto it = environ; it && *it; ++it) {
    std::string key, value;
    folly::StringPiece entry(*it);
    auto equalsPosition = entry.find('=');
    if (equalsPosition == entry.npos) {
      throw MalformedEnvironment{to<std::string>(
          "Environment contains an non key-value-pair string \"", entry, "\"")};
    }
    key = entry.subpiece(0, equalsPosition).toString();
    value = entry.subpiece(equalsPosition + 1).toString();
    if (data.count(key)) {
      throw MalformedEnvironment{to<std::string>(
          "Environment contains duplicate value for \"", key, "\"")};
    }
    data.emplace(std::move(key), std::move(value));
  }
  return EnvironmentState{std::move(data)};
}

void EnvironmentState::setAsCurrentEnvironment() {
  PCHECK(0 == clearenv());
  for (const auto& kvp : env_) {
    PCHECK(0 == setenv(kvp.first.c_str(), kvp.second.c_str(), (int)true));
  }
}

std::vector<std::string> EnvironmentState::toVector() const {
  std::vector<std::string> result;
  for (auto const& pair : env_) {
    result.emplace_back(to<std::string>(pair.first, "=", pair.second));
  }
  return result;
}

std::unique_ptr<char*, void (*)(char**)> EnvironmentState::toPointerArray()
    const {
  size_t totalStringLength{};
  for (auto const& pair : env_) {
    totalStringLength += pair.first.size() + pair.second.size() +
        2 /* intermediate '=' and the terminating NUL */;
  }
  size_t allocationRequired =
      (totalStringLength / sizeof(char*) + 1) + env_.size() + 1;
  char** raw = new char*[allocationRequired];
  char** ptrBase = raw;
  char* stringBase = reinterpret_cast<char*>(&raw[env_.size() + 1]);
  char* const stringEnd = reinterpret_cast<char*>(&raw[allocationRequired]);
  for (auto const& pair : env_) {
    std::string const& key = pair.first;
    std::string const& value = pair.second;
    *ptrBase = stringBase;
    size_t lengthIncludingNullTerminator = key.size() + 1 + value.size() + 1;
    CHECK_GT(stringEnd - lengthIncludingNullTerminator, stringBase);
    memcpy(stringBase, key.c_str(), key.size());
    stringBase += key.size();
    *stringBase++ = '=';
    memcpy(stringBase, value.c_str(), value.size() + 1);
    stringBase += value.size() + 1;
    ++ptrBase;
  }
  *ptrBase = nullptr;
  CHECK_EQ(env_.size(), ptrBase - raw);
  return {raw, [](char** ptr) { delete[] ptr; }};
}
