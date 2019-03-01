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

#include <folly/experimental/symbolizer/Elf.h>
#include <folly/portability/GTest.h>

using folly::symbolizer::ElfFile;

// Add some symbols for testing. Note that we have to be careful with type
// signatures here to prevent name mangling
uint64_t kIntegerValue = 1234567890UL;
const char* kStringValue = "coconuts";

class ElfTest : public ::testing::Test {
 public:
  // Path to the test binary itself; set by main()
  static std::string binaryPath;

  ElfTest() : elfFile_(binaryPath.c_str()) {
  }
  ~ElfTest() override {}

 protected:
  ElfFile elfFile_;
};

std::string ElfTest::binaryPath;

TEST_F(ElfTest, IntegerValue) {
  auto sym = elfFile_.getSymbolByName("kIntegerValue");
  EXPECT_NE(nullptr, sym.first) <<
    "Failed to look up symbol kIntegerValue";
  EXPECT_EQ(kIntegerValue, elfFile_.getSymbolValue<uint64_t>(sym.second));
}

TEST_F(ElfTest, PointerValue) {
  auto sym = elfFile_.getSymbolByName("kStringValue");
  EXPECT_NE(nullptr, sym.first) <<
    "Failed to look up symbol kStringValue";
  ElfW(Addr) addr = elfFile_.getSymbolValue<ElfW(Addr)>(sym.second);
  const char *str = &elfFile_.getAddressValue<const char>(addr);
  EXPECT_STREQ(kStringValue, str);
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  ElfTest::binaryPath = argv[0];
  return RUN_ALL_TESTS();
}
