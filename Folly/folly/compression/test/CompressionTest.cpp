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

#include <folly/compression/Compression.h>

#include <algorithm>
#include <random>
#include <set>
#include <thread>
#include <unordered_map>
#include <utility>

#include <boost/noncopyable.hpp>
#include <glog/logging.h>

#include <folly/Random.h>
#include <folly/Varint.h>
#include <folly/hash/Hash.h>
#include <folly/io/IOBufQueue.h>
#include <folly/portability/GTest.h>

#if FOLLY_HAVE_LIBZSTD
#include <zstd.h>

#include <folly/compression/Zstd.h>
#endif

#if FOLLY_HAVE_LIBZ
#include <folly/compression/Zlib.h>

namespace zlib = folly::io::zlib;
#endif

namespace folly {
namespace io {
namespace test {

class DataHolder : private boost::noncopyable {
 public:
  uint64_t hash(size_t size) const;
  ByteRange data(size_t size) const;

 protected:
  explicit DataHolder(size_t sizeLog2);
  const size_t size_;
  std::unique_ptr<uint8_t[]> data_;
  mutable std::unordered_map<uint64_t, uint64_t> hashCache_;
};

DataHolder::DataHolder(size_t sizeLog2)
    : size_(size_t(1) << sizeLog2), data_(new uint8_t[size_]) {}

uint64_t DataHolder::hash(size_t size) const {
  CHECK_LE(size, size_);
  auto p = hashCache_.find(size);
  if (p != hashCache_.end()) {
    return p->second;
  }

  uint64_t h = folly::hash::fnv64_buf(data_.get(), size);
  hashCache_[size] = h;
  return h;
}

ByteRange DataHolder::data(size_t size) const {
  CHECK_LE(size, size_);
  return ByteRange(data_.get(), size);
}

uint64_t hashIOBuf(const IOBuf* buf) {
  uint64_t h = folly::hash::FNV_64_HASH_START;
  for (auto& range : *buf) {
    h = folly::hash::fnv64_buf(range.data(), range.size(), h);
  }
  return h;
}

class RandomDataHolder : public DataHolder {
 public:
  explicit RandomDataHolder(size_t sizeLog2);
};

RandomDataHolder::RandomDataHolder(size_t sizeLog2) : DataHolder(sizeLog2) {
  static constexpr size_t numThreadsLog2 = 3;
  static constexpr size_t numThreads = size_t(1) << numThreadsLog2;

  uint32_t seed = randomNumberSeed();

  std::vector<std::thread> threads;
  threads.reserve(numThreads);
  for (size_t t = 0; t < numThreads; ++t) {
    threads.emplace_back([this, seed, t, sizeLog2] {
      std::mt19937 rng(seed + t);
      size_t countLog2 = sizeLog2 - numThreadsLog2;
      size_t start = size_t(t) << countLog2;
      for (size_t i = 0; i < countLog2; ++i) {
        this->data_[start + i] = rng();
      }
    });
  }

  for (auto& t : threads) {
    t.join();
  }
}

class ConstantDataHolder : public DataHolder {
 public:
  explicit ConstantDataHolder(size_t sizeLog2);
};

ConstantDataHolder::ConstantDataHolder(size_t sizeLog2) : DataHolder(sizeLog2) {
  memset(data_.get(), 'a', size_);
}

constexpr size_t dataSizeLog2 = 27; // 128MiB
RandomDataHolder randomDataHolder(dataSizeLog2);
ConstantDataHolder constantDataHolder(dataSizeLog2);

// The intersection of the provided codecs & those that are compiled in.
static std::vector<CodecType> supportedCodecs(std::vector<CodecType> const& v) {
  std::vector<CodecType> supported;

  std::copy_if(
      std::begin(v), std::end(v), std::back_inserter(supported), hasCodec);

  return supported;
}

// All compiled-in compression codecs.
static std::vector<CodecType> availableCodecs() {
  std::vector<CodecType> codecs;

  for (size_t i = 0; i < static_cast<size_t>(CodecType::NUM_CODEC_TYPES); ++i) {
    auto type = static_cast<CodecType>(i);
    if (hasCodec(type)) {
      codecs.push_back(type);
    }
  }

  return codecs;
}

static std::vector<CodecType> availableStreamCodecs() {
  std::vector<CodecType> codecs;

  for (size_t i = 0; i < static_cast<size_t>(CodecType::NUM_CODEC_TYPES); ++i) {
    auto type = static_cast<CodecType>(i);
    if (hasStreamCodec(type)) {
      codecs.push_back(type);
    }
  }

  return codecs;
}

TEST(CompressionTestNeedsUncompressedLength, Simple) {
  static const struct {
    CodecType type;
    bool needsUncompressedLength;
  } expectations[] = {
      {CodecType::NO_COMPRESSION, false},
      {CodecType::LZ4, true},
      {CodecType::SNAPPY, false},
      {CodecType::ZLIB, false},
      {CodecType::LZ4_VARINT_SIZE, false},
      {CodecType::LZMA2, false},
      {CodecType::LZMA2_VARINT_SIZE, false},
      {CodecType::ZSTD, false},
      {CodecType::GZIP, false},
      {CodecType::LZ4_FRAME, false},
      {CodecType::BZIP2, false},
  };

  for (auto const& test : expectations) {
    if (hasCodec(test.type)) {
      EXPECT_EQ(
          getCodec(test.type)->needsUncompressedLength(),
          test.needsUncompressedLength);
    }
  }
}

class CompressionTest
    : public testing::TestWithParam<std::tuple<int, int, CodecType>> {
 protected:
  void SetUp() override {
    auto tup = GetParam();
    int lengthLog = std::get<0>(tup);
    // Small hack to test empty data
    uncompressedLength_ = (lengthLog < 0) ? 0 : uint64_t(1) << std::get<0>(tup);
    chunks_ = std::get<1>(tup);
    codec_ = getCodec(std::get<2>(tup));
  }

  void runSimpleIOBufTest(const DataHolder& dh);

  void runSimpleStringTest(const DataHolder& dh);

 private:
  std::unique_ptr<IOBuf> split(std::unique_ptr<IOBuf> data) const;

  uint64_t uncompressedLength_;
  size_t chunks_;
  std::unique_ptr<Codec> codec_;
};

void CompressionTest::runSimpleIOBufTest(const DataHolder& dh) {
  const auto original = split(IOBuf::wrapBuffer(dh.data(uncompressedLength_)));
  const auto compressed = split(codec_->compress(original.get()));
  EXPECT_LE(
      compressed->computeChainDataLength(),
      codec_->maxCompressedLength(uncompressedLength_));
  if (!codec_->needsUncompressedLength()) {
    auto uncompressed = codec_->uncompress(compressed.get());
    EXPECT_EQ(uncompressedLength_, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength_), hashIOBuf(uncompressed.get()));
  }
  {
    auto uncompressed =
        codec_->uncompress(compressed.get(), uncompressedLength_);
    EXPECT_EQ(uncompressedLength_, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength_), hashIOBuf(uncompressed.get()));
  }
}

void CompressionTest::runSimpleStringTest(const DataHolder& dh) {
  const auto original = std::string(
      reinterpret_cast<const char*>(dh.data(uncompressedLength_).data()),
      uncompressedLength_);
  const auto compressed = codec_->compress(original);
  EXPECT_LE(
      compressed.length(), codec_->maxCompressedLength(uncompressedLength_));

  if (!codec_->needsUncompressedLength()) {
    auto uncompressed = codec_->uncompress(compressed);
    EXPECT_EQ(uncompressedLength_, uncompressed.length());
    EXPECT_EQ(uncompressed, original);
  }
  {
    auto uncompressed = codec_->uncompress(compressed, uncompressedLength_);
    EXPECT_EQ(uncompressedLength_, uncompressed.length());
    EXPECT_EQ(uncompressed, original);
  }
}

// Uniformly split data into (potentially empty) chunks.
std::unique_ptr<IOBuf> CompressionTest::split(
    std::unique_ptr<IOBuf> data) const {
  if (data->isChained()) {
    data->coalesce();
  }

  const size_t size = data->computeChainDataLength();

  std::multiset<size_t> splits;
  for (size_t i = 1; i < chunks_; ++i) {
    splits.insert(Random::rand64(size));
  }

  folly::IOBufQueue result;

  size_t offset = 0;
  for (size_t split : splits) {
    result.append(IOBuf::copyBuffer(data->data() + offset, split - offset));
    offset = split;
  }
  result.append(IOBuf::copyBuffer(data->data() + offset, size - offset));

  return result.move();
}

TEST_P(CompressionTest, RandomData) {
  runSimpleIOBufTest(randomDataHolder);
}

TEST_P(CompressionTest, ConstantData) {
  runSimpleIOBufTest(constantDataHolder);
}

TEST_P(CompressionTest, RandomDataString) {
  runSimpleStringTest(randomDataHolder);
}

TEST_P(CompressionTest, ConstantDataString) {
  runSimpleStringTest(constantDataHolder);
}

INSTANTIATE_TEST_CASE_P(
    CompressionTest,
    CompressionTest,
    testing::Combine(
        testing::Values(-1, 0, 1, 12, 22, 25, 27),
        testing::Values(1, 2, 3, 8, 65),
        testing::ValuesIn(availableCodecs())));

class CompressionVarintTest
    : public testing::TestWithParam<std::tuple<int, CodecType>> {
 protected:
  void SetUp() override {
    auto tup = GetParam();
    uncompressedLength_ = uint64_t(1) << std::get<0>(tup);
    codec_ = getCodec(std::get<1>(tup));
  }

  void runSimpleTest(const DataHolder& dh);

  uint64_t uncompressedLength_;
  std::unique_ptr<Codec> codec_;
};

inline uint64_t oneBasedMsbPos(uint64_t number) {
  uint64_t pos = 0;
  for (; number > 0; ++pos, number >>= 1) {
  }
  return pos;
}

void CompressionVarintTest::runSimpleTest(const DataHolder& dh) {
  auto original = IOBuf::wrapBuffer(dh.data(uncompressedLength_));
  auto compressed = codec_->compress(original.get());
  auto breakPoint =
      1UL +
      Random::rand64(
          std::max(uint64_t(9), oneBasedMsbPos(uncompressedLength_)) / 9UL);
  auto tinyBuf = IOBuf::copyBuffer(
      compressed->data(), std::min(compressed->length(), breakPoint));
  compressed->trimStart(breakPoint);
  tinyBuf->prependChain(std::move(compressed));
  compressed = std::move(tinyBuf);

  auto uncompressed = codec_->uncompress(compressed.get());

  EXPECT_EQ(uncompressedLength_, uncompressed->computeChainDataLength());
  EXPECT_EQ(dh.hash(uncompressedLength_), hashIOBuf(uncompressed.get()));
}

TEST_P(CompressionVarintTest, RandomData) {
  runSimpleTest(randomDataHolder);
}

TEST_P(CompressionVarintTest, ConstantData) {
  runSimpleTest(constantDataHolder);
}

INSTANTIATE_TEST_CASE_P(
    CompressionVarintTest,
    CompressionVarintTest,
    testing::Combine(
        testing::Values(0, 1, 12, 22, 25, 27),
        testing::ValuesIn(supportedCodecs({
            CodecType::LZ4_VARINT_SIZE,
            CodecType::LZMA2_VARINT_SIZE,
        }))));

TEST(LZMATest, UncompressBadVarint) {
  if (hasStreamCodec(CodecType::LZMA2_VARINT_SIZE)) {
    std::string const str(kMaxVarintLength64 * 2, '\xff');
    ByteRange input((folly::StringPiece(str)));
    auto codec = getStreamCodec(CodecType::LZMA2_VARINT_SIZE);
    auto buffer = IOBuf::create(16);
    buffer->append(buffer->capacity());
    MutableByteRange output{buffer->writableData(), buffer->length()};
    EXPECT_THROW(codec->uncompressStream(input, output), std::runtime_error);
  }
}

class CompressionCorruptionTest : public testing::TestWithParam<CodecType> {
 protected:
  void SetUp() override {
    codec_ = getCodec(GetParam());
  }

