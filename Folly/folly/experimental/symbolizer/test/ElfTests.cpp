/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/FileUtil.h>
#include <folly/experimental/TestUtil.h>
#include <folly/experimental/symbolizer/Elf.h>
#include <folly/portability/GTest.h>

using folly::symbolizer::ElfFile;

// Add some symbols for testing. Note that we have to be careful with type
// signatures here to prevent name mangling
uint64_t kIntegerValue = 1234567890UL;
const char* kStringValue = "coconuts";

class ElfTest : public ::testing::Test {
 protected:
  ElfFile elfFile_{"/proc/self/exe"};
};

TEST_F(ElfTest, IntegerValue) {
  auto sym = elfFile_.getSymbolByName("kIntegerValue");
  EXPECT_NE(nullptr, sym.first) << "Failed to look up symbol kIntegerValue";
  EXPECT_EQ(kIntegerValue, elfFile_.getSymbolValue<uint64_t>(sym.second));
}

TEST_F(ElfTest, PointerValue) {
  auto sym = elfFile_.getSymbolByName("kStringValue");
  EXPECT_NE(nullptr, sym.first) << "Failed to look up symbol kStringValue";
  ElfW(Addr) addr = elfFile_.getSymbolValue<ElfW(Addr)>(sym.second);
  const char* str = &elfFile_.getAddressValue<const char>(addr);
  EXPECT_STREQ(kStringValue, str);
}

TEST_F(ElfTest, iterateProgramHeaders) {
  auto phdr = elfFile_.iterateProgramHeaders(
      [](auto& h) { return h.p_type == PT_LOAD; });
  EXPECT_NE(nullptr, phdr);
  EXPECT_GE(phdr->p_filesz, 0);
}

TEST_F(ElfTest, TinyNonElfFile) {
  folly::test::TemporaryFile tmpFile;
  const static folly::StringPiece contents = "!";
  folly::writeFull(tmpFile.fd(), contents.data(), contents.size());

  ElfFile elfFile;
  const char* msg = nullptr;
  auto res = elfFile.openNoThrow(tmpFile.path().c_str(), true, &msg);
  EXPECT_EQ(ElfFile::kInvalidElfFile, res);
  EXPECT_STREQ("not an ELF file (too short)", msg);
}

TEST_F(ElfTest, NonElfScript) {
  folly::test::TemporaryFile tmpFile;
  const static folly::StringPiece contents =
      "#!/bin/sh\necho I'm small non-ELF executable\n";
  folly::writeFull(tmpFile.fd(), contents.data(), contents.size());

  ElfFile elfFile;
  const char* msg = nullptr;
  auto res = elfFile.openNoThrow(tmpFile.path().c_str(), true, &msg);
  EXPECT_EQ(ElfFile::kInvalidElfFile, res);
  EXPECT_STREQ("invalid ELF magic", msg);
}
