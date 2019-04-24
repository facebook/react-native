/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/experimental/bser/Bser.h>

#include <folly/String.h>
#include <folly/portability/GTest.h>

using folly::dynamic;

static const dynamic roundtrips[] = {
    1,
    std::numeric_limits<int8_t>::max(),
    std::numeric_limits<int16_t>::max(),
    std::numeric_limits<int32_t>::max(),
    std::numeric_limits<int64_t>::max(),
    std::numeric_limits<int8_t>::min(),
    std::numeric_limits<int16_t>::min(),
    std::numeric_limits<int32_t>::min(),
    std::numeric_limits<int64_t>::min(),
    bool(true),
    bool(false),
    nullptr,
    1.5,
    "hello",
    folly::dynamic::array(1, 2, 3),
    dynamic::object("key", "value")("otherkey", "otherval"),
};

// Here's a blob from the watchman test suite
const uint8_t template_blob[] =
    "\x00\x01\x03\x28"
    "\x0b\x00\x03\x02\x02\x03\x04\x6e\x61\x6d\x65\x02"
    "\x03\x03\x61\x67\x65\x03\x03\x02\x03\x04\x66\x72"
    "\x65\x64\x03\x14\x02\x03\x04\x70\x65\x74\x65\x03"
    "\x1e\x0c\x03\x19";

// and here's what it represents
static const dynamic template_dynamic = folly::dynamic::array(
    dynamic::object("name", "fred")("age", 20),
    dynamic::object("name", "pete")("age", 30),
    dynamic::object("name", nullptr)("age", 25));

TEST(Bser, RoundTrip) {
  dynamic decoded(nullptr);
  folly::fbstring str;

  for (const auto& dyn : roundtrips) {
    try {
      str = folly::bser::toBser(dyn, folly::bser::serialization_opts());
      decoded = folly::bser::parseBser(str);

      EXPECT_EQ(decoded, dyn);
    } catch (const std::exception& err) {
      LOG(ERROR) << err.what() << "\nInput: " << dyn.typeName() << ": " << dyn
                 << " decoded back as " << decoded.typeName() << ": " << decoded
                 << "\n"
                 << folly::hexDump(str.data(), str.size());
      throw;
    }
  }
}

TEST(Bser, Template) {
  dynamic decoded(nullptr);
  folly::fbstring str;
  // Decode the template value provided from elsewhere
  decoded = folly::bser::parseBser(
      folly::ByteRange(template_blob, sizeof(template_blob) - 1));
  EXPECT_EQ(decoded, template_dynamic)
      << "Didn't load template value.\n"
      << "Input: " << template_dynamic.typeName() << ": " << template_dynamic
      << " decoded back as " << decoded.typeName() << ": " << decoded << "\n"
      << folly::hexDump(template_blob, sizeof(template_blob) - 1);

  // Now check that we can generate this same data representation
  folly::bser::serialization_opts opts;
  folly::bser::serialization_opts::TemplateMap templates = {std::make_pair(
      &decoded, folly::dynamic(folly::dynamic::array("name", "age")))};
  opts.templates = templates;

  str = folly::bser::toBser(decoded, opts);
  EXPECT_EQ(
      folly::ByteRange((const uint8_t*)str.data(), str.size()),
      folly::ByteRange(template_blob, sizeof(template_blob) - 1))
      << "Expected:\n"
      << folly::hexDump(template_blob, sizeof(template_blob) - 1) << "\nGot:\n"
      << folly::hexDump(str.data(), str.size());
}

TEST(Bser, PduLength) {
  EXPECT_THROW(
      [] {
        // Try to decode PDU for a short buffer that doesn't even have the
        // complete length available
        auto buf = folly::IOBuf::wrapBuffer(template_blob, 3);
        auto len = folly::bser::decodePduLength(&*buf);
        (void)len;
        LOG(ERROR) << "managed to return a length, but only had 3 bytes";
      }(),
      std::out_of_range);

  auto buf = folly::IOBuf::wrapBuffer(template_blob, sizeof(template_blob));
  auto len = folly::bser::decodePduLength(&*buf);
  EXPECT_EQ(len, 44) << "PduLength should be 44, got " << len;
}

TEST(Bser, CursorLength) {
  folly::bser::serialization_opts opts;
  std::string inputStr("hello there please break");

  // This test is exercising the decode logic for pathological
  // fragmentation cases.  We try a few permutations with the
  // BSER header being fragmented to tickle boundary conditions

  auto longSerialized = folly::bser::toBser(inputStr, opts);
  for (uint32_t i = 1; i < longSerialized.size(); ++i) {
    folly::IOBufQueue q;

    q.append(folly::IOBuf::wrapBuffer(longSerialized.data(), i));
    uint32_t j = i;
    while (j < longSerialized.size()) {
      q.append(folly::IOBuf::wrapBuffer(&longSerialized[j], 1));
      ++j;
    }

    auto pdu_len = folly::bser::decodePduLength(q.front());
    auto buf = q.split(pdu_len);

    auto hello = folly::bser::parseBser(buf.get());
    EXPECT_EQ(inputStr, hello.asString());
  }
}

/* vim:ts=2:sw=2:et:
 */
