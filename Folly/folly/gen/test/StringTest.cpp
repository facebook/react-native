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

#include <iosfwd>
#include <map>
#include <vector>

#include <folly/functional/ApplyTuple.h>
#include <folly/gen/String.h>
#include <folly/portability/GTest.h>

using namespace folly::gen;
using namespace folly;
using std::make_tuple;
using std::ostream;
using std::pair;
using std::string;
using std::tuple;
using std::unique_ptr;
using std::vector;

using vec = vector<string>;

static auto collect = eachTo<std::string>() | as<vector>();

TEST(StringGen, EmptySplit) {
  {
    auto input = "";
    auto expected = vec{};
    EXPECT_EQ(expected, split(input, ',') | collect);
  }

  // The last delimiter is eaten, just like std::getline
  {
    auto input = ",";
    auto expected = vec{""};
    EXPECT_EQ(expected, split(input, ',') | collect);
  }

  {
    auto input = ",,";
    auto expected = vec{"", ""};
    EXPECT_EQ(expected, split(input, ',') | collect);
  }

  {
    auto input = ",,";
    auto expected = vec{""};
    EXPECT_EQ(expected, split(input, ',') | take(1) | collect);
  }
}

TEST(StringGen, Split) {
  {
    auto input = "hello,, world, goodbye, meow";
    auto expected = vec{"hello", "", " world", " goodbye", " meow"};
    EXPECT_EQ(expected, split(input, ',') | collect);
  }

  {
    auto input = "hello,, world, goodbye, meow";
    auto expected = vec{"hello", "", " world"};
    EXPECT_EQ(expected, split(input, ',') | take(3) | collect);
  }

  {
    auto input = "hello,, world, goodbye, meow";
    auto expected = vec{"hello", "", " world", " goodbye", " meow"};
    EXPECT_EQ(expected, split(input, ",") | take(5) | collect);
  }

  {
    auto input = "hello,, world, goodbye, meow";
    auto expected = vec{"hello,", "world", "goodbye", "meow"};
    EXPECT_EQ(expected, split(input, ", ") | collect);
  }
}

TEST(StringGen, SplitByNewLine) {
  {
    auto input = "hello\n\n world\r\n goodbye\r me\n\row";
    auto expected = vec{"hello", "", " world", " goodbye", " me", "", "ow"};
    EXPECT_EQ(expected, lines(input) | collect);
  }
}

TEST(StringGen, EmptyResplit) {
  {
    auto input = vec{""};
    auto expected = vec{};
    EXPECT_EQ(expected, from(input) | resplit(',') | collect);
  }

  // The last delimiter is eaten, just like std::getline
  {
    auto input = vec{","};
    auto expected = vec{""};
    EXPECT_EQ(expected, from(input) | resplit(',') | collect);
  }

  {
    auto input = vec{",,"};
    auto expected = vec{"", ""};
    EXPECT_EQ(expected, from(input) | resplit(',') | collect);
  }
}

TEST(StringGen, Resplit) {
  {
    auto input = vec{"hello,, world, goodbye, meow"};
    auto expected = vec{"hello", "", " world", " goodbye", " meow"};
    EXPECT_EQ(expected, from(input) | resplit(',') | collect);
  }

  {
    auto input = vec{"hel", "lo,", ", world", ", goodbye, m", "eow"};
    auto expected = vec{"hello", "", " world", " goodbye", " meow"};
    EXPECT_EQ(expected, from(input) | resplit(',') | collect);
  }
}

TEST(StringGen, ResplitKeepDelimiter) {
  {
    auto input = vec{"hello,, world, goodbye, meow"};
    auto expected = vec{"hello,", ",", " world,", " goodbye,", " meow"};
    EXPECT_EQ(expected, from(input) | resplit(',', true) | collect);
  }

  {
    auto input = vec{"hel", "lo,", ", world", ", goodbye, m", "eow"};
    auto expected = vec{"hello,", ",", " world,", " goodbye,", " meow"};
    EXPECT_EQ(expected, from(input) | resplit(',', true) | collect);
  }
}

