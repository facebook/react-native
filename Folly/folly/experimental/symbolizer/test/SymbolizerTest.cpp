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

#include <folly/experimental/symbolizer/Symbolizer.h>

#include <cstdlib>

#include <folly/Range.h>
#include <folly/String.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace symbolizer {
namespace test {

void foo() {}

TEST(Symbolizer, Single) {
  Symbolizer symbolizer;
  SymbolizedFrame a;
  ASSERT_TRUE(symbolizer.symbolize(reinterpret_cast<uintptr_t>(foo), a));
  EXPECT_EQ("folly::symbolizer::test::foo()", a.demangledName());

  // The version of clang we use doesn't generate a `.debug_aranges` section,
  // which the symbolizer needs to lookup the filename.
  constexpr bool built_with_clang =
#ifdef __clang__
      true;
#else
      false;
#endif
  if (!built_with_clang) {
    auto path = a.location.file.toString();
    folly::StringPiece basename(path);
    auto pos = basename.rfind('/');
    if (pos != folly::StringPiece::npos) {
      basename.advance(pos + 1);
    }
    EXPECT_EQ("SymbolizerTest.cpp", basename.str());
  }
}

FrameArray<100>* framesToFill{nullptr};

int comparator(const void* ap, const void* bp) {
  getStackTrace(*framesToFill);

  int a = *static_cast<const int*>(ap);
  int b = *static_cast<const int*>(bp);
  return a < b ? -1 : a > b ? 1 : 0;
}

// Test stack frames...
FOLLY_NOINLINE void bar();

void bar(FrameArray<100>& frames) {
  framesToFill = &frames;
  int a[2] = {1, 2};
  // Use qsort, which is in a different library
  qsort(a, 2, sizeof(int), comparator);
  framesToFill = nullptr;
}

class ElfCacheTest : public testing::Test {
 protected:
  void SetUp() override;
};

// Capture "golden" stack trace with default-configured Symbolizer
FrameArray<100> goldenFrames;

void ElfCacheTest::SetUp() {
  bar(goldenFrames);
  Symbolizer symbolizer;
  symbolizer.symbolize(goldenFrames);
  // At least 3 stack frames from us + getStackTrace()
  ASSERT_LE(4, goldenFrames.frameCount);
}

void runElfCacheTest(Symbolizer& symbolizer) {
  FrameArray<100> frames = goldenFrames;
  for (size_t i = 0; i < frames.frameCount; ++i) {
    frames.frames[i].clear();
  }
  symbolizer.symbolize(frames);
  ASSERT_LE(4, frames.frameCount);
  for (size_t i = 1; i < 4; ++i) {
    EXPECT_STREQ(goldenFrames.frames[i].name, frames.frames[i].name);
  }
}

TEST_F(ElfCacheTest, TinyElfCache) {
  ElfCache cache(1);
  Symbolizer symbolizer(&cache);
  // Run twice, in case the wrong stuff gets evicted?
  for (size_t i = 0; i < 2; ++i) {
    runElfCacheTest(symbolizer);
  }
}

TEST_F(ElfCacheTest, SignalSafeElfCache) {
  SignalSafeElfCache cache(100);
  Symbolizer symbolizer(&cache);
  for (size_t i = 0; i < 2; ++i) {
    runElfCacheTest(symbolizer);
  }
}

TEST(SymbolizerTest, SymbolCache) {
  Symbolizer symbolizer(nullptr, Dwarf::LocationInfoMode::FULL, 100);

  FrameArray<100> frames;
  bar(frames);
  symbolizer.symbolize(frames);

  FrameArray<100> frames2;
  bar(frames2);
  symbolizer.symbolize(frames2);
  for (size_t i = 0; i < frames.frameCount; i++) {
    EXPECT_STREQ(frames.frames[i].name, frames2.frames[i].name);
  }
}

} // namespace test
} // namespace symbolizer
} // namespace folly

// Can't use initFacebookLight since that would install its own signal handlers
// Can't use initFacebookNoSignals since we cannot depend on common
int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