  void runSimpleTest(const DataHolder& dh);

  std::unique_ptr<Codec> codec_;
};

void CompressionCorruptionTest::runSimpleTest(const DataHolder& dh) {
  constexpr uint64_t uncompressedLength = 42;
  auto original = IOBuf::wrapBuffer(dh.data(uncompressedLength));
  auto compressed = codec_->compress(original.get());

  if (!codec_->needsUncompressedLength()) {
    auto uncompressed = codec_->uncompress(compressed.get());
    EXPECT_EQ(uncompressedLength, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength), hashIOBuf(uncompressed.get()));
  }
  {
    auto uncompressed =
        codec_->uncompress(compressed.get(), uncompressedLength);
    EXPECT_EQ(uncompressedLength, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength), hashIOBuf(uncompressed.get()));
  }

  EXPECT_THROW(
      codec_->uncompress(compressed.get(), uncompressedLength + 1),
      std::runtime_error);

  auto corrupted = compressed->clone();
  corrupted->unshare();
  // Truncate the last character
  corrupted->prev()->trimEnd(1);
  if (!codec_->needsUncompressedLength()) {
    EXPECT_THROW(codec_->uncompress(corrupted.get()), std::runtime_error);
  }

  EXPECT_THROW(
      codec_->uncompress(corrupted.get(), uncompressedLength),
      std::runtime_error);

  corrupted = compressed->clone();
  corrupted->unshare();
  // Corrupt the first character
  ++(corrupted->writableData()[0]);

  if (!codec_->needsUncompressedLength()) {
    EXPECT_THROW(codec_->uncompress(corrupted.get()), std::runtime_error);
  }

  EXPECT_THROW(
      codec_->uncompress(corrupted.get(), uncompressedLength),
      std::runtime_error);
}

TEST_P(CompressionCorruptionTest, RandomData) {
  runSimpleTest(randomDataHolder);
}

TEST_P(CompressionCorruptionTest, ConstantData) {
  runSimpleTest(constantDataHolder);
}

INSTANTIATE_TEST_CASE_P(
    CompressionCorruptionTest,
    CompressionCorruptionTest,
    testing::ValuesIn(
        // NO_COMPRESSION can't detect corruption
        // LZ4 can't detect corruption reliably (sigh)
        supportedCodecs({
            CodecType::SNAPPY,
            CodecType::ZLIB,
            CodecType::LZMA2,
            CodecType::ZSTD,
            CodecType::LZ4_FRAME,
            CodecType::BZIP2,
        })));

