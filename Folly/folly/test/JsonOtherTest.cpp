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

#include <folly/json.h>

#include <folly/Benchmark.h>
#include <folly/FileUtil.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

using folly::dynamic;
using folly::parseJson;
using folly::toJson;

TEST(Json, StripComments) {
  const std::string kTestDir = "folly/test/";
  const std::string kTestFile = "json_test_data/commented.json";
  const std::string kTestExpected = "json_test_data/commented.json.exp";

  std::string testStr;
  std::string expectedStr;
  if (!folly::readFile(kTestFile.data(), testStr) &&
      !folly::readFile((kTestDir + kTestFile).data(), testStr)) {
    FAIL() << "can not read test file " << kTestFile;
  }
  if (!folly::readFile(kTestExpected.data(), expectedStr) &&
      !folly::readFile((kTestDir + kTestExpected).data(), expectedStr)) {
    FAIL() << "can not read test file " << kTestExpected;
  }
  EXPECT_EQ(expectedStr, folly::json::stripComments(testStr));
}

BENCHMARK(jsonSerialize, iters) {
  folly::json::serialization_opts opts;
  for (size_t i = 0; i < iters; ++i) {
    folly::json::serialize(
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy",
      opts);
  }
}

BENCHMARK(jsonSerializeWithNonAsciiEncoding, iters) {
  folly::json::serialization_opts opts;
  opts.encode_non_ascii = true;

  for (size_t i = 0; i < iters; ++i) {
    folly::json::serialize(
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy",
      opts);
  }
}

BENCHMARK(jsonSerializeWithUtf8Validation, iters) {
  folly::json::serialization_opts opts;
  opts.validate_utf8 = true;

  for (size_t i = 0; i < iters; ++i) {
    folly::json::serialize(
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy"
      "qwerty \xc2\x80 \xef\xbf\xbf poiuy",
      opts);
  }
}

BENCHMARK(parseSmallStringWithUtf, iters) {
  for (size_t i = 0; i < iters << 4; ++i) {
    parseJson("\"I \\u2665 UTF-8 thjasdhkjh blah blah blah\"");
  }
}

BENCHMARK(parseNormalString, iters) {
  for (size_t i = 0; i < iters << 4; ++i) {
    parseJson("\"akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk\"");
  }
}

BENCHMARK(parseBigString, iters) {
  for (size_t i = 0; i < iters; ++i) {
    parseJson("\""
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "akjhfk jhkjlakjhfk jhkjlakjhfk jhkjl akjhfk"
      "\"");
  }
}

BENCHMARK(toJson, iters) {
  dynamic something = parseJson(
    "{\"old_value\":40,\"changed\":true,\"opened\":false,\"foo\":[1,2,3,4,5,6]}"
  );

  for (size_t i = 0; i < iters; i++) {
    toJson(something);
  }
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  if (FLAGS_benchmark) {
    folly::runBenchmarks();
  }
  return RUN_ALL_TESTS();
}
