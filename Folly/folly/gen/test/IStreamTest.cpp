/*
 * Copyright 2014-present Facebook, Inc.
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
#include <folly/gen/IStream.h>

#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include <folly/gen/Base.h>
#include <folly/gen/String.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace gen {

// Test mixed consumption of std::istream with and without folly::gen, and
// demonstrates partial consumption of input.
TEST(IStream, ByLine) {
  std::stringstream in(
      "2\n" // Count applies to both below groups.
      "1\tred\n"
      "3\tblue\n"
      "3.4\t5.6\t7.8\n"
      "1.1\t2.2\t3.3\n");
  size_t n;
  in >> n;
  in.get(); // Consume trailing newline
  auto colors = byLine(in) | take(n) | eachToPair<int, std::string>('\t') |
      as<std::vector>();
  auto coords = byLine(in) | take(n) | eachToTuple<float, float, float>('\t') |
      as<std::vector>();
  EXPECT_EQ(
      colors,
      (std::vector<std::pair<int, std::string>>{
          {1, "red"},
          {3, "blue"},
      }));
  EXPECT_EQ(
      coords,
      (std::vector<std::tuple<float, float, float>>({
          std::tuple<float, float, float>{3.4f, 5.6f, 7.8f},
          std::tuple<float, float, float>{1.1f, 2.2f, 3.3f},
      })));
}

} // namespace gen
} // namespace folly
