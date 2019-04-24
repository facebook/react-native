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
#include <folly/logging/LogName.h>

namespace {
constexpr bool isSeparator(char c) {
  return c == '.' || c == '/' || c == '\\';
}
} // namespace

namespace folly {

std::string LogName::canonicalize(StringPiece input) {
  std::string cname;
  cname.reserve(input.size());

  // Ignore trailing category separator characters
  size_t end = input.size();
  while (end > 0 && isSeparator(input[end - 1])) {
    --end;
  }

  bool ignoreSeparator = true;
  for (size_t idx = 0; idx < end; ++idx) {
    if (isSeparator(input[idx])) {
      if (ignoreSeparator) {
        continue;
      }
      cname.push_back('.');
      ignoreSeparator = true;
    } else {
      cname.push_back(input[idx]);
      ignoreSeparator = false;
    }
  }
  return cname;
}

size_t LogName::hash(StringPiece name) {
  // Code based on StringPiece::hash(), but which ignores leading and trailing
  // category separator characters, as well as multiple consecutive separator
  // characters, so equivalent names result in the same hash.
  uint32_t hash = 5381;

  size_t end = name.size();
  while (end > 0 && isSeparator(name[end - 1])) {
    --end;
  }

  bool ignoreSeparator = true;
  for (size_t idx = 0; idx < end; ++idx) {
    uint8_t value;
    if (isSeparator(name[idx])) {
      if (ignoreSeparator) {
        continue;
      }
      value = '.';
      ignoreSeparator = true;
    } else {
      value = static_cast<uint8_t>(name[idx]);
      ignoreSeparator = false;
    }
    hash = ((hash << 5) + hash) + value;
  }
  return hash;
}

int LogName::cmp(StringPiece a, StringPiece b) {
  // Ignore trailing separators
  auto stripTrailingSeparators = [](StringPiece& s) {
    while (!s.empty() && isSeparator(s.back())) {
      s.uncheckedSubtract(1);
    }
  };
  stripTrailingSeparators(a);
  stripTrailingSeparators(b);

  // Advance ptr until it no longer points to a category separator.
  // This is used to skip over consecutive sequences of separator characters.
  auto skipOverSeparators = [](StringPiece& s) {
    while (!s.empty() && isSeparator(s.front())) {
      s.uncheckedAdvance(1);
    }
  };

  bool ignoreSeparator = true;
  while (true) {
    if (ignoreSeparator) {
      skipOverSeparators(a);
      skipOverSeparators(b);
    }
    if (a.empty()) {
      return b.empty() ? 0 : -1;
    } else if (b.empty()) {
      return 1;
    }
    if (isSeparator(a.front())) {
      if (!isSeparator(b.front())) {
        return '.' - b.front();
      }
      ignoreSeparator = true;
    } else {
      if (a.front() != b.front()) {
        return a.front() - b.front();
      }
      ignoreSeparator = false;
    }
    a.uncheckedAdvance(1);
    b.uncheckedAdvance(1);
  }
}

StringPiece LogName::getParent(StringPiece name) {
  if (name.empty()) {
    return name;
  }

  ssize_t idx = name.size();

  // Skip over any trailing separator characters
  while (idx > 0 && isSeparator(name[idx - 1])) {
    --idx;
  }

  // Now walk backwards to the next separator character
  while (idx > 0 && !isSeparator(name[idx - 1])) {
    --idx;
  }

  // And again skip over any separator characters, in case there are multiple
  // repeated characters.
  while (idx > 0 && isSeparator(name[idx - 1])) {
    --idx;
  }

  return StringPiece(name.begin(), idx);
}
} // namespace folly