static bool codecHasFlush(CodecType type) {
  return type != CodecType::BZIP2;
}

class StreamingUnitTest : public testing::TestWithParam<CodecType> {
 protected:
  void SetUp() override {
    codec_ = getStreamCodec(GetParam());
  }

  bool hasFlush() const {
    return codecHasFlush(GetParam());
  }

  std::unique_ptr<StreamCodec> codec_;
};

TEST(StreamingUnitTest, needsDataLength) {
  static const struct {
    CodecType type;
    bool needsDataLength;
  } expectations[] = {
      {CodecType::ZLIB, false},
      {CodecType::GZIP, false},
      {CodecType::LZMA2, false},
      {CodecType::LZMA2_VARINT_SIZE, true},
      {CodecType::ZSTD, false},
  };

  for (auto const& test : expectations) {
    if (hasStreamCodec(test.type)) {
      EXPECT_EQ(
          getStreamCodec(test.type)->needsDataLength(), test.needsDataLength);
    }
  }
}

TEST_P(StreamingUnitTest, maxCompressedLength) {
  for (uint64_t const length : {1, 10, 100, 1000, 10000, 100000, 1000000}) {
    EXPECT_GE(codec_->maxCompressedLength(length), length);
  }
}

TEST_P(StreamingUnitTest, getUncompressedLength) {
  auto const empty = IOBuf::create(0);
  EXPECT_EQ(uint64_t(0), codec_->getUncompressedLength(empty.get()));
  EXPECT_EQ(uint64_t(0), codec_->getUncompressedLength(empty.get(), 0));
  EXPECT_ANY_THROW(codec_->getUncompressedLength(empty.get(), 1));

  auto const data = IOBuf::wrapBuffer(randomDataHolder.data(100));
  auto const compressed = codec_->compress(data.get());

  if (auto const length = codec_->getUncompressedLength(data.get())) {
    EXPECT_EQ(100, *length);
  }
  EXPECT_EQ(uint64_t(100), codec_->getUncompressedLength(data.get(), 100));
  // If the uncompressed length is stored in the frame, then make sure it throws
  // when it is given the wrong length.
  if (codec_->getUncompressedLength(data.get()) == uint64_t(100)) {
    EXPECT_ANY_THROW(codec_->getUncompressedLength(data.get(), 200));
  }
}

TEST_P(StreamingUnitTest, emptyData) {
  ByteRange input{};
  auto buffer = IOBuf::create(codec_->maxCompressedLength(0));
  buffer->append(buffer->capacity());
  MutableByteRange output;

  // Test compressing empty data in one pass
  if (!codec_->needsDataLength()) {
    output = {buffer->writableData(), buffer->length()};
    EXPECT_TRUE(
        codec_->compressStream(input, output, StreamCodec::FlushOp::END));
  }
  codec_->resetStream(0);
  output = {buffer->writableData(), buffer->length()};
  EXPECT_TRUE(codec_->compressStream(input, output, StreamCodec::FlushOp::END));

  // Test uncompressing the compressed empty data is equivalent to the empty
  // string
  {
    size_t compressedSize = buffer->length() - output.size();
    auto const compressed =
        IOBuf::copyBuffer(buffer->writableData(), compressedSize);
    auto inputRange = compressed->coalesce();
    codec_->resetStream(0);
    output = {buffer->writableData(), buffer->length()};
    EXPECT_TRUE(codec_->uncompressStream(
        inputRange, output, StreamCodec::FlushOp::END));
    EXPECT_EQ(output.size(), buffer->length());
  }

  // Test compressing empty data with multiple calls to compressStream()
  {
    auto largeBuffer = IOBuf::create(codec_->maxCompressedLength(0) * 2);
    largeBuffer->append(largeBuffer->capacity());
    codec_->resetStream(0);
    output = {largeBuffer->writableData(), largeBuffer->length()};
    EXPECT_FALSE(codec_->compressStream(input, output));
    if (hasFlush()) {
      EXPECT_TRUE(
          codec_->compressStream(input, output, StreamCodec::FlushOp::FLUSH));
    }
    EXPECT_TRUE(
        codec_->compressStream(input, output, StreamCodec::FlushOp::END));
  }

  // Test uncompressing empty data
  output = {};
  codec_->resetStream();
  EXPECT_TRUE(codec_->uncompressStream(input, output));
  if (hasFlush()) {
    codec_->resetStream();
    EXPECT_TRUE(
        codec_->uncompressStream(input, output, StreamCodec::FlushOp::FLUSH));
  }
  codec_->resetStream();
  EXPECT_TRUE(
      codec_->uncompressStream(input, output, StreamCodec::FlushOp::END));
  codec_->resetStream(0);
  EXPECT_TRUE(codec_->uncompressStream(input, output));
  if (hasFlush()) {
    codec_->resetStream(0);
    EXPECT_TRUE(
        codec_->uncompressStream(input, output, StreamCodec::FlushOp::FLUSH));
  }
  codec_->resetStream(0);
  EXPECT_TRUE(
      codec_->uncompressStream(input, output, StreamCodec::FlushOp::END));
}

TEST_P(StreamingUnitTest, noForwardProgress) {
  auto inBuffer = IOBuf::create(2);
  inBuffer->writableData()[0] = 'a';
  inBuffer->writableData()[1] = 'a';
  inBuffer->append(2);
  const auto compressed = codec_->compress(inBuffer.get());
  auto outBuffer = IOBuf::create(codec_->maxCompressedLength(2));

  ByteRange emptyInput;
  MutableByteRange emptyOutput;

  const std::array<StreamCodec::FlushOp, 3> flushOps = {{
      StreamCodec::FlushOp::NONE,
      StreamCodec::FlushOp::FLUSH,
      StreamCodec::FlushOp::END,
  }};

  // No progress is not okay twice in a row for all flush operations when
  // compressing
  for (const auto flushOp : flushOps) {
    if (flushOp == StreamCodec::FlushOp::FLUSH && !hasFlush()) {
      continue;
    }
    if (codec_->needsDataLength()) {
      codec_->resetStream(inBuffer->computeChainDataLength());
    } else {
      codec_->resetStream();
    }
    auto input = inBuffer->coalesce();
    MutableByteRange output = {outBuffer->writableTail(),
                               outBuffer->tailroom()};
    // Compress some data to avoid empty data special casing
    while (!input.empty()) {
      codec_->compressStream(input, output);
    }
    EXPECT_FALSE(codec_->compressStream(emptyInput, emptyOutput, flushOp));
    EXPECT_THROW(
        codec_->compressStream(emptyInput, emptyOutput, flushOp),
        std::runtime_error);
  }

  // No progress is not okay twice in a row for all flush operations when
  // uncompressing
  for (const auto flushOp : flushOps) {
    if (flushOp == StreamCodec::FlushOp::FLUSH && !hasFlush()) {
      continue;
    }
    codec_->resetStream();
    auto input = compressed->coalesce();
    // Remove the last byte so the operation is incomplete
    input.uncheckedSubtract(1);
    MutableByteRange output = {inBuffer->writableData(), inBuffer->length()};
    // Uncompress some data to avoid empty data special casing
    while (!input.empty()) {
      EXPECT_FALSE(codec_->uncompressStream(input, output));
    }
    EXPECT_FALSE(codec_->uncompressStream(emptyInput, emptyOutput, flushOp));
    EXPECT_THROW(
        codec_->uncompressStream(emptyInput, emptyOutput, flushOp),
        std::runtime_error);
  }
}

