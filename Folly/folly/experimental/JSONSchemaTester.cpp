/*
 * Copyright 2015-present Facebook, Inc.
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
#include <folly/experimental/JSONSchema.h>
#include <folly/json.h>
#include <fstream>
#include <sstream>
#include <string>

/**
 * A binary that supports testing against the official tests from:
 * https://github.com/json-schema/JSON-Schema-Test-Suite
 *
 * Use it like:
 *   ./jsonschema_tester /path/to/test.json
 */

int main(int argc, char** argv) {
  if (argc < 2) {
    printf("Usage: %s <testfile> [testfile2]...\n", argv[0]);
    return -1;
  }
  for (int i = 1; i < argc; ++i) {
    printf("FILE: %s\n", argv[i]);
    std::ifstream fin(argv[i]);
    std::stringstream buffer;
    buffer << fin.rdbuf();
    const folly::dynamic d = folly::parseJson(buffer.str());
    for (const auto& item : d) {
      printf("TEST: %s\n", item["description"].c_str());
      auto v = folly::jsonschema::makeValidator(item["schema"]);
      for (const auto& t : item["tests"]) {
        printf("\t%s... ", t["description"].c_str());
        auto ew = v->try_validate(t["data"]);
        bool had_error = !static_cast<bool>(ew);
        if (had_error == t["valid"].asBool()) {
          printf("passed\n");
        } else {
          printf("FAILED\n");
        }
      }
    }
  }
}
