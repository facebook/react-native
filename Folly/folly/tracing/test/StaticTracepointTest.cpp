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

#include <algorithm>
#include <array>
#include <iterator>
#include <sstream>
#include <string>
#include <vector>

#include <boost/filesystem.hpp>
#include <folly/Conv.h>
#include <folly/Format.h>
#include <folly/Random.h>
#include <folly/String.h>
#include <folly/Subprocess.h>
#include <folly/lang/Bits.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>
#include <folly/tracing/StaticTracepoint.h>
#include <folly/tracing/test/StaticTracepointTestModule.h>

static const std::string kUSDTSubsectionName = FOLLY_SDT_NOTE_NAME;
static const int kUSDTNoteType = FOLLY_SDT_NOTE_TYPE;
static const size_t kAddrWidth = sizeof(void*);

static uint8_t hexToInt(const std::string& hex) {
  std::stringstream converter(hex);
  int value;
  converter >> std::hex >> value;
  return uint8_t(value);
}

static int get4BytesValue(const std::vector<uint8_t>& v, size_t& pos) {
  pos += 4;
  return folly::Endian::little(folly::loadUnaligned<int>(v.data() + pos - 4));
}

static void align4Bytes(size_t& pos) {
  if (pos % 4 != 0) {
    pos += 4 - pos % 4;
  }
}

static int getNextZero(
    const std::vector<uint8_t>& v,
    const size_t curPos,
    const size_t limit) {
  auto pos = std::find(v.begin() + curPos, v.begin() + limit, 0);
  if (pos == v.begin() + limit) {
    return -1;
  }
  return std::distance(v.begin(), pos);
}

static intptr_t getAddr(const std::vector<uint8_t>& v, size_t& pos) {
  pos += kAddrWidth;
  return folly::Endian::little(
      folly::loadUnaligned<intptr_t>(v.data() + pos - kAddrWidth));
}

static std::string
getStr(const std::vector<uint8_t>& v, size_t& pos, const size_t len) {
  CHECK_GE(len, 1);
  std::string res;
  res.resize(len - 1);
  for (size_t i = 0; i < len - 1; i++) {
    CHECK_NE(v[pos + i], 0);
    res[i] = char(v[pos + i]);
  }
  CHECK_EQ(0, v[pos + len - 1]);
  pos += len;
  return res;
}

static std::string getExe() {
  auto path = folly::sformat("/proc/{}/exe", getpid());
  return boost::filesystem::read_symlink(path).string();
}

static std::string getNoteRawContent(const std::string& fileName) {
  auto subProc = folly::Subprocess(
      std::vector<std::string>{
          "objdump",
          "--full-content",
          "--section=.note." + kUSDTSubsectionName,
          fileName,
      },
      folly::Subprocess::Options().pipeStdout().usePath());
  auto output = subProc.communicate();
  auto retCode = subProc.wait();
  CHECK(retCode.exited());
  CHECK(output.second.empty());
  return output.first;
}

static std::vector<uint8_t> readNote(const std::string& fileName) {
  std::vector<uint8_t> res;
  std::string rawContent = getNoteRawContent(fileName);
  CHECK(!rawContent.empty());
  // Strip out the part of output containing raw content, and split by line.
  std::string contentStart =
      "Contents of section .note." + kUSDTSubsectionName + ":";
  auto pos = rawContent.find(contentStart);
  CHECK_NE(pos, std::string::npos);
  pos = rawContent.find("\n", pos + 1);
  CHECK_NE(pos, std::string::npos);
  rawContent = rawContent.substr(pos + 1);
  std::vector<std::string> lines;
  folly::split('\n', rawContent, lines, true);
  CHECK_GT(lines.size(), 0);
  // Parse each line.
  for (auto line : lines) {
    // Empty segments or ASCIIified content after two spaces.
    auto endPos = line.find("  ");
    CHECK_NE(endPos, std::string::npos);
    line = line.substr(0, endPos);
    std::vector<std::string> segments;
    folly::split(' ', line, segments, true);
    CHECK_GE(segments.size(), 2);
    // First segment is address offset.
    for (size_t i = 1; i < segments.size(); i++) {
      CHECK_EQ(8, segments[i].size());
      for (size_t j = 0; j < 8; j += 2) {
        std::string hex = segments[i].substr(j, 2);
        res.push_back(hexToInt(hex));
      }
    }
  }
  CHECK_EQ(0, res.size() % 4);
  return res;
}