TEST_P(StreamingUnitTest, stateTransitions) {
  auto inBuffer = IOBuf::create(2);
  inBuffer->writableData()[0] = 'a';
  inBuffer->writableData()[1] = 'a';
  inBuffer->append(2);
  auto compressed = codec_->compress(inBuffer.get());
  ByteRange const in = compressed->coalesce();
  auto outBuffer = IOBuf::create(codec_->maxCompressedLength(in.size()));
  MutableByteRange const out{outBuffer->writableTail(), outBuffer->tailroom()};

  auto compress = [&](StreamCodec::FlushOp flushOp = StreamCodec::FlushOp::NONE,
                      bool empty = false) {
    auto input = in;
    auto output = empty ? MutableByteRange{} : out;
    return codec_->compressStream(input, output, flushOp);
  };
  auto compress_all = [&](bool expect,
                          StreamCodec::FlushOp flushOp =
                              StreamCodec::FlushOp::NONE,
                          bool empty = false) {
    auto input = in;
    auto output = empty ? MutableByteRange{} : out;
    while (!input.empty()) {
      if (expect) {
        EXPECT_TRUE(codec_->compressStream(input, output, flushOp));
      } else {
        EXPECT_FALSE(codec_->compressStream(input, output, flushOp));
      }
    }
  };
  auto uncompress = [&](StreamCodec::FlushOp flushOp =
                            StreamCodec::FlushOp::NONE,
                        bool empty = false) {
    auto input = in;
    auto output = empty ? MutableByteRange{} : out;
    return codec_->uncompressStream(input, output, flushOp);
  };

  // compression flow
  if (!codec_->needsDataLength()) {
    codec_->resetStream();
    EXPECT_FALSE(compress());
    EXPECT_FALSE(compress());
    if (hasFlush()) {
      EXPECT_TRUE(compress(StreamCodec::FlushOp::FLUSH));
    }
    EXPECT_FALSE(compress());
    EXPECT_TRUE(compress(StreamCodec::FlushOp::END));
  }
  codec_->resetStream(in.size() * 5);
  compress_all(false);
  compress_all(false);
  if (hasFlush()) {
    compress_all(true, StreamCodec::FlushOp::FLUSH);
  }
  compress_all(false);
  compress_all(true, StreamCodec::FlushOp::END);

  // uncompression flow
  codec_->resetStream();
  EXPECT_FALSE(uncompress(StreamCodec::FlushOp::NONE, true));
  if (hasFlush()) {
    codec_->resetStream();
    EXPECT_FALSE(uncompress(StreamCodec::FlushOp::FLUSH, true));
  }
  codec_->resetStream();
  EXPECT_FALSE(uncompress(StreamCodec::FlushOp::NONE, true));
  codec_->resetStream();
  EXPECT_FALSE(uncompress(StreamCodec::FlushOp::NONE, true));
  if (hasFlush()) {
    codec_->resetStream();
    EXPECT_TRUE(uncompress(StreamCodec::FlushOp::FLUSH));
  }
  // compress -> uncompress
  codec_->resetStream(in.size());
  EXPECT_FALSE(compress());
  EXPECT_THROW(uncompress(), std::logic_error);
  // uncompress -> compress
  codec_->resetStream(inBuffer->computeChainDataLength());
  EXPECT_TRUE(uncompress(StreamCodec::FlushOp::NONE));
  EXPECT_THROW(compress(), std::logic_error);
  // end -> compress
  if (!codec_->needsDataLength()) {
    codec_->resetStream();
    EXPECT_FALSE(compress());
    EXPECT_TRUE(compress(StreamCodec::FlushOp::END));
    EXPECT_THROW(compress(), std::logic_error);
  }
  codec_->resetStream(in.size() * 2);
  compress_all(false);
  compress_all(true, StreamCodec::FlushOp::END);
  EXPECT_THROW(compress(), std::logic_error);
  // end -> uncompress
  codec_->resetStream();
  EXPECT_TRUE(uncompress(StreamCodec::FlushOp::END));
  EXPECT_THROW(uncompress(), std::logic_error);
  // flush -> compress
  if (hasFlush()) {
    codec_->resetStream(in.size());
    EXPECT_FALSE(compress(StreamCodec::FlushOp::FLUSH, true));
    EXPECT_THROW(compress(), std::logic_error);
  }
  // flush -> end
  if (hasFlush()) {
    codec_->resetStream(in.size());
    EXPECT_FALSE(compress(StreamCodec::FlushOp::FLUSH, true));
    EXPECT_THROW(compress(StreamCodec::FlushOp::END), std::logic_error);
  }
  // undefined -> compress
  codec_->compress(inBuffer.get());
  EXPECT_THROW(compress(), std::logic_error);
  codec_->uncompress(compressed.get(), inBuffer->computeChainDataLength());
  EXPECT_THROW(compress(), std::logic_error);
  // undefined -> undefined
  codec_->uncompress(compressed.get());
  codec_->compress(inBuffer.get());
}

INSTANTIATE_TEST_CASE_P(
    StreamingUnitTest,
    StreamingUnitTest,
    testing::ValuesIn(availableStreamCodecs()));

class StreamingCompressionTest
    : public testing::TestWithParam<std::tuple<int, int, CodecType>> {
 protected:
  bool hasFlush() const {
    return codecHasFlush(std::get<2>(GetParam()));
  }

  void SetUp() override {
    auto const tup = GetParam();
    uncompressedLength_ = uint64_t(1) << std::get<0>(tup);
    chunkSize_ = size_t(1) << std::get<1>(tup);
    codec_ = getStreamCodec(std::get<2>(tup));
  }

  void runResetStreamTest(DataHolder const& dh);
  void runCompressStreamTest(DataHolder const& dh);
  void runUncompressStreamTest(DataHolder const& dh);
  void runFlushTest(DataHolder const& dh);

 private:
  std::vector<ByteRange> split(ByteRange data) const;

  uint64_t uncompressedLength_;
  size_t chunkSize_;
  std::unique_ptr<StreamCodec> codec_;
};

std::vector<ByteRange> StreamingCompressionTest::split(ByteRange data) const {
  size_t const pieces = std::max<size_t>(1, data.size() / chunkSize_);
  std::vector<ByteRange> result;
  result.reserve(pieces + 1);
  while (!data.empty()) {
    size_t const pieceSize = std::min(data.size(), chunkSize_);
    result.push_back(data.subpiece(0, pieceSize));
    data.uncheckedAdvance(pieceSize);
  }
  return result;
}

static std::unique_ptr<IOBuf> compressSome(
    StreamCodec* codec,
    ByteRange data,
    uint64_t bufferSize,
    StreamCodec::FlushOp flush) {
  bool result;
  IOBufQueue queue;
  do {
    auto buffer = IOBuf::create(bufferSize);
    buffer->append(buffer->capacity());
    MutableByteRange output{buffer->writableData(), buffer->length()};

    result = codec->compressStream(data, output, flush);
    buffer->trimEnd(output.size());
    queue.append(std::move(buffer));

  } while (!(flush == StreamCodec::FlushOp::NONE && data.empty()) && !result);
  EXPECT_TRUE(data.empty());
  return queue.move();
}

