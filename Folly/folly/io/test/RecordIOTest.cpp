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

#include <folly/io/RecordIO.h>

#include <sys/types.h>

#include <random>

#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/FBString.h>
#include <folly/Random.h>
#include <folly/experimental/TestUtil.h>
#include <folly/io/IOBufQueue.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>

DEFINE_int32(random_seed, folly::randomNumberSeed(), "random seed");

namespace folly {
namespace test {

namespace {
// shortcut
StringPiece sp(ByteRange br) {
  return StringPiece(br);
}

template <class T>
std::unique_ptr<IOBuf> iobufs(std::initializer_list<T> ranges) {
  IOBufQueue queue;
  for (auto& range : ranges) {
    StringPiece r(range);
    queue.append(IOBuf::wrapBuffer(r.data(), r.size()));
  }
  return queue.move();
}

} // namespace

TEST(RecordIOTest, Simple) {
  TemporaryFile file;
  {
    RecordIOWriter writer(File(file.fd()));
    writer.write(iobufs({"hello ", "world"}));
    writer.write(iobufs({"goodbye"}));
  }
  {
    RecordIOReader reader(File(file.fd()));
    auto it = reader.begin();
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("hello world", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("goodbye", sp((it++)->first));
    EXPECT_TRUE(it == reader.end());
  }
  {
    RecordIOWriter writer(File(file.fd()));
    writer.write(iobufs({"meow"}));
    writer.write(iobufs({"woof"}));
  }
  {
    RecordIOReader reader(File(file.fd()));
    auto it = reader.begin();
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("hello world", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("goodbye", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("meow", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("woof", sp((it++)->first));
    EXPECT_TRUE(it == reader.end());
  }
}

TEST(RecordIOTest, SmallRecords) {
  constexpr size_t kSize = 10;
  char tmp[kSize];
  memset(tmp, 'x', kSize);
  TemporaryFile file;
  {
    RecordIOWriter writer(File(file.fd()));
    for (size_t i = 0; i < kSize; ++i) { // record of size 0 should be ignored
      writer.write(IOBuf::wrapBuffer(tmp, i));
    }
  }
  {
    RecordIOReader reader(File(file.fd()));
    auto it = reader.begin();
    for (size_t i = 1; i < kSize; ++i) {
      ASSERT_FALSE(it == reader.end());
      EXPECT_EQ(StringPiece(tmp, i), sp((it++)->first));
    }
    EXPECT_TRUE(it == reader.end());
  }
}

TEST(RecordIOTest, MultipleFileIds) {
  TemporaryFile file;
  {
    RecordIOWriter writer(File(file.fd()), 1);
    writer.write(iobufs({"hello"}));
  }
  {
    RecordIOWriter writer(File(file.fd()), 2);
    writer.write(iobufs({"world"}));
  }
  {
    RecordIOWriter writer(File(file.fd()), 1);
    writer.write(iobufs({"goodbye"}));
  }
  {
    RecordIOReader reader(File(file.fd()), 0); // return all
    auto it = reader.begin();
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("hello", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("world", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("goodbye", sp((it++)->first));
    EXPECT_TRUE(it == reader.end());
  }
  {
    RecordIOReader reader(File(file.fd()), 1);
    auto it = reader.begin();
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("hello", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("goodbye", sp((it++)->first));
    EXPECT_TRUE(it == reader.end());
  }
  {
    RecordIOReader reader(File(file.fd()), 2);
    auto it = reader.begin();
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("world", sp((it++)->first));
    EXPECT_TRUE(it == reader.end());
  }
  {
    RecordIOReader reader(File(file.fd()), 3);
    auto it = reader.begin();
    EXPECT_TRUE(it == reader.end());
  }
}

TEST(RecordIOTest, ExtraMagic) {
  TemporaryFile file;
  {
    RecordIOWriter writer(File(file.fd()));
    writer.write(iobufs({"hello"}));
  }
  uint8_t buf[recordio_helpers::headerSize() + 5];
  EXPECT_EQ(0, lseek(file.fd(), 0, SEEK_SET));
  EXPECT_EQ(sizeof(buf), read(file.fd(), buf, sizeof(buf)));
  // Append an extra magic
  const uint32_t magic = recordio_helpers::recordio_detail::Header::kMagic;
  EXPECT_EQ(sizeof(magic), write(file.fd(), &magic, sizeof(magic)));
  // and an extra record
  EXPECT_EQ(sizeof(buf), write(file.fd(), buf, sizeof(buf)));
  {
    RecordIOReader reader(File(file.fd()));
    auto it = reader.begin();
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("hello", sp((it++)->first));
    ASSERT_FALSE(it == reader.end());
    EXPECT_EQ("hello", sp((it++)->first));
    EXPECT_TRUE(it == reader.end());
  }
}

namespace {
void corrupt(int fd, off_t pos) {
  uint8_t val = 0;
  EXPECT_EQ(1, pread(fd, &val, 1, pos));
  ++val;
  EXPECT_EQ(1, pwrite(fd, &val, 1, pos));
}
} // namespace

TEST(RecordIOTest, Randomized) {
  SCOPED_TRACE(to<std::string>("Random seed is ", FLAGS_random_seed));
  std::mt19937 rnd(FLAGS_random_seed);

  size_t recordCount = std::uniform_int_distribution<uint32_t>(30, 300)(rnd);

  std::uniform_int_distribution<uint32_t> recordSizeDist(1, 3 << 16);
  std::uniform_int_distribution<uint32_t> charDist(0, 255);
  std::uniform_int_distribution<uint32_t> junkDist(0, 1 << 20);
  // corrupt 1/5 of all records
  std::uniform_int_distribution<uint32_t> corruptDist(0, 4);

  std::vector<std::pair<fbstring, off_t>> records;
  std::vector<off_t> corruptPositions;
  records.reserve(recordCount);
  TemporaryFile file;

  fbstring record;
  // Recreate the writer multiple times so we test that we create a
  // continuous stream
  for (size_t i = 0; i < 3; ++i) {
    RecordIOWriter writer(File(file.fd()));
    for (size_t j = 0; j < recordCount; ++j) {
      off_t beginPos = writer.filePos();
      record.clear();
      size_t recordSize = recordSizeDist(rnd);
      record.reserve(recordSize);
      for (size_t k = 0; k < recordSize; ++k) {
        record.push_back(charDist(rnd));
      }
      writer.write(iobufs({record}));

      bool corrupt = (corruptDist(rnd) == 0);
      if (corrupt) {
        // Corrupt one random byte in the record (including header)
        std::uniform_int_distribution<uint32_t> corruptByteDist(
            0, recordSize + recordio_helpers::headerSize() - 1);
        off_t corruptRel = corruptByteDist(rnd);
        VLOG(1) << "n=" << records.size() << " bpos=" << beginPos
                << " rsize=" << record.size() << " corrupt rel=" << corruptRel
                << " abs=" << beginPos + corruptRel;
        corruptPositions.push_back(beginPos + corruptRel);
      } else {
        VLOG(2) << "n=" << records.size() << " bpos=" << beginPos
                << " rsize=" << record.size() << " good";
        records.emplace_back(std::move(record), beginPos);
      }
    }
    VLOG(1) << "n=" << records.size() << " close abs=" << writer.filePos();
  }

  for (auto& pos : corruptPositions) {
    corrupt(file.fd(), pos);
  }

  {
    size_t i = 0;
    RecordIOReader reader(File(file.fd()));
    for (auto& r : reader) {
      SCOPED_TRACE(i);
      ASSERT_LT(i, records.size());
      EXPECT_EQ(records[i].first, sp(r.first));
      EXPECT_EQ(records[i].second, r.second);
      ++i;
    }
    EXPECT_EQ(records.size(), i);
  }
}
} // namespace test
} // namespace folly

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