TEST(StringGen, EachToTuple) {
  {
    auto lines = "2:1.414:yo 3:1.732:hi";
    // clang-format off
    auto actual
      = split(lines, ' ')
      | eachToTuple<int, double, std::string>(':')
      | as<vector>();
    // clang-format on
    vector<tuple<int, double, std::string>> expected{
        make_tuple(2, 1.414, "yo"),
        make_tuple(3, 1.732, "hi"),
    };
    EXPECT_EQ(expected, actual);
  }
  {
    auto lines = "2 3";
    // clang-format off
    auto actual
      = split(lines, ' ')
      | eachToTuple<int>(',')
      | as<vector>();
    // clang-format on
    vector<tuple<int>> expected{
        make_tuple(2),
        make_tuple(3),
    };
    EXPECT_EQ(expected, actual);
  }
  {
    // StringPiece target
    auto lines = "1:cat 2:dog";
    // clang-format off
    auto actual
      = split(lines, ' ')
      | eachToTuple<int, StringPiece>(':')
      | as<vector>();
    // clang-format on
    vector<tuple<int, StringPiece>> expected{
        make_tuple(1, "cat"),
        make_tuple(2, "dog"),
    };
    EXPECT_EQ(expected, actual);
  }
  {
    // Empty field
    auto lines = "2:tjackson:4 3::5";
    // clang-format off
    auto actual
      = split(lines, ' ')
      | eachToTuple<int, fbstring, int>(':')
      | as<vector>();
    // clang-format on
    vector<tuple<int, fbstring, int>> expected{
        make_tuple(2, "tjackson", 4),
        make_tuple(3, "", 5),
    };
    EXPECT_EQ(expected, actual);
  }
  {
    // Excess fields
    auto lines = "1:2 3:4:5";
    // clang-format off
    EXPECT_THROW(
        (split(lines, ' ')
          | eachToTuple<int, int>(':')
          | as<vector>()),
        std::runtime_error);
    // clang-format on
  }
  {
    // Missing fields
    auto lines = "1:2:3 4:5";
    // clang-format off
    EXPECT_THROW(
        (split(lines, ' ')
          | eachToTuple<int, int, int>(':')
          | as<vector>()),
        std::runtime_error);
    // clang-format on
  }
}

TEST(StringGen, EachToPair) {
  {
    // char delimiters
    auto lines = "2:1.414 3:1.732";
    // clang-format off
    auto actual
      = split(lines, ' ')
      | eachToPair<int, double>(':')
      | as<std::map<int, double>>();
    // clang-format on
    std::map<int, double> expected{
        {3, 1.732},
        {2, 1.414},
    };
    EXPECT_EQ(expected, actual);
  }
  {
    // string delimiters
    auto lines = "ab=>cd ef=>gh";
    // clang-format off
    auto actual
      = split(lines, ' ')
      | eachToPair<string, string>("=>")
      | as<std::map<string, string>>();
    // clang-format on
    std::map<string, string> expected{
        {"ab", "cd"},
        {"ef", "gh"},
    };
    EXPECT_EQ(expected, actual);
  }
}

void checkResplitMaxLength(
    vector<string> ins,
    char delim,
    uint64_t maxLength,
    vector<string> outs) {
  vector<std::string> pieces;
  auto splitter = streamSplitter(
      delim,
      [&pieces](StringPiece s) {
        pieces.push_back(string(s.begin(), s.end()));
        return true;
      },
      maxLength);
  for (const auto& in : ins) {
    splitter(in);
  }
  splitter.flush();

  EXPECT_EQ(outs.size(), pieces.size());
  for (size_t i = 0; i < outs.size(); ++i) {
    EXPECT_EQ(outs[i], pieces[i]);
  }

  // Also check the concatenated input against the same output
  if (ins.size() > 1) {
    checkResplitMaxLength({folly::join("", ins)}, delim, maxLength, outs);
  }
}