static std::pair<bool, std::unique_ptr<IOBuf>> uncompressSome(
    StreamCodec* codec,
    ByteRange& data,
    uint64_t bufferSize,
    StreamCodec::FlushOp flush) {
  bool result;
  IOBufQueue queue;
  do {
    auto buffer = IOBuf::create(bufferSize);
    buffer->append(buffer->capacity());
    MutableByteRange output{buffer->writableData(), buffer->length()};

    result = codec->uncompressStream(data, output, flush);
    buffer->trimEnd(output.size());
    queue.append(std::move(buffer));

  } while (queue.tailroom() == 0 && !result);
  return std::make_pair(result, queue.move());
}

void StreamingCompressionTest::runResetStreamTest(DataHolder const& dh) {
  auto const input = dh.data(uncompressedLength_);
  // Compress some but leave state unclean
  codec_->resetStream(uncompressedLength_);
  compressSome(codec_.get(), input, chunkSize_, StreamCodec::FlushOp::NONE);
  // Reset stream and compress all
  if (codec_->needsDataLength()) {
    codec_->resetStream(uncompressedLength_);
  } else {
    codec_->resetStream();
  }
  auto compressed =
      compressSome(codec_.get(), input, chunkSize_, StreamCodec::FlushOp::END);
  auto const uncompressed = codec_->uncompress(compressed.get(), input.size());
  EXPECT_EQ(dh.hash(uncompressedLength_), hashIOBuf(uncompressed.get()));
}

TEST_P(StreamingCompressionTest, resetStream) {
  runResetStreamTest(constantDataHolder);
  runResetStreamTest(randomDataHolder);
}

void StreamingCompressionTest::runCompressStreamTest(
    const folly::io::test::DataHolder& dh) {
  auto const inputs = split(dh.data(uncompressedLength_));

  IOBufQueue queue;
  codec_->resetStream(uncompressedLength_);
  // Compress many inputs in a row
  for (auto const input : inputs) {
    queue.append(compressSome(
        codec_.get(), input, chunkSize_, StreamCodec::FlushOp::NONE));
  }
  // Finish the operation with empty input.
  ByteRange empty;
  queue.append(
      compressSome(codec_.get(), empty, chunkSize_, StreamCodec::FlushOp::END));

  auto const uncompressed = codec_->uncompress(queue.front());
  EXPECT_EQ(dh.hash(uncompressedLength_), hashIOBuf(uncompressed.get()));
}

TEST_P(StreamingCompressionTest, compressStream) {
  runCompressStreamTest(constantDataHolder);
  runCompressStreamTest(randomDataHolder);
}

void StreamingCompressionTest::runUncompressStreamTest(
    const folly::io::test::DataHolder& dh) {
  const auto flush =
      hasFlush() ? StreamCodec::FlushOp::FLUSH : StreamCodec::FlushOp::NONE;
  auto const data = IOBuf::wrapBuffer(dh.data(uncompressedLength_));
  // Concatenate 3 compressed frames in a row
  auto compressed = codec_->compress(data.get());
  compressed->prependChain(codec_->compress(data.get()));
  compressed->prependChain(codec_->compress(data.get()));
  // Pass all 3 compressed frames in one input buffer
  auto input = compressed->coalesce();
  // Uncompress the first frame
  codec_->resetStream(data->computeChainDataLength());
  {
    auto const result = uncompressSome(codec_.get(), input, chunkSize_, flush);
    ASSERT_TRUE(result.first);
    ASSERT_EQ(hashIOBuf(data.get()), hashIOBuf(result.second.get()));
  }
  // Uncompress the second frame
  codec_->resetStream();
  {
    auto const result = uncompressSome(
        codec_.get(), input, chunkSize_, StreamCodec::FlushOp::END);
    ASSERT_TRUE(result.first);
    ASSERT_EQ(hashIOBuf(data.get()), hashIOBuf(result.second.get()));
  }
  // Uncompress the third frame
  codec_->resetStream();
  {
    auto const result = uncompressSome(codec_.get(), input, chunkSize_, flush);
    ASSERT_TRUE(result.first);
    ASSERT_EQ(hashIOBuf(data.get()), hashIOBuf(result.second.get()));
  }
  EXPECT_TRUE(input.empty());
}

TEST_P(StreamingCompressionTest, uncompressStream) {
  runUncompressStreamTest(constantDataHolder);
  runUncompressStreamTest(randomDataHolder);
}

void StreamingCompressionTest::runFlushTest(DataHolder const& dh) {
  auto const inputs = split(dh.data(uncompressedLength_));
  auto uncodec = getStreamCodec(codec_->type());

  if (codec_->needsDataLength()) {
    codec_->resetStream(uncompressedLength_);
  } else {
    codec_->resetStream();
  }
  for (auto input : inputs) {
    // Compress some data and flush the stream
    auto compressed = compressSome(
        codec_.get(), input, chunkSize_, StreamCodec::FlushOp::FLUSH);
    auto compressedRange = compressed->coalesce();
    // Uncompress the compressed data
    auto result = uncompressSome(
        uncodec.get(),
        compressedRange,
        chunkSize_,
        StreamCodec::FlushOp::FLUSH);
    // All compressed data should have been consumed
    EXPECT_TRUE(compressedRange.empty());
    // The frame isn't complete
    EXPECT_FALSE(result.first);
    // The uncompressed data should be exactly the input data
    EXPECT_EQ(input.size(), result.second->computeChainDataLength());
    auto const data = IOBuf::wrapBuffer(input);
    EXPECT_EQ(hashIOBuf(data.get()), hashIOBuf(result.second.get()));
  }
}

TEST_P(StreamingCompressionTest, testFlush) {
  if (!hasFlush()) {
    return;
  }
  runFlushTest(constantDataHolder);
  runFlushTest(randomDataHolder);
}

INSTANTIATE_TEST_CASE_P(
    StreamingCompressionTest,
    StreamingCompressionTest,
    testing::Combine(
        testing::Values(0, 1, 12, 22, 27),
        testing::Values(12, 17, 20),
        testing::ValuesIn(availableStreamCodecs())));

namespace {

// Codec types included in the codec returned by getAutoUncompressionCodec() by
// default.
std::vector<CodecType> autoUncompressionCodecTypes = {{
    CodecType::LZ4_FRAME,
    CodecType::ZSTD,
    CodecType::ZLIB,
    CodecType::GZIP,
    CodecType::LZMA2,
    CodecType::BZIP2,
}};

} // namespace

class AutomaticCodecTest : public testing::TestWithParam<CodecType> {
 protected:
  void SetUp() override {
    codecType_ = GetParam();
    codec_ = getCodec(codecType_);
    autoType_ = std::any_of(
        autoUncompressionCodecTypes.begin(),
        autoUncompressionCodecTypes.end(),
        [&](CodecType o) { return codecType_ == o; });
    // Add the codec with type codecType_ as the terminal codec if it is not in
    // autoUncompressionCodecTypes.
    auto_ = getAutoUncompressionCodec({}, getTerminalCodec());
  }