template <std::size_t SIZE>
static void checkTracepointArguments(
    const std::string& arguments,
    std::array<int, SIZE>& expectedSize) {
  std::vector<std::string> args;
  folly::split(' ', arguments, args);
  EXPECT_EQ(expectedSize.size(), args.size());
  for (size_t i = 0; i < args.size(); i++) {
    EXPECT_FALSE(args[i].empty());
    auto pos = args[i].find("@");
    EXPECT_NE(pos, std::string::npos);
    EXPECT_LT(pos, args[i].size() - 1);
    std::string argSize = args[i].substr(0, pos);
    EXPECT_EQ(expectedSize[i], abs(folly::to<int>(argSize)));
  }
}

/**
 * This helper reads the .note.stapsdt section of the currently running binary,
 * checks if the tracepoints listed there are properly formatted, and return the
 * arguments layout description string for the expected provider and probe
 * combination if it exists.
 */
static bool getTracepointArguments(
    const std::string& expectedProvider,
    const std::string& expectedProbe,
    const uintptr_t expectedSemaphore,
    std::string& arguments) {
  // Read the note and check if it's non-empty.
  std::string exe = getExe();
  auto note = readNote(exe);
  auto len = note.size();
  CHECK_GT(len, 0);
  // The loop to read tracepoints one by one.
  size_t pos = 0;
  while (pos < len) {
    // Check size information of the tracepoint.
    CHECK_LE(pos + 12, len);

    int headerSize = get4BytesValue(note, pos);
    CHECK_EQ(kUSDTSubsectionName.size() + 1, headerSize);

    int contentSize = get4BytesValue(note, pos);
    size_t remaining = contentSize;
    CHECK_GE(contentSize, kAddrWidth * 3);

    int noteType = get4BytesValue(note, pos);
    CHECK_EQ(kUSDTNoteType, noteType);

    CHECK_LE(pos + headerSize + contentSize, len);

    // Check header of the tracepoint.
    std::string header = getStr(note, pos, headerSize);
    CHECK_EQ(kUSDTSubsectionName, header);
    align4Bytes(pos);

    // Check address information of the tracepoint
    intptr_t probeAddr = getAddr(note, pos);
    CHECK_GT(probeAddr, 0);
    remaining -= kAddrWidth;

    intptr_t baseAddr = getAddr(note, pos);
    CHECK_EQ(0, baseAddr);
    remaining -= kAddrWidth;

    intptr_t semaphoreAddr = getAddr(note, pos);
    remaining -= kAddrWidth;

    // Read tracepoint provider, probe and argument layout description.
    int providerEnd = getNextZero(note, pos, pos + remaining - 1);
    CHECK_GE(providerEnd, 0);
    size_t providerLen = providerEnd - pos + 1;
    std::string provider = getStr(note, pos, providerLen);
    remaining -= providerLen;

    int probeEnd = getNextZero(note, pos, pos + remaining - 1);
    CHECK_GE(probeEnd, 0);
    size_t probeLen = probeEnd - pos + 1;
    std::string probe = getStr(note, pos, probeLen);
    remaining -= probeLen;

    arguments = getStr(note, pos, remaining);
    align4Bytes(pos);

    if (provider == expectedProvider && probe == expectedProbe) {
      CHECK_EQ(expectedSemaphore, semaphoreAddr);
      return true;
    }
  }
  return false;
}

static uint32_t arrayTestFunc() {
  uint32_t v1 = folly::Random::rand32();
  uint32_t v2 = folly::Random::rand32();
  uint64_t v3 = v1 + v2;
  uint32_t a[4] = {v1, v2, v1, v2};
  FOLLY_SDT(folly, test_static_tracepoint_array, a, v1, v3);
  return v1 + v2;
}

TEST(StaticTracepoint, TestArray) {
  arrayTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_array", 0, arguments));
  std::array<int, 3> expected{{sizeof(void*), sizeof(int), sizeof(int64_t)}};
  checkTracepointArguments(arguments, expected);
}

static uint32_t pointerTestFunc() {
  uint32_t v1 = folly::Random::rand32();
  uint32_t v2 = folly::Random::rand32();
  std::string str = "test string";
  const char* a = str.c_str();
  FOLLY_SDT(folly, test_static_tracepoint_pointer, a, v2, &v1);
  return v1 + v2;
}

TEST(StaticTracepoint, TestPointer) {
  pointerTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_array", 0, arguments));
  std::array<int, 3> expected{{sizeof(void*), sizeof(int), sizeof(void*)}};
  checkTracepointArguments(arguments, expected);
}