TEST(StringGen, ResplitMaxLength) {
  // clang-format off
  checkResplitMaxLength(
      {"hel", "lo,", ", world", ", goodbye, m", "ew"}, ',', 5,
      {"hello", ",", ",", " worl", "d,", " good", "bye,", " mew"});
  // " meow" cannot be "end of stream", since it's maxLength long
  checkResplitMaxLength(
      {"hel", "lo,", ", world", ", goodbye, m", "eow"}, ',', 5,
      {"hello", ",", ",", " worl", "d,", " good", "bye,", " meow", ""});
  checkResplitMaxLength(
      {"||", "", "", "", "|a|b", "cdefghijklmn", "|opqrst",
       "uvwx|y|||", "z", "0123456789", "|", ""}, '|', 2,
      {"|", "|", "|", "a|", "bc", "de", "fg", "hi", "jk", "lm", "n|", "op",
       "qr", "st", "uv", "wx", "|", "y|", "|", "|", "z0", "12", "34", "56",
       "78", "9|", ""});
  // clang-format on
}

template <typename F>
void runUnsplitSuite(F fn) {
  fn("hello, world");
  fn("hello,world,goodbye");
  fn(" ");
  fn("");
  fn(", ");
  fn(", a, b,c");
}

TEST(StringGen, Unsplit) {
  auto basicFn = [](StringPiece s) {
    EXPECT_EQ(split(s, ',') | unsplit(','), s);
  };

  auto existingBuffer = [](StringPiece s) {
    folly::fbstring buffer("asdf");
    split(s, ',') | unsplit(',', &buffer);
    auto expected = folly::to<folly::fbstring>("asdf", s.empty() ? "" : ",", s);
    EXPECT_EQ(expected, buffer);
  };

  auto emptyBuffer = [](StringPiece s) {
    std::string buffer;
    split(s, ',') | unsplit(',', &buffer);
    EXPECT_EQ(s, buffer);
  };

  auto stringDelim = [](StringPiece s) {
    EXPECT_EQ(s, split(s, ',') | unsplit(","));
    std::string buffer;
    split(s, ',') | unsplit(",", &buffer);
    EXPECT_EQ(buffer, s);
  };

  runUnsplitSuite(basicFn);
  runUnsplitSuite(existingBuffer);
  runUnsplitSuite(emptyBuffer);
  runUnsplitSuite(stringDelim);
  EXPECT_EQ("1, 2, 3", seq(1, 3) | unsplit(", "));
}

TEST(StringGen, Batch) {
  std::vector<std::string> chunks{
      "on", "e\nt", "w", "o", "\nthr", "ee\nfo", "ur\n"};
  std::vector<std::string> lines{"one", "two", "three", "four"};
  EXPECT_EQ(4, from(chunks) | resplit('\n') | count);
  EXPECT_EQ(4, from(chunks) | resplit('\n') | batch(2) | rconcat | count);
  EXPECT_EQ(4, from(chunks) | resplit('\n') | batch(3) | rconcat | count);
  // clang-format off
  EXPECT_EQ(
      lines,
      from(chunks)
        | resplit('\n')
        | eachTo<std::string>()
        | batch(3)
        | rconcat
        | as<vector>());
  // clang-format on
}

TEST(StringGen, UncurryTuple) {
  folly::StringPiece file = "1\t2\t3\n1\t4\t9";
  auto rows = split(file, '\n') | eachToTuple<int, int, int>('\t');
  auto productSum =
      rows | map(uncurry([](int x, int y, int z) { return x * y * z; })) | sum;
  EXPECT_EQ(42, productSum);
}

TEST(StringGen, UncurryPair) {
  folly::StringPiece file = "2\t3\n4\t9";
  auto rows = split(file, '\n') | eachToPair<int, int>('\t');
  auto productSum =
      rows | map(uncurry([](int x, int y) { return x * y; })) | sum;
  EXPECT_EQ(42, productSum);
}