  void runSimpleTest(const DataHolder& dh);

  std::unique_ptr<Codec> getTerminalCodec() {
    return (autoType_ ? nullptr : getCodec(codecType_));
  }

  std::unique_ptr<Codec> codec_;
  std::unique_ptr<Codec> auto_;
  CodecType codecType_;
  // true if codecType_ is in autoUncompressionCodecTypes
  bool autoType_;
};

void AutomaticCodecTest::runSimpleTest(const DataHolder& dh) {
  constexpr uint64_t uncompressedLength = 1000;
  auto original = IOBuf::wrapBuffer(dh.data(uncompressedLength));
  auto compressed = codec_->compress(original.get());

  if (!codec_->needsUncompressedLength()) {
    auto uncompressed = auto_->uncompress(compressed.get());
    EXPECT_EQ(uncompressedLength, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength), hashIOBuf(uncompressed.get()));
  }
  {
    auto uncompressed = auto_->uncompress(compressed.get(), uncompressedLength);
    EXPECT_EQ(uncompressedLength, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength), hashIOBuf(uncompressed.get()));
  }
  ASSERT_GE(compressed->computeChainDataLength(), 8);
  for (size_t i = 0; i < 8; ++i) {
    auto split = compressed->clone();
    auto rest = compressed->clone();
    split->trimEnd(split->length() - i);
    rest->trimStart(i);
    split->appendChain(std::move(rest));
    auto uncompressed = auto_->uncompress(split.get(), uncompressedLength);
    EXPECT_EQ(uncompressedLength, uncompressed->computeChainDataLength());
    EXPECT_EQ(dh.hash(uncompressedLength), hashIOBuf(uncompressed.get()));
  }
}

TEST_P(AutomaticCodecTest, RandomData) {
  runSimpleTest(randomDataHolder);
}

TEST_P(AutomaticCodecTest, ConstantData) {
  runSimpleTest(constantDataHolder);
}

TEST_P(AutomaticCodecTest, ValidPrefixes) {
  const auto prefixes = codec_->validPrefixes();
  for (const auto& prefix : prefixes) {
    EXPECT_FALSE(prefix.empty());
    // Ensure that all strings are at least 8 bytes for LZMA2.
    // The bytes after the prefix should be ignored by `canUncompress()`.
    IOBuf data{IOBuf::COPY_BUFFER, prefix, 0, 8};
    data.append(8);
    EXPECT_TRUE(codec_->canUncompress(&data));
    EXPECT_TRUE(auto_->canUncompress(&data));
  }
}

TEST_P(AutomaticCodecTest, NeedsUncompressedLength) {
  if (codec_->needsUncompressedLength()) {
    EXPECT_TRUE(auto_->needsUncompressedLength());
  }
}

TEST_P(AutomaticCodecTest, maxUncompressedLength) {
  EXPECT_LE(codec_->maxUncompressedLength(), auto_->maxUncompressedLength());
}

TEST_P(AutomaticCodecTest, DefaultCodec) {
  const uint64_t length = 42;
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(getCodec(CodecType::ZSTD));
  auto automatic =
      getAutoUncompressionCodec(std::move(codecs), getTerminalCodec());
  auto original = IOBuf::wrapBuffer(constantDataHolder.data(length));
  auto compressed = codec_->compress(original.get());
  std::unique_ptr<IOBuf> decompressed;

  if (automatic->needsUncompressedLength()) {
    decompressed = automatic->uncompress(compressed.get(), length);
  } else {
    decompressed = automatic->uncompress(compressed.get());
  }

  EXPECT_EQ(constantDataHolder.hash(length), hashIOBuf(decompressed.get()));
}

namespace {
class CustomCodec : public Codec {
 public:
  static std::unique_ptr<Codec> create(std::string prefix, CodecType type) {
    return std::make_unique<CustomCodec>(std::move(prefix), type);
  }
  explicit CustomCodec(std::string prefix, CodecType type)
      : Codec(CodecType::USER_DEFINED),
        prefix_(std::move(prefix)),
        codec_(getCodec(type)) {}

 private:
  std::vector<std::string> validPrefixes() const override {
    return {prefix_};
  }

  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override {
    return codec_->maxCompressedLength(uncompressedLength) + prefix_.size();
  }

  bool canUncompress(const IOBuf* data, Optional<uint64_t>) const override {
    auto clone = data->cloneCoalescedAsValue();
    if (clone.length() < prefix_.size()) {
      return false;
    }
    return memcmp(clone.data(), prefix_.data(), prefix_.size()) == 0;
  }

  std::unique_ptr<IOBuf> doCompress(const IOBuf* data) override {
    auto result = IOBuf::copyBuffer(prefix_);
    result->appendChain(codec_->compress(data));
    EXPECT_TRUE(canUncompress(result.get(), data->computeChainDataLength()));
    return result;
  }

  std::unique_ptr<IOBuf> doUncompress(
      const IOBuf* data,
      Optional<uint64_t> uncompressedLength) override {
    EXPECT_TRUE(canUncompress(data, uncompressedLength));
    auto clone = data->cloneCoalescedAsValue();
    clone.trimStart(prefix_.size());
    return codec_->uncompress(&clone, uncompressedLength);
  }

  std::string prefix_;
  std::unique_ptr<Codec> codec_;
};
} // namespace

TEST_P(AutomaticCodecTest, CustomCodec) {
  const uint64_t length = 42;
  auto ab = CustomCodec::create("ab", CodecType::ZSTD);
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("ab", CodecType::ZSTD));
  auto automatic =
      getAutoUncompressionCodec(std::move(codecs), getTerminalCodec());
  auto original = IOBuf::wrapBuffer(constantDataHolder.data(length));

  auto abCompressed = ab->compress(original.get());
  std::unique_ptr<IOBuf> abDecompressed;
  if (automatic->needsUncompressedLength()) {
    abDecompressed = automatic->uncompress(abCompressed.get(), length);
  } else {
    abDecompressed = automatic->uncompress(abCompressed.get());
  }
  EXPECT_TRUE(automatic->canUncompress(abCompressed.get()));
  EXPECT_FALSE(auto_->canUncompress(abCompressed.get()));
  EXPECT_EQ(constantDataHolder.hash(length), hashIOBuf(abDecompressed.get()));

  auto compressed = codec_->compress(original.get());
  std::unique_ptr<IOBuf> decompressed;
  if (automatic->needsUncompressedLength()) {
    decompressed = automatic->uncompress(compressed.get(), length);
  } else {
    decompressed = automatic->uncompress(compressed.get());
  }
  EXPECT_EQ(constantDataHolder.hash(length), hashIOBuf(decompressed.get()));
}