static void emptyTestFunc() {
  FOLLY_SDT(folly, test_static_tracepoint_empty);
}

TEST(StaticTracepoint, TestEmpty) {
  emptyTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_empty", 0, arguments));
  EXPECT_TRUE(arguments.empty());
}

FOLLY_SDT_DEFINE_SEMAPHORE(folly, test_semaphore_local)

static uint32_t manyArgTypesTestFunc() {
  uint32_t a = folly::Random::rand32();
  uint32_t b = folly::Random::rand32();
  bool bool_ = (a % 2) == (b % 2);
  char char_ = a & 255;
  short short_ = b & 32767;
  long long_ = a;
  float float_ = float(a) / float(b);
  double double_ = double(a) / double(b);
  FOLLY_SDT(
      folly,
      test_static_tracepoint_many_arg_types,
      a,
      b,
      bool_,
      char_,
      short_,
      long_,
      float_,
      double_);
  FOLLY_SDT_WITH_SEMAPHORE(folly, test_semaphore_local, long_, short_);
  return a + b;
}

TEST(StaticTracepoint, TestManyArgTypes) {
  manyArgTypesTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_many_arg_types", 0, arguments));
  std::array<int, 8> expected{{
      sizeof(uint32_t),
      sizeof(uint32_t),
      sizeof(bool),
      sizeof(char),
      sizeof(short),
      sizeof(long),
      sizeof(float),
      sizeof(double),
  }};
  checkTracepointArguments(arguments, expected);
}

FOLLY_ALWAYS_INLINE static uint32_t alwaysInlineTestFunc() {
  uint32_t a = folly::Random::rand32();
  uint32_t b = folly::Random::rand32();
  FOLLY_SDT(folly, test_static_tracepoint_always_inline, a, b);
  return a + b;
}

TEST(StaticTracepoint, TestAlwaysInline) {
  alwaysInlineTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_always_inline", 0, arguments));
  std::array<int, 2> expected{{sizeof(uint32_t), sizeof(uint32_t)}};
  checkTracepointArguments(arguments, expected);
}

static void branchTestFunc() {
  uint32_t a = folly::Random::rand32();
  uint32_t b = std::max(1u, folly::Random::rand32());
  if (a > b) {
    FOLLY_SDT(folly, test_static_tracepoint_branch_1, a / b);
  } else {
    FOLLY_SDT(folly, test_static_tracepoint_branch_2, double(a) / double(b));
  }
}

TEST(StaticTracepoint, TestBranch) {
  branchTestFunc();

  std::string arguments1;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_branch_1", 0, arguments1));
  std::array<int, 1> expected1{{sizeof(uint32_t)}};
  checkTracepointArguments(arguments1, expected1);

  std::string arguments2;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_branch_2", 0, arguments2));
  std::array<int, 1> expected2{{sizeof(double)}};
  checkTracepointArguments(arguments2, expected2);
}

struct testStruct {
  int a;
  int64_t b;
  char c[32];
};

static void structTestFunc() {
  testStruct s, t;
  s.a = folly::Random::rand32();
  s.b = folly::Random::rand32();
  t.a = folly::Random::rand32();
  t.b = folly::Random::rand32();
  FOLLY_SDT(folly, test_static_tracepoint_struct, s, t);
}

TEST(StaticTracepoint, TestStruct) {
  structTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly", "test_static_tracepoint_struct", 0, arguments));
  std::array<int, 2> expected{{sizeof(testStruct), sizeof(testStruct)}};
  checkTracepointArguments(arguments, expected);
}

TEST(StaticTracepoint, TestSemaphoreLocal) {
  manyArgTypesTestFunc();

  std::string arguments;
  ASSERT_TRUE(getTracepointArguments(
      "folly",
      "test_semaphore_local",
      (uintptr_t)((void*)&FOLLY_SDT_SEMAPHORE(folly, test_semaphore_local)),
      arguments));
  std::array<int, 2> expected{{sizeof(long), sizeof(short)}};
  checkTracepointArguments(arguments, expected);
  EXPECT_FALSE(FOLLY_SDT_IS_ENABLED(folly, test_semaphore_local));
}

FOLLY_SDT_DECLARE_SEMAPHORE(folly, test_semaphore_extern);

TEST(StaticTracepoint, TestSemaphoreExtern) {
  unsigned v = folly::Random::rand32();
  CHECK_EQ(v * v, folly::test::staticTracepointTestFunc(v));
  EXPECT_FALSE(FOLLY_SDT_IS_ENABLED(folly, test_semaphore_extern));
}