TEST_P(AutomaticCodecTest, CustomDefaultCodec) {
  const uint64_t length = 42;
  auto none = CustomCodec::create("none", CodecType::NO_COMPRESSION);
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("none", CodecType::NO_COMPRESSION));
  codecs.push_back(getCodec(CodecType::LZ4_FRAME));
  auto automatic =
      getAutoUncompressionCodec(std::move(codecs), getTerminalCodec());
  auto original = IOBuf::wrapBuffer(constantDataHolder.data(length));

  auto noneCompressed = none->compress(original.get());
  std::unique_ptr<IOBuf> noneDecompressed;
  if (automatic->needsUncompressedLength()) {
    noneDecompressed = automatic->uncompress(noneCompressed.get(), length);
  } else {
    noneDecompressed = automatic->uncompress(noneCompressed.get());
  }
  EXPECT_TRUE(automatic->canUncompress(noneCompressed.get()));
  EXPECT_FALSE(auto_->canUncompress(noneCompressed.get()));
  EXPECT_EQ(constantDataHolder.hash(length), hashIOBuf(noneDecompressed.get()));

  auto compressed = codec_->compress(original.get());
  std::unique_ptr<IOBuf> decompressed;
  if (automatic->needsUncompressedLength()) {
    decompressed = automatic->uncompress(compressed.get(), length);
  } else {
    decompressed = automatic->uncompress(compressed.get());
  }
  EXPECT_EQ(constantDataHolder.hash(length), hashIOBuf(decompressed.get()));
}

TEST_P(AutomaticCodecTest, canUncompressOneBytes) {
  // No default codec can uncompress 1 bytes.
  IOBuf buf{IOBuf::CREATE, 1};
  buf.append(1);
  EXPECT_FALSE(codec_->canUncompress(&buf, 1));
  EXPECT_FALSE(codec_->canUncompress(&buf, folly::none));
  EXPECT_FALSE(auto_->canUncompress(&buf, 1));
  EXPECT_FALSE(auto_->canUncompress(&buf, folly::none));
}

INSTANTIATE_TEST_CASE_P(
    AutomaticCodecTest,
    AutomaticCodecTest,
    testing::ValuesIn(availableCodecs()));

namespace {

// Codec that always "uncompresses" to the same string.
class ConstantCodec : public Codec {
 public:
  static std::unique_ptr<Codec> create(
      std::string uncompressed,
      CodecType type) {
    return std::make_unique<ConstantCodec>(std::move(uncompressed), type);
  }
  explicit ConstantCodec(std::string uncompressed, CodecType type)
      : Codec(type), uncompressed_(std::move(uncompressed)) {}

 private:
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override {
    return uncompressedLength;
  }

  std::unique_ptr<IOBuf> doCompress(const IOBuf*) override {
    throw std::runtime_error("ConstantCodec error: compress() not supported.");
  }

  std::unique_ptr<IOBuf> doUncompress(const IOBuf*, Optional<uint64_t>)
      override {
    return IOBuf::copyBuffer(uncompressed_);
  }

  std::string uncompressed_;
  std::unique_ptr<Codec> codec_;
};

} // namespace

class TerminalCodecTest : public testing::TestWithParam<CodecType> {
 protected:
  void SetUp() override {
    codecType_ = GetParam();
    codec_ = getCodec(codecType_);
    auto_ = getAutoUncompressionCodec();
  }

  CodecType codecType_;
  std::unique_ptr<Codec> codec_;
  std::unique_ptr<Codec> auto_;
};

// Test that the terminal codec's uncompress() function is called when the
// default chosen automatic codec throws.
TEST_P(TerminalCodecTest, uncompressIfDefaultThrows) {
  std::string const original = "abc";
  auto const compressed = codec_->compress(original);

  // Sanity check: the automatic codec can uncompress the original string.
  auto const uncompressed = auto_->uncompress(compressed);
  EXPECT_EQ(uncompressed, original);

  // Truncate the compressed string.
  auto const truncated = compressed.substr(0, compressed.size() - 1);
  auto const truncatedBuf =
      IOBuf::wrapBuffer(truncated.data(), truncated.size());
  EXPECT_TRUE(auto_->canUncompress(truncatedBuf.get()));
  EXPECT_ANY_THROW(auto_->uncompress(truncated));

  // Expect the terminal codec to successfully uncompress the string.
  std::unique_ptr<Codec> terminal = getAutoUncompressionCodec(
      {}, ConstantCodec::create("dummyString", CodecType::USER_DEFINED));
  EXPECT_TRUE(terminal->canUncompress(truncatedBuf.get()));
  EXPECT_EQ(terminal->uncompress(truncated), "dummyString");
}

// If the terminal codec has one of the "default types" automatically added in
// the AutomaticCodec, check that the default codec is no longer added.
TEST_P(TerminalCodecTest, terminalOverridesDefaults) {
  std::unique_ptr<Codec> terminal = getAutoUncompressionCodec(
      {}, ConstantCodec::create("dummyString", codecType_));
  std::string const original = "abc";
  auto const compressed = codec_->compress(original);
  EXPECT_EQ(terminal->uncompress(compressed), "dummyString");
}

INSTANTIATE_TEST_CASE_P(
    TerminalCodecTest,
    TerminalCodecTest,
    testing::ValuesIn(autoUncompressionCodecTypes));

TEST(ValidPrefixesTest, CustomCodec) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("none", CodecType::NO_COMPRESSION));
  const auto none = getAutoUncompressionCodec(std::move(codecs));
  const auto prefixes = none->validPrefixes();
  const auto it = std::find(prefixes.begin(), prefixes.end(), "none");
  EXPECT_TRUE(it != prefixes.end());
}

#define EXPECT_THROW_IF_DEBUG(statement, expected_exception) \
  do {                                                       \
    if (kIsDebug) {                                          \
      EXPECT_THROW((statement), expected_exception);         \
    } else {                                                 \
      EXPECT_NO_THROW((statement));                          \
    }                                                        \
  } while (false)

TEST(CheckCompatibleTest, SimplePrefixSecond) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("abc", CodecType::NO_COMPRESSION));
  codecs.push_back(CustomCodec::create("ab", CodecType::NO_COMPRESSION));
  EXPECT_THROW_IF_DEBUG(
      getAutoUncompressionCodec(std::move(codecs)), std::invalid_argument);
}

TEST(CheckCompatibleTest, SimplePrefixFirst) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("ab", CodecType::NO_COMPRESSION));
  codecs.push_back(CustomCodec::create("abc", CodecType::NO_COMPRESSION));
  EXPECT_THROW_IF_DEBUG(
      getAutoUncompressionCodec(std::move(codecs)), std::invalid_argument);
}

TEST(CheckCompatibleTest, Empty) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("", CodecType::NO_COMPRESSION));
  EXPECT_THROW_IF_DEBUG(
      getAutoUncompressionCodec(std::move(codecs)), std::invalid_argument);
}

TEST(CheckCompatibleTest, ZstdPrefix) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("\x28\xB5\x2F", CodecType::ZSTD));
  EXPECT_THROW_IF_DEBUG(
      getAutoUncompressionCodec(std::move(codecs)), std::invalid_argument);
}

TEST(CheckCompatibleTest, ZstdDuplicate) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("\x28\xB5\x2F\xFD", CodecType::ZSTD));
  EXPECT_THROW_IF_DEBUG(
      getAutoUncompressionCodec(std::move(codecs)), std::invalid_argument);
}

TEST(CheckCompatibleTest, ZlibIsPrefix) {
  std::vector<std::unique_ptr<Codec>> codecs;
  codecs.push_back(CustomCodec::create("\x18\x76zzasdf", CodecType::ZSTD));
  EXPECT_THROW_IF_DEBUG(
      getAutoUncompressionCodec(std::move(codecs)), std::invalid_argument);
}

#if FOLLY_HAVE_LIBZSTD

TEST(ZstdTest, BackwardCompatible) {
  auto codec = getCodec(CodecType::ZSTD);
  {
    auto const data = IOBuf::wrapBuffer(randomDataHolder.data(size_t(1) << 20));
    auto compressed = codec->compress(data.get());
    compressed->coalesce();
    EXPECT_EQ(
        data->length(),
        ZSTD_getDecompressedSize(compressed->data(), compressed->length()));
  }
  {
    auto const data =
        IOBuf::wrapBuffer(randomDataHolder.data(size_t(100) << 20));
    auto compressed = codec->compress(data.get());
    compressed->coalesce();
    EXPECT_EQ(
        data->length(),
        ZSTD_getDecompressedSize(compressed->data(), compressed->length()));
  }
}

TEST(ZstdTest, CustomOptions) {
  auto test = [](const DataHolder& dh, unsigned contentSizeFlag) {
    unsigned const wlog = 23;
    zstd::Options options(1);
    options.set(ZSTD_p_contentSizeFlag, contentSizeFlag);
    options.set(ZSTD_p_checksumFlag, 1);
    options.set(ZSTD_p_windowLog, wlog);
    auto codec = zstd::getCodec(std::move(options));
    size_t const uncompressedLength = (size_t)1 << 27;
    auto const original = std::string(
        reinterpret_cast<const char*>(dh.data(uncompressedLength).data()),
        uncompressedLength);
    auto const compressed = codec->compress(original);
    auto const uncompressed = codec->uncompress(compressed);
    EXPECT_EQ(uncompressed, original);
    EXPECT_EQ(
        codec->getUncompressedLength(
            folly::IOBuf::wrapBuffer(compressed.data(), compressed.size())
                .get()),
        contentSizeFlag ? uncompressedLength : Optional<uint64_t>());
    {
      ZSTD_frameHeader zfh;
      ZSTD_getFrameHeader(&zfh, compressed.data(), compressed.size());
      EXPECT_EQ(zfh.checksumFlag, 1);
      EXPECT_EQ(zfh.windowSize, 1ULL << wlog);
      EXPECT_EQ(
          zfh.frameContentSize,
          contentSizeFlag ? uncompressedLength : ZSTD_CONTENTSIZE_UNKNOWN);
    }
  };
  for (unsigned contentSizeFlag = 0; contentSizeFlag <= 1; ++contentSizeFlag) {
    test(constantDataHolder, contentSizeFlag);
    test(randomDataHolder, contentSizeFlag);
  }
}

TEST(ZstdTest, NegativeLevels) {
  EXPECT_EQ(zstd::Options(1).level(), 1);
  EXPECT_EQ(zstd::Options(-1).level(), -1);
  auto const original = std::string(
      reinterpret_cast<const char*>(randomDataHolder.data(16348).data()),
      16348);
  auto const plusCompressed =
      zstd::getCodec(zstd::Options(1))->compress(original);
  auto const minusCompressed =
      zstd::getCodec(zstd::Options(-100))->compress(original);
  EXPECT_GT(minusCompressed.size(), plusCompressed.size());
  auto codec = getCodec(CodecType::ZSTD);
  auto const uncompressed = codec->uncompress(minusCompressed);
  EXPECT_EQ(original, uncompressed);
}

#endif

#if FOLLY_HAVE_LIBZ

using ZlibFormat = zlib::Options::Format;

TEST(ZlibTest, Auto) {
  size_t const uncompressedLength_ = (size_t)1 << 15;
  auto const original = std::string(
      reinterpret_cast<const char*>(
          randomDataHolder.data(uncompressedLength_).data()),
      uncompressedLength_);
  auto optionCodec = zlib::getCodec(zlib::Options(ZlibFormat::AUTO));

  // Test the codec can uncompress zlib data.
  {
    auto codec = getCodec(CodecType::ZLIB);
    auto const compressed = codec->compress(original);
    auto const uncompressed = optionCodec->uncompress(compressed);
    EXPECT_EQ(original, uncompressed);
  }

  // Test the codec can uncompress gzip data.
  {
    auto codec = getCodec(CodecType::GZIP);
    auto const compressed = codec->compress(original);
    auto const uncompressed = optionCodec->uncompress(compressed);
    EXPECT_EQ(original, uncompressed);
  }
}

TEST(ZlibTest, DefaultOptions) {
  size_t const uncompressedLength_ = (size_t)1 << 20;
  auto const original = std::string(
      reinterpret_cast<const char*>(
          randomDataHolder.data(uncompressedLength_).data()),
      uncompressedLength_);
  {
    auto codec = getCodec(CodecType::ZLIB);
    auto optionCodec = zlib::getCodec(zlib::defaultZlibOptions());
    auto const compressed = optionCodec->compress(original);
    auto uncompressed = codec->uncompress(compressed);
    EXPECT_EQ(original, uncompressed);
    uncompressed = optionCodec->uncompress(compressed);
    EXPECT_EQ(original, uncompressed);
  }

  {
    auto codec = getCodec(CodecType::GZIP);
    auto optionCodec = zlib::getCodec(zlib::defaultGzipOptions());
    auto const compressed = optionCodec->compress(original);
    auto uncompressed = codec->uncompress(compressed);
    EXPECT_EQ(original, uncompressed);
    uncompressed = optionCodec->uncompress(compressed);
    EXPECT_EQ(original, uncompressed);
  }
}

class ZlibOptionsTest
    : public testing::TestWithParam<std::tuple<ZlibFormat, int, int, int>> {
 protected:
  void SetUp() override {
    auto tup = GetParam();
    options_.format = std::get<0>(tup);
    options_.windowSize = std::get<1>(tup);
    options_.memLevel = std::get<2>(tup);
    options_.strategy = std::get<3>(tup);
    codec_ = zlib::getStreamCodec(options_);
  }

  void runSimpleRoundTripTest(const DataHolder& dh);

 private:
  zlib::Options options_;
  std::unique_ptr<StreamCodec> codec_;
};

void ZlibOptionsTest::runSimpleRoundTripTest(const DataHolder& dh) {
  size_t const uncompressedLength = (size_t)1 << 16;
  auto const original = std::string(
      reinterpret_cast<const char*>(dh.data(uncompressedLength).data()),
      uncompressedLength);

  auto const compressed = codec_->compress(original);
  auto const uncompressed = codec_->uncompress(compressed);
  EXPECT_EQ(uncompressed, original);
}

TEST_P(ZlibOptionsTest, simpleRoundTripTest) {
  runSimpleRoundTripTest(constantDataHolder);
  runSimpleRoundTripTest(randomDataHolder);
}

INSTANTIATE_TEST_CASE_P(
    ZlibOptionsTest,
    ZlibOptionsTest,
    testing::Combine(
        testing::Values(
            ZlibFormat::ZLIB,
            ZlibFormat::GZIP,
            ZlibFormat::RAW,
            ZlibFormat::AUTO),
        testing::Values(9, 12, 15),
        testing::Values(1, 8, 9),
        testing::Values(
            Z_DEFAULT_STRATEGY,
            Z_FILTERED,
            Z_HUFFMAN_ONLY,
            Z_RLE,
            Z_FIXED)));

#endif // FOLLY_HAVE_LIBZ

} // namespace test
} // namespace io
} // namespace folly
