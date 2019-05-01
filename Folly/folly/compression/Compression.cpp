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

#if FOLLY_HAVE_LIBLZ4
#include <lz4.h>
#include <lz4hc.h>
#if LZ4_VERSION_NUMBER >= 10301
#include <lz4frame.h>
#endif
#endif

#include <glog/logging.h>

#if FOLLY_HAVE_LIBSNAPPY
#include <snappy-sinksource.h>
#include <snappy.h>
#endif

#if FOLLY_HAVE_LIBZ
#include <folly/compression/Zlib.h>
#endif

#if FOLLY_HAVE_LIBLZMA
#include <lzma.h>
#endif

#if FOLLY_HAVE_LIBZSTD
#include <folly/compression/Zstd.h>
#endif

#if FOLLY_HAVE_LIBBZ2
#include <folly/portability/Windows.h>

#include <bzlib.h>
#endif

#include <folly/Conv.h>
#include <folly/Memory.h>
#include <folly/Portability.h>
#include <folly/Random.h>
#include <folly/ScopeGuard.h>
#include <folly/Varint.h>
#include <folly/compression/Utils.h>
#include <folly/io/Cursor.h>
#include <folly/lang/Bits.h>
#include <folly/stop_watch.h>
#include <algorithm>
#include <unordered_set>

using folly::io::compression::detail::dataStartsWithLE;
using folly::io::compression::detail::prefixToStringLE;

namespace folly {
namespace io {

Codec::Codec(
    CodecType type,
    Optional<int> level,
    StringPiece name,
    bool counters)
    : type_(type) {
  if (counters) {
    bytesBeforeCompression_ = {type,
                               name,
                               level,
                               CompressionCounterKey::BYTES_BEFORE_COMPRESSION,
                               CompressionCounterType::SUM};
    bytesAfterCompression_ = {type,
                              name,
                              level,
                              CompressionCounterKey::BYTES_AFTER_COMPRESSION,
                              CompressionCounterType::SUM};
    bytesBeforeDecompression_ = {
        type,
        name,
        level,
        CompressionCounterKey::BYTES_BEFORE_DECOMPRESSION,
        CompressionCounterType::SUM};
    bytesAfterDecompression_ = {
        type,
        name,
        level,
        CompressionCounterKey::BYTES_AFTER_DECOMPRESSION,
        CompressionCounterType::SUM};
    compressions_ = {type,
                     name,
                     level,
                     CompressionCounterKey::COMPRESSIONS,
                     CompressionCounterType::SUM};
    decompressions_ = {type,
                       name,
                       level,
                       CompressionCounterKey::DECOMPRESSIONS,
                       CompressionCounterType::SUM};
    compressionMilliseconds_ = {type,
                                name,
                                level,
                                CompressionCounterKey::COMPRESSION_MILLISECONDS,
                                CompressionCounterType::SUM};
    decompressionMilliseconds_ = {
        type,
        name,
        level,
        CompressionCounterKey::DECOMPRESSION_MILLISECONDS,
        CompressionCounterType::SUM};
  }
}

namespace {
constexpr uint32_t kLoggingRate = 50;

class Timer {
 public:
  explicit Timer(folly::detail::CompressionCounter& counter)
      : counter_(&counter) {}

  ~Timer() {
    *counter_ += timer_.elapsed().count();
  }

 private:
  folly::detail::CompressionCounter* counter_;
  stop_watch<std::chrono::milliseconds> timer_;
};
} // namespace

// Ensure consistent behavior in the nullptr case
std::unique_ptr<IOBuf> Codec::compress(const IOBuf* data) {
  if (data == nullptr) {
    throw std::invalid_argument("Codec: data must not be nullptr");
  }
  const uint64_t len = data->computeChainDataLength();
  if (len > maxUncompressedLength()) {
    throw std::runtime_error("Codec: uncompressed length too large");
  }
  bool const logging = folly::Random::oneIn(kLoggingRate);
  folly::Optional<Timer> const timer =
      logging ? Timer(compressionMilliseconds_) : folly::Optional<Timer>();
  auto result = doCompress(data);
  if (logging) {
    compressions_++;
    bytesBeforeCompression_ += len;
    bytesAfterCompression_ += result->computeChainDataLength();
  }
  return result;
}

std::string Codec::compress(const StringPiece data) {
  const uint64_t len = data.size();
  if (len > maxUncompressedLength()) {
    throw std::runtime_error("Codec: uncompressed length too large");
  }
  bool const logging = folly::Random::oneIn(kLoggingRate);
  folly::Optional<Timer> const timer =
      logging ? Timer(compressionMilliseconds_) : folly::Optional<Timer>();
  auto result = doCompressString(data);
  if (logging) {
    compressions_++;
    bytesBeforeCompression_ += len;
    bytesAfterCompression_ += result.size();
  }
  return result;
}

std::unique_ptr<IOBuf> Codec::uncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) {
  if (data == nullptr) {
    throw std::invalid_argument("Codec: data must not be nullptr");
  }
  if (!uncompressedLength) {
    if (needsUncompressedLength()) {
      throw std::invalid_argument("Codec: uncompressed length required");
    }
  } else if (*uncompressedLength > maxUncompressedLength()) {
    throw std::runtime_error("Codec: uncompressed length too large");
  }

  if (data->empty()) {
    if (uncompressedLength.value_or(0) != 0) {
      throw std::runtime_error("Codec: invalid uncompressed length");
    }
    return IOBuf::create(0);
  }

  bool const logging = folly::Random::oneIn(kLoggingRate);
  folly::Optional<Timer> const timer =
      logging ? Timer(decompressionMilliseconds_) : folly::Optional<Timer>();
  auto result = doUncompress(data, uncompressedLength);
  if (logging) {
    decompressions_++;
    bytesBeforeDecompression_ += data->computeChainDataLength();
    bytesAfterDecompression_ += result->computeChainDataLength();
  }
  return result;
}

std::string Codec::uncompress(
    const StringPiece data,
    Optional<uint64_t> uncompressedLength) {
  if (!uncompressedLength) {
    if (needsUncompressedLength()) {
      throw std::invalid_argument("Codec: uncompressed length required");
    }
  } else if (*uncompressedLength > maxUncompressedLength()) {
    throw std::runtime_error("Codec: uncompressed length too large");
  }

  if (data.empty()) {
    if (uncompressedLength.value_or(0) != 0) {
      throw std::runtime_error("Codec: invalid uncompressed length");
    }
    return "";
  }

  bool const logging = folly::Random::oneIn(kLoggingRate);
  folly::Optional<Timer> const timer =
      logging ? Timer(decompressionMilliseconds_) : folly::Optional<Timer>();
  auto result = doUncompressString(data, uncompressedLength);
  if (logging) {
    decompressions_++;
    bytesBeforeDecompression_ += data.size();
    bytesAfterDecompression_ += result.size();
  }
  return result;
}

bool Codec::needsUncompressedLength() const {
  return doNeedsUncompressedLength();
}

uint64_t Codec::maxUncompressedLength() const {
  return doMaxUncompressedLength();
}

bool Codec::doNeedsUncompressedLength() const {
  return false;
}

uint64_t Codec::doMaxUncompressedLength() const {
  return UNLIMITED_UNCOMPRESSED_LENGTH;
}

std::vector<std::string> Codec::validPrefixes() const {
  return {};
}

bool Codec::canUncompress(const IOBuf*, Optional<uint64_t>) const {
  return false;
}

std::string Codec::doCompressString(const StringPiece data) {
  const IOBuf inputBuffer{IOBuf::WRAP_BUFFER, data};
  auto outputBuffer = doCompress(&inputBuffer);
  std::string output;
  output.reserve(outputBuffer->computeChainDataLength());
  for (auto range : *outputBuffer) {
    output.append(reinterpret_cast<const char*>(range.data()), range.size());
  }
  return output;
}

std::string Codec::doUncompressString(
    const StringPiece data,
    Optional<uint64_t> uncompressedLength) {
  const IOBuf inputBuffer{IOBuf::WRAP_BUFFER, data};
  auto outputBuffer = doUncompress(&inputBuffer, uncompressedLength);
  std::string output;
  output.reserve(outputBuffer->computeChainDataLength());
  for (auto range : *outputBuffer) {
    output.append(reinterpret_cast<const char*>(range.data()), range.size());
  }
  return output;
}

uint64_t Codec::maxCompressedLength(uint64_t uncompressedLength) const {
  return doMaxCompressedLength(uncompressedLength);
}

Optional<uint64_t> Codec::getUncompressedLength(
    const folly::IOBuf* data,
    Optional<uint64_t> uncompressedLength) const {
  auto const compressedLength = data->computeChainDataLength();
  if (compressedLength == 0) {
    if (uncompressedLength.value_or(0) != 0) {
      throw std::runtime_error("Invalid uncompressed length");
    }
    return 0;
  }
  return doGetUncompressedLength(data, uncompressedLength);
}

Optional<uint64_t> Codec::doGetUncompressedLength(
    const folly::IOBuf*,
    Optional<uint64_t> uncompressedLength) const {
  return uncompressedLength;
}

bool StreamCodec::needsDataLength() const {
  return doNeedsDataLength();
}

bool StreamCodec::doNeedsDataLength() const {
  return false;
}

void StreamCodec::assertStateIs(State expected) const {
  if (state_ != expected) {
    throw std::logic_error(folly::to<std::string>(
        "Codec: state is ", state_, "; expected state ", expected));
  }
}

void StreamCodec::resetStream(Optional<uint64_t> uncompressedLength) {
  state_ = State::RESET;
  uncompressedLength_ = uncompressedLength;
  progressMade_ = true;
  doResetStream();
}

bool StreamCodec::compressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (state_ == State::RESET && input.empty() &&
      flushOp == StreamCodec::FlushOp::END &&
      uncompressedLength().value_or(0) != 0) {
    throw std::runtime_error("Codec: invalid uncompressed length");
  }

  if (!uncompressedLength() && needsDataLength()) {
    throw std::runtime_error("Codec: uncompressed length required");
  }
  if (state_ == State::RESET && !input.empty() &&
      uncompressedLength() == uint64_t(0)) {
    throw std::runtime_error("Codec: invalid uncompressed length");
  }
  // Handle input state transitions
  switch (flushOp) {
    case StreamCodec::FlushOp::NONE:
      if (state_ == State::RESET) {
        state_ = State::COMPRESS;
      }
      assertStateIs(State::COMPRESS);
      break;
    case StreamCodec::FlushOp::FLUSH:
      if (state_ == State::RESET || state_ == State::COMPRESS) {
        state_ = State::COMPRESS_FLUSH;
      }
      assertStateIs(State::COMPRESS_FLUSH);
      break;
    case StreamCodec::FlushOp::END:
      if (state_ == State::RESET || state_ == State::COMPRESS) {
        state_ = State::COMPRESS_END;
      }
      assertStateIs(State::COMPRESS_END);
      break;
  }
  size_t const inputSize = input.size();
  size_t const outputSize = output.size();
  bool const done = doCompressStream(input, output, flushOp);
  if (!done && inputSize == input.size() && outputSize == output.size()) {
    if (!progressMade_) {
      throw std::runtime_error("Codec: No forward progress made");
    }
    // Throw an exception if there is no progress again next time
    progressMade_ = false;
  } else {
    progressMade_ = true;
  }
  // Handle output state transitions
  if (done) {
    if (state_ == State::COMPRESS_FLUSH) {
      state_ = State::COMPRESS;
    } else if (state_ == State::COMPRESS_END) {
      state_ = State::END;
    }
    // Check internal invariants
    DCHECK(input.empty());
    DCHECK(flushOp != StreamCodec::FlushOp::NONE);
  }
  return done;
}

bool StreamCodec::uncompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (state_ == State::RESET && input.empty()) {
    if (uncompressedLength().value_or(0) == 0) {
      return true;
    }
    return false;
  }
  // Handle input state transitions
  if (state_ == State::RESET) {
    state_ = State::UNCOMPRESS;
  }
  assertStateIs(State::UNCOMPRESS);
  size_t const inputSize = input.size();
  size_t const outputSize = output.size();
  bool const done = doUncompressStream(input, output, flushOp);
  if (!done && inputSize == input.size() && outputSize == output.size()) {
    if (!progressMade_) {
      throw std::runtime_error("Codec: no forward progress made");
    }
    // Throw an exception if there is no progress again next time
    progressMade_ = false;
  } else {
    progressMade_ = true;
  }
  // Handle output state transitions
  if (done) {
    state_ = State::END;
  }
  return done;
}

static std::unique_ptr<IOBuf> addOutputBuffer(
    MutableByteRange& output,
    uint64_t size) {
  DCHECK(output.empty());
  auto buffer = IOBuf::create(size);
  buffer->append(buffer->capacity());
  output = {buffer->writableData(), buffer->length()};
  return buffer;
}

std::unique_ptr<IOBuf> StreamCodec::doCompress(IOBuf const* data) {
  uint64_t const uncompressedLength = data->computeChainDataLength();
  resetStream(uncompressedLength);
  uint64_t const maxCompressedLen = maxCompressedLength(uncompressedLength);

  auto constexpr kMaxSingleStepLength = uint64_t(64) << 20; // 64 MB
  auto constexpr kDefaultBufferLength = uint64_t(4) << 20; // 4 MB

  MutableByteRange output;
  auto buffer = addOutputBuffer(
      output,
      maxCompressedLen <= kMaxSingleStepLength ? maxCompressedLen
                                               : kDefaultBufferLength);

  // Compress the entire IOBuf chain into the IOBuf chain pointed to by buffer
  IOBuf const* current = data;
  ByteRange input{current->data(), current->length()};
  StreamCodec::FlushOp flushOp = StreamCodec::FlushOp::NONE;
  bool done = false;
  while (!done) {
    while (input.empty() && current->next() != data) {
      current = current->next();
      input = {current->data(), current->length()};
    }
    if (current->next() == data) {
      // This is the last input buffer so end the stream
      flushOp = StreamCodec::FlushOp::END;
    }
    if (output.empty()) {
      buffer->prependChain(addOutputBuffer(output, kDefaultBufferLength));
    }
    done = compressStream(input, output, flushOp);
    if (done) {
      DCHECK(input.empty());
      DCHECK(flushOp == StreamCodec::FlushOp::END);
      DCHECK_EQ(current->next(), data);
    }
  }
  buffer->prev()->trimEnd(output.size());
  return buffer;
}

static uint64_t computeBufferLength(
    uint64_t const compressedLength,
    uint64_t const blockSize) {
  uint64_t constexpr kMaxBufferLength = uint64_t(4) << 20; // 4 MiB
  uint64_t const goodBufferSize = 4 * std::max(blockSize, compressedLength);
  return std::min(goodBufferSize, kMaxBufferLength);
}

std::unique_ptr<IOBuf> StreamCodec::doUncompress(
    IOBuf const* data,
    Optional<uint64_t> uncompressedLength) {
  auto constexpr kMaxSingleStepLength = uint64_t(64) << 20; // 64 MB
  auto constexpr kBlockSize = uint64_t(128) << 10;
  auto const defaultBufferLength =
      computeBufferLength(data->computeChainDataLength(), kBlockSize);

  uncompressedLength = getUncompressedLength(data, uncompressedLength);
  resetStream(uncompressedLength);

  MutableByteRange output;
  auto buffer = addOutputBuffer(
      output,
      (uncompressedLength && *uncompressedLength <= kMaxSingleStepLength
           ? *uncompressedLength
           : defaultBufferLength));

  // Uncompress the entire IOBuf chain into the IOBuf chain pointed to by buffer
  IOBuf const* current = data;
  ByteRange input{current->data(), current->length()};
  StreamCodec::FlushOp flushOp = StreamCodec::FlushOp::NONE;
  bool done = false;
  while (!done) {
    while (input.empty() && current->next() != data) {
      current = current->next();
      input = {current->data(), current->length()};
    }
    if (current->next() == data) {
      // Tell the uncompressor there is no more input (it may optimize)
      flushOp = StreamCodec::FlushOp::END;
    }
    if (output.empty()) {
      buffer->prependChain(addOutputBuffer(output, defaultBufferLength));
    }
    done = uncompressStream(input, output, flushOp);
  }
  if (!input.empty()) {
    throw std::runtime_error("Codec: Junk after end of data");
  }

  buffer->prev()->trimEnd(output.size());
  if (uncompressedLength &&
      *uncompressedLength != buffer->computeChainDataLength()) {
    throw std::runtime_error("Codec: invalid uncompressed length");
  }

  return buffer;
}

namespace {

/**
 * No compression
 */
class NoCompressionCodec final : public Codec {
 public:
  static std::unique_ptr<Codec> create(int level, CodecType type);
  explicit NoCompressionCodec(int level, CodecType type);

 private:
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;
  std::unique_ptr<IOBuf> doCompress(const IOBuf* data) override;
  std::unique_ptr<IOBuf> doUncompress(
      const IOBuf* data,
      Optional<uint64_t> uncompressedLength) override;
};

std::unique_ptr<Codec> NoCompressionCodec::create(int level, CodecType type) {
  return std::make_unique<NoCompressionCodec>(level, type);
}

NoCompressionCodec::NoCompressionCodec(int level, CodecType type)
    : Codec(type) {
  DCHECK(type == CodecType::NO_COMPRESSION);
  switch (level) {
    case COMPRESSION_LEVEL_DEFAULT:
    case COMPRESSION_LEVEL_FASTEST:
    case COMPRESSION_LEVEL_BEST:
      level = 0;
  }
  if (level != 0) {
    throw std::invalid_argument(
        to<std::string>("NoCompressionCodec: invalid level ", level));
  }
}

uint64_t NoCompressionCodec::doMaxCompressedLength(
    uint64_t uncompressedLength) const {
  return uncompressedLength;
}

std::unique_ptr<IOBuf> NoCompressionCodec::doCompress(const IOBuf* data) {
  return data->clone();
}

std::unique_ptr<IOBuf> NoCompressionCodec::doUncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) {
  if (uncompressedLength &&
      data->computeChainDataLength() != *uncompressedLength) {
    throw std::runtime_error(
        to<std::string>("NoCompressionCodec: invalid uncompressed length"));
  }
  return data->clone();
}

#if (FOLLY_HAVE_LIBLZ4 || FOLLY_HAVE_LIBLZMA)

namespace {

void encodeVarintToIOBuf(uint64_t val, folly::IOBuf* out) {
  DCHECK_GE(out->tailroom(), kMaxVarintLength64);
  out->append(encodeVarint(val, out->writableTail()));
}

inline uint64_t decodeVarintFromCursor(folly::io::Cursor& cursor) {
  uint64_t val = 0;
  int8_t b = 0;
  for (int shift = 0; shift <= 63; shift += 7) {
    b = cursor.read<int8_t>();
    val |= static_cast<uint64_t>(b & 0x7f) << shift;
    if (b >= 0) {
      break;
    }
  }
  if (b < 0) {
    throw std::invalid_argument("Invalid varint value. Too big.");
  }
  return val;
}

} // namespace

#endif // FOLLY_HAVE_LIBLZ4 || FOLLY_HAVE_LIBLZMA

#if FOLLY_HAVE_LIBLZ4

#if LZ4_VERSION_NUMBER >= 10802 && defined(LZ4_STATIC_LINKING_ONLY) && \
    defined(LZ4_HC_STATIC_LINKING_ONLY) && !defined(FOLLY_USE_LZ4_FAST_RESET)
#define FOLLY_USE_LZ4_FAST_RESET
#endif

#ifdef FOLLY_USE_LZ4_FAST_RESET
namespace {
void lz4_stream_t_deleter(LZ4_stream_t* ctx) {
  LZ4_freeStream(ctx);
}

void lz4_streamhc_t_deleter(LZ4_streamHC_t* ctx) {
  LZ4_freeStreamHC(ctx);
}
} // namespace
#endif

/**
 * LZ4 compression
 */
class LZ4Codec final : public Codec {
 public:
  static std::unique_ptr<Codec> create(int level, CodecType type);
  explicit LZ4Codec(int level, CodecType type);

 private:
  bool doNeedsUncompressedLength() const override;
  uint64_t doMaxUncompressedLength() const override;
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;

  bool encodeSize() const {
    return type() == CodecType::LZ4_VARINT_SIZE;
  }

  std::unique_ptr<IOBuf> doCompress(const IOBuf* data) override;
  std::unique_ptr<IOBuf> doUncompress(
      const IOBuf* data,
      Optional<uint64_t> uncompressedLength) override;

#ifdef FOLLY_USE_LZ4_FAST_RESET
  std::unique_ptr<
      LZ4_stream_t,
      folly::static_function_deleter<LZ4_stream_t, lz4_stream_t_deleter>>
      ctx;
  std::unique_ptr<
      LZ4_streamHC_t,
      folly::static_function_deleter<LZ4_streamHC_t, lz4_streamhc_t_deleter>>
      hcctx;
#endif

  bool highCompression_;
};

std::unique_ptr<Codec> LZ4Codec::create(int level, CodecType type) {
  return std::make_unique<LZ4Codec>(level, type);
}

static int lz4ConvertLevel(int level) {
  switch (level) {
    case 1:
    case COMPRESSION_LEVEL_FASTEST:
    case COMPRESSION_LEVEL_DEFAULT:
      return 1;
    case 2:
    case COMPRESSION_LEVEL_BEST:
      return 2;
  }
  throw std::invalid_argument(
      to<std::string>("LZ4Codec: invalid level: ", level));
}

LZ4Codec::LZ4Codec(int level, CodecType type)
    : Codec(type, lz4ConvertLevel(level)),
      highCompression_(lz4ConvertLevel(level) > 1) {
  DCHECK(type == CodecType::LZ4 || type == CodecType::LZ4_VARINT_SIZE);
}

bool LZ4Codec::doNeedsUncompressedLength() const {
  return !encodeSize();
}

// The value comes from lz4.h in lz4-r117, but older versions of lz4 don't
// define LZ4_MAX_INPUT_SIZE (even though the max size is the same), so do it
// here.
#ifndef LZ4_MAX_INPUT_SIZE
#define LZ4_MAX_INPUT_SIZE 0x7E000000
#endif

uint64_t LZ4Codec::doMaxUncompressedLength() const {
  return LZ4_MAX_INPUT_SIZE;
}

uint64_t LZ4Codec::doMaxCompressedLength(uint64_t uncompressedLength) const {
  return LZ4_compressBound(uncompressedLength) +
      (encodeSize() ? kMaxVarintLength64 : 0);
}

std::unique_ptr<IOBuf> LZ4Codec::doCompress(const IOBuf* data) {
  IOBuf clone;
  if (data->isChained()) {
    // LZ4 doesn't support streaming, so we have to coalesce
    clone = data->cloneCoalescedAsValue();
    data = &clone;
  }

  auto out = IOBuf::create(maxCompressedLength(data->length()));
  if (encodeSize()) {
    encodeVarintToIOBuf(data->length(), out.get());
  }

  int n;
  auto input = reinterpret_cast<const char*>(data->data());
  auto output = reinterpret_cast<char*>(out->writableTail());
  const auto inputLength = data->length();

#ifdef FOLLY_USE_LZ4_FAST_RESET
  if (!highCompression_ && !ctx) {
    ctx.reset(LZ4_createStream());
  }
  if (highCompression_ && !hcctx) {
    hcctx.reset(LZ4_createStreamHC());
  }

  if (highCompression_) {
    n = LZ4_compress_HC_extStateHC_fastReset(
        hcctx.get(), input, output, inputLength, out->tailroom(), 0);
  } else {
    n = LZ4_compress_fast_extState_fastReset(
        ctx.get(), input, output, inputLength, out->tailroom(), 1);
  }
#elif LZ4_VERSION_NUMBER >= 10700
  if (highCompression_) {
    n = LZ4_compress_HC(input, output, inputLength, out->tailroom(), 0);
  } else {
    n = LZ4_compress_default(input, output, inputLength, out->tailroom());
  }
#else
  if (highCompression_) {
    n = LZ4_compressHC(input, output, inputLength);
  } else {
    n = LZ4_compress(input, output, inputLength);
  }
#endif

  CHECK_GE(n, 0);
  CHECK_LE(n, out->capacity());

  out->append(n);
  return out;
}

std::unique_ptr<IOBuf> LZ4Codec::doUncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) {
  IOBuf clone;
  if (data->isChained()) {
    // LZ4 doesn't support streaming, so we have to coalesce
    clone = data->cloneCoalescedAsValue();
    data = &clone;
  }

  folly::io::Cursor cursor(data);
  uint64_t actualUncompressedLength;
  if (encodeSize()) {
    actualUncompressedLength = decodeVarintFromCursor(cursor);
    if (uncompressedLength && *uncompressedLength != actualUncompressedLength) {
      throw std::runtime_error("LZ4Codec: invalid uncompressed length");
    }
  } else {
    // Invariants
    DCHECK(uncompressedLength.hasValue());
    DCHECK(*uncompressedLength <= maxUncompressedLength());
    actualUncompressedLength = *uncompressedLength;
  }

  auto sp = StringPiece{cursor.peekBytes()};
  auto out = IOBuf::create(actualUncompressedLength);
  int n = LZ4_decompress_safe(
      sp.data(),
      reinterpret_cast<char*>(out->writableTail()),
      sp.size(),
      actualUncompressedLength);

  if (n < 0 || uint64_t(n) != actualUncompressedLength) {
    throw std::runtime_error(
        to<std::string>("LZ4 decompression returned invalid value ", n));
  }
  out->append(actualUncompressedLength);
  return out;
}

#if LZ4_VERSION_NUMBER >= 10301

class LZ4FrameCodec final : public Codec {
 public:
  static std::unique_ptr<Codec> create(int level, CodecType type);
  explicit LZ4FrameCodec(int level, CodecType type);
  ~LZ4FrameCodec() override;

  std::vector<std::string> validPrefixes() const override;
  bool canUncompress(const IOBuf* data, Optional<uint64_t> uncompressedLength)
      const override;

 private:
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;

  std::unique_ptr<IOBuf> doCompress(const IOBuf* data) override;
  std::unique_ptr<IOBuf> doUncompress(
      const IOBuf* data,
      Optional<uint64_t> uncompressedLength) override;

  // Reset the dctx_ if it is dirty or null.
  void resetDCtx();

  int level_;
#ifdef FOLLY_USE_LZ4_FAST_RESET
  LZ4F_compressionContext_t cctx_{nullptr};
#endif
  LZ4F_decompressionContext_t dctx_{nullptr};
  bool dirty_{false};
};

/* static */ std::unique_ptr<Codec> LZ4FrameCodec::create(
    int level,
    CodecType type) {
  return std::make_unique<LZ4FrameCodec>(level, type);
}

static constexpr uint32_t kLZ4FrameMagicLE = 0x184D2204;

std::vector<std::string> LZ4FrameCodec::validPrefixes() const {
  return {prefixToStringLE(kLZ4FrameMagicLE)};
}

bool LZ4FrameCodec::canUncompress(const IOBuf* data, Optional<uint64_t>) const {
  return dataStartsWithLE(data, kLZ4FrameMagicLE);
}

uint64_t LZ4FrameCodec::doMaxCompressedLength(
    uint64_t uncompressedLength) const {
  LZ4F_preferences_t prefs{};
  prefs.compressionLevel = level_;
  prefs.frameInfo.contentSize = uncompressedLength;
  return LZ4F_compressFrameBound(uncompressedLength, &prefs);
}

static size_t lz4FrameThrowOnError(size_t code) {
  if (LZ4F_isError(code)) {
    throw std::runtime_error(
        to<std::string>("LZ4Frame error: ", LZ4F_getErrorName(code)));
  }
  return code;
}

void LZ4FrameCodec::resetDCtx() {
  if (dctx_ && !dirty_) {
    return;
  }
  if (dctx_) {
    LZ4F_freeDecompressionContext(dctx_);
  }
  lz4FrameThrowOnError(LZ4F_createDecompressionContext(&dctx_, 100));
  dirty_ = false;
}

static int lz4fConvertLevel(int level) {
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
    case COMPRESSION_LEVEL_DEFAULT:
      return 0;
    case COMPRESSION_LEVEL_BEST:
      return 16;
  }
  return level;
}

LZ4FrameCodec::LZ4FrameCodec(int level, CodecType type)
    : Codec(type, lz4fConvertLevel(level)), level_(lz4fConvertLevel(level)) {
  DCHECK(type == CodecType::LZ4_FRAME);
}

LZ4FrameCodec::~LZ4FrameCodec() {
  if (dctx_) {
    LZ4F_freeDecompressionContext(dctx_);
  }
#ifdef FOLLY_USE_LZ4_FAST_RESET
  if (cctx_) {
    LZ4F_freeCompressionContext(cctx_);
  }
#endif
}

std::unique_ptr<IOBuf> LZ4FrameCodec::doCompress(const IOBuf* data) {
  // LZ4 Frame compression doesn't support streaming so we have to coalesce
  IOBuf clone;
  if (data->isChained()) {
    clone = data->cloneCoalescedAsValue();
    data = &clone;
  }

#ifdef FOLLY_USE_LZ4_FAST_RESET
  if (!cctx_) {
    lz4FrameThrowOnError(LZ4F_createCompressionContext(&cctx_, LZ4F_VERSION));
  }
#endif

  // Set preferences
  const auto uncompressedLength = data->length();
  LZ4F_preferences_t prefs{};
  prefs.compressionLevel = level_;
  prefs.frameInfo.contentSize = uncompressedLength;
  // Compress
  auto buf = IOBuf::create(maxCompressedLength(uncompressedLength));
  const size_t written = lz4FrameThrowOnError(
#ifdef FOLLY_USE_LZ4_FAST_RESET
      LZ4F_compressFrame_usingCDict(
          cctx_,
          buf->writableTail(),
          buf->tailroom(),
          data->data(),
          data->length(),
          nullptr,
          &prefs)
#else
      LZ4F_compressFrame(
          buf->writableTail(),
          buf->tailroom(),
          data->data(),
          data->length(),
          &prefs)
#endif
  );
  buf->append(written);
  return buf;
}

std::unique_ptr<IOBuf> LZ4FrameCodec::doUncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) {
  // Reset the dctx if any errors have occurred
  resetDCtx();
  // Coalesce the data
  ByteRange in = *data->begin();
  IOBuf clone;
  if (data->isChained()) {
    clone = data->cloneCoalescedAsValue();
    in = clone.coalesce();
  }
  data = nullptr;
  // Select decompression options
  LZ4F_decompressOptions_t options;
  options.stableDst = 1;
  // Select blockSize and growthSize for the IOBufQueue
  IOBufQueue queue(IOBufQueue::cacheChainLength());
  auto blockSize = uint64_t{64} << 10;
  auto growthSize = uint64_t{4} << 20;
  if (uncompressedLength) {
    // Allocate uncompressedLength in one chunk (up to 64 MB)
    const auto allocateSize = std::min(*uncompressedLength, uint64_t{64} << 20);
    queue.preallocate(allocateSize, allocateSize);
    blockSize = std::min(*uncompressedLength, blockSize);
    growthSize = std::min(*uncompressedLength, growthSize);
  } else {
    // Reduce growthSize for small data
    const auto guessUncompressedLen =
        4 * std::max<uint64_t>(blockSize, in.size());
    growthSize = std::min(guessUncompressedLen, growthSize);
  }
  // Once LZ4_decompress() is called, the dctx_ cannot be reused until it
  // returns 0
  dirty_ = true;
  // Decompress until the frame is over
  size_t code = 0;
  do {
    // Allocate enough space to decompress at least a block
    void* out;
    size_t outSize;
    std::tie(out, outSize) = queue.preallocate(blockSize, growthSize);
    // Decompress
    size_t inSize = in.size();
    code = lz4FrameThrowOnError(
        LZ4F_decompress(dctx_, out, &outSize, in.data(), &inSize, &options));
    if (in.empty() && outSize == 0 && code != 0) {
      // We passed no input, no output was produced, and the frame isn't over
      // No more forward progress is possible
      throw std::runtime_error("LZ4Frame error: Incomplete frame");
    }
    in.uncheckedAdvance(inSize);
    queue.postallocate(outSize);
  } while (code != 0);
  // At this point the decompression context can be reused
  dirty_ = false;
  if (uncompressedLength && queue.chainLength() != *uncompressedLength) {
    throw std::runtime_error("LZ4Frame error: Invalid uncompressedLength");
  }
  return queue.move();
}

#endif // LZ4_VERSION_NUMBER >= 10301
#endif // FOLLY_HAVE_LIBLZ4

#if FOLLY_HAVE_LIBSNAPPY

/**
 * Snappy compression
 */

/**
 * Implementation of snappy::Source that reads from a IOBuf chain.
 */
class IOBufSnappySource final : public snappy::Source {
 public:
  explicit IOBufSnappySource(const IOBuf* data);
  size_t Available() const override;
  const char* Peek(size_t* len) override;
  void Skip(size_t n) override;

 private:
  size_t available_;
  io::Cursor cursor_;
};

IOBufSnappySource::IOBufSnappySource(const IOBuf* data)
    : available_(data->computeChainDataLength()), cursor_(data) {}

size_t IOBufSnappySource::Available() const {
  return available_;
}

const char* IOBufSnappySource::Peek(size_t* len) {
  auto sp = StringPiece{cursor_.peekBytes()};
  *len = sp.size();
  return sp.data();
}

void IOBufSnappySource::Skip(size_t n) {
  CHECK_LE(n, available_);
  cursor_.skip(n);
  available_ -= n;
}

class SnappyCodec final : public Codec {
 public:
  static std::unique_ptr<Codec> create(int level, CodecType type);
  explicit SnappyCodec(int level, CodecType type);

 private:
  uint64_t doMaxUncompressedLength() const override;
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;
  std::unique_ptr<IOBuf> doCompress(const IOBuf* data) override;
  std::unique_ptr<IOBuf> doUncompress(
      const IOBuf* data,
      Optional<uint64_t> uncompressedLength) override;
};

std::unique_ptr<Codec> SnappyCodec::create(int level, CodecType type) {
  return std::make_unique<SnappyCodec>(level, type);
}

SnappyCodec::SnappyCodec(int level, CodecType type) : Codec(type) {
  DCHECK(type == CodecType::SNAPPY);
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
    case COMPRESSION_LEVEL_DEFAULT:
    case COMPRESSION_LEVEL_BEST:
      level = 1;
  }
  if (level != 1) {
    throw std::invalid_argument(
        to<std::string>("SnappyCodec: invalid level: ", level));
  }
}

uint64_t SnappyCodec::doMaxUncompressedLength() const {
  // snappy.h uses uint32_t for lengths, so there's that.
  return std::numeric_limits<uint32_t>::max();
}

uint64_t SnappyCodec::doMaxCompressedLength(uint64_t uncompressedLength) const {
  return snappy::MaxCompressedLength(uncompressedLength);
}

std::unique_ptr<IOBuf> SnappyCodec::doCompress(const IOBuf* data) {
  IOBufSnappySource source(data);
  auto out = IOBuf::create(maxCompressedLength(source.Available()));

  snappy::UncheckedByteArraySink sink(
      reinterpret_cast<char*>(out->writableTail()));

  size_t n = snappy::Compress(&source, &sink);

  CHECK_LE(n, out->capacity());
  out->append(n);
  return out;
}

std::unique_ptr<IOBuf> SnappyCodec::doUncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) {
  uint32_t actualUncompressedLength = 0;

  {
    IOBufSnappySource source(data);
    if (!snappy::GetUncompressedLength(&source, &actualUncompressedLength)) {
      throw std::runtime_error("snappy::GetUncompressedLength failed");
    }
    if (uncompressedLength && *uncompressedLength != actualUncompressedLength) {
      throw std::runtime_error("snappy: invalid uncompressed length");
    }
  }

  auto out = IOBuf::create(actualUncompressedLength);

  {
    IOBufSnappySource source(data);
    if (!snappy::RawUncompress(
            &source, reinterpret_cast<char*>(out->writableTail()))) {
      throw std::runtime_error("snappy::RawUncompress failed");
    }
  }

  out->append(actualUncompressedLength);
  return out;
}

#endif // FOLLY_HAVE_LIBSNAPPY

#if FOLLY_HAVE_LIBLZMA

/**
 * LZMA2 compression
 */
class LZMA2StreamCodec final : public StreamCodec {
 public:
  static std::unique_ptr<Codec> createCodec(int level, CodecType type);
  static std::unique_ptr<StreamCodec> createStream(int level, CodecType type);
  explicit LZMA2StreamCodec(int level, CodecType type);
  ~LZMA2StreamCodec() override;

  std::vector<std::string> validPrefixes() const override;
  bool canUncompress(const IOBuf* data, Optional<uint64_t> uncompressedLength)
      const override;

 private:
  bool doNeedsDataLength() const override;
  uint64_t doMaxUncompressedLength() const override;
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;

  bool encodeSize() const {
    return type() == CodecType::LZMA2_VARINT_SIZE;
  }

  void doResetStream() override;
  bool doCompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flushOp) override;
  bool doUncompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flushOp) override;

  void resetCStream();
  void resetDStream();

  bool decodeAndCheckVarint(ByteRange& input);
  bool flushVarintBuffer(MutableByteRange& output);
  void resetVarintBuffer();

  Optional<lzma_stream> cstream_{};
  Optional<lzma_stream> dstream_{};

  std::array<uint8_t, kMaxVarintLength64> varintBuffer_;
  ByteRange varintToEncode_;
  size_t varintBufferPos_{0};

  int level_;
  bool needReset_{true};
  bool needDecodeSize_{false};
};

static constexpr uint64_t kLZMA2MagicLE = 0x005A587A37FD;
static constexpr unsigned kLZMA2MagicBytes = 6;

std::vector<std::string> LZMA2StreamCodec::validPrefixes() const {
  if (type() == CodecType::LZMA2_VARINT_SIZE) {
    return {};
  }
  return {prefixToStringLE(kLZMA2MagicLE, kLZMA2MagicBytes)};
}

bool LZMA2StreamCodec::doNeedsDataLength() const {
  return encodeSize();
}

bool LZMA2StreamCodec::canUncompress(const IOBuf* data, Optional<uint64_t>)
    const {
  if (type() == CodecType::LZMA2_VARINT_SIZE) {
    return false;
  }
  // Returns false for all inputs less than 8 bytes.
  // This is okay, because no valid LZMA2 streams are less than 8 bytes.
  return dataStartsWithLE(data, kLZMA2MagicLE, kLZMA2MagicBytes);
}

std::unique_ptr<Codec> LZMA2StreamCodec::createCodec(
    int level,
    CodecType type) {
  return make_unique<LZMA2StreamCodec>(level, type);
}

std::unique_ptr<StreamCodec> LZMA2StreamCodec::createStream(
    int level,
    CodecType type) {
  return make_unique<LZMA2StreamCodec>(level, type);
}

LZMA2StreamCodec::LZMA2StreamCodec(int level, CodecType type)
    : StreamCodec(type) {
  DCHECK(type == CodecType::LZMA2 || type == CodecType::LZMA2_VARINT_SIZE);
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
      level = 0;
      break;
    case COMPRESSION_LEVEL_DEFAULT:
      level = LZMA_PRESET_DEFAULT;
      break;
    case COMPRESSION_LEVEL_BEST:
      level = 9;
      break;
  }
  if (level < 0 || level > 9) {
    throw std::invalid_argument(
        to<std::string>("LZMA2Codec: invalid level: ", level));
  }
  level_ = level;
}

LZMA2StreamCodec::~LZMA2StreamCodec() {
  if (cstream_) {
    lzma_end(cstream_.get_pointer());
    cstream_.clear();
  }
  if (dstream_) {
    lzma_end(dstream_.get_pointer());
    dstream_.clear();
  }
}

uint64_t LZMA2StreamCodec::doMaxUncompressedLength() const {
  // From lzma/base.h: "Stream is roughly 8 EiB (2^63 bytes)"
  return uint64_t(1) << 63;
}

uint64_t LZMA2StreamCodec::doMaxCompressedLength(
    uint64_t uncompressedLength) const {
  return lzma_stream_buffer_bound(uncompressedLength) +
      (encodeSize() ? kMaxVarintLength64 : 0);
}

void LZMA2StreamCodec::doResetStream() {
  needReset_ = true;
}

void LZMA2StreamCodec::resetCStream() {
  if (!cstream_) {
    cstream_.assign(LZMA_STREAM_INIT);
  }
  lzma_ret const rc =
      lzma_easy_encoder(cstream_.get_pointer(), level_, LZMA_CHECK_NONE);
  if (rc != LZMA_OK) {
    throw std::runtime_error(folly::to<std::string>(
        "LZMA2StreamCodec: lzma_easy_encoder error: ", rc));
  }
}

void LZMA2StreamCodec::resetDStream() {
  if (!dstream_) {
    dstream_.assign(LZMA_STREAM_INIT);
  }
  lzma_ret const rc = lzma_auto_decoder(
      dstream_.get_pointer(), std::numeric_limits<uint64_t>::max(), 0);
  if (rc != LZMA_OK) {
    throw std::runtime_error(folly::to<std::string>(
        "LZMA2StreamCodec: lzma_auto_decoder error: ", rc));
  }
}

static lzma_ret lzmaThrowOnError(lzma_ret const rc) {
  switch (rc) {
    case LZMA_OK:
    case LZMA_STREAM_END:
    case LZMA_BUF_ERROR: // not fatal: returned if no progress was made twice
      return rc;
    default:
      throw std::runtime_error(
          to<std::string>("LZMA2StreamCodec: error: ", rc));
  }
}

static lzma_action lzmaTranslateFlush(StreamCodec::FlushOp flush) {
  switch (flush) {
    case StreamCodec::FlushOp::NONE:
      return LZMA_RUN;
    case StreamCodec::FlushOp::FLUSH:
      return LZMA_SYNC_FLUSH;
    case StreamCodec::FlushOp::END:
      return LZMA_FINISH;
    default:
      throw std::invalid_argument("LZMA2StreamCodec: Invalid flush");
  }
}

/**
 * Flushes the varint buffer.
 * Advances output by the number of bytes written.
 * Returns true when flushing is complete.
 */
bool LZMA2StreamCodec::flushVarintBuffer(MutableByteRange& output) {
  if (varintToEncode_.empty()) {
    return true;
  }
  const size_t numBytesToCopy = std::min(varintToEncode_.size(), output.size());
  if (numBytesToCopy > 0) {
    memcpy(output.data(), varintToEncode_.data(), numBytesToCopy);
  }
  varintToEncode_.advance(numBytesToCopy);
  output.advance(numBytesToCopy);
  return varintToEncode_.empty();
}

bool LZMA2StreamCodec::doCompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (needReset_) {
    resetCStream();
    if (encodeSize()) {
      varintBufferPos_ = 0;
      size_t const varintSize =
          encodeVarint(*uncompressedLength(), varintBuffer_.data());
      varintToEncode_ = {varintBuffer_.data(), varintSize};
    }
    needReset_ = false;
  }

  if (!flushVarintBuffer(output)) {
    return false;
  }

  cstream_->next_in = const_cast<uint8_t*>(input.data());
  cstream_->avail_in = input.size();
  cstream_->next_out = output.data();
  cstream_->avail_out = output.size();
  SCOPE_EXIT {
    input.uncheckedAdvance(input.size() - cstream_->avail_in);
    output.uncheckedAdvance(output.size() - cstream_->avail_out);
  };
  lzma_ret const rc = lzmaThrowOnError(
      lzma_code(cstream_.get_pointer(), lzmaTranslateFlush(flushOp)));
  switch (flushOp) {
    case StreamCodec::FlushOp::NONE:
      return false;
    case StreamCodec::FlushOp::FLUSH:
      return cstream_->avail_in == 0 && cstream_->avail_out != 0;
    case StreamCodec::FlushOp::END:
      return rc == LZMA_STREAM_END;
    default:
      throw std::invalid_argument("LZMA2StreamCodec: invalid FlushOp");
  }
}

/**
 * Attempts to decode a varint from input.
 * The function advances input by the number of bytes read.
 *
 * If there are too many bytes and the varint is not valid, throw a
 * runtime_error.
 *
 * If the uncompressed length was provided and a decoded varint does not match
 * the provided length, throw a runtime_error.
 *
 * Returns true if the varint was successfully decoded and matches the
 * uncompressed length if provided, and false if more bytes are needed.
 */
bool LZMA2StreamCodec::decodeAndCheckVarint(ByteRange& input) {
  if (input.empty()) {
    return false;
  }
  size_t const numBytesToCopy =
      std::min(kMaxVarintLength64 - varintBufferPos_, input.size());
  memcpy(varintBuffer_.data() + varintBufferPos_, input.data(), numBytesToCopy);

  size_t const rangeSize = varintBufferPos_ + numBytesToCopy;
  ByteRange range{varintBuffer_.data(), rangeSize};
  auto const ret = tryDecodeVarint(range);

  if (ret.hasValue()) {
    size_t const varintSize = rangeSize - range.size();
    input.advance(varintSize - varintBufferPos_);
    if (uncompressedLength() && *uncompressedLength() != ret.value()) {
      throw std::runtime_error("LZMA2StreamCodec: invalid uncompressed length");
    }
    return true;
  } else if (ret.error() == DecodeVarintError::TooManyBytes) {
    throw std::runtime_error("LZMA2StreamCodec: invalid uncompressed length");
  } else {
    // Too few bytes
    input.advance(numBytesToCopy);
    varintBufferPos_ += numBytesToCopy;
    return false;
  }
}

bool LZMA2StreamCodec::doUncompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (needReset_) {
    resetDStream();
    needReset_ = false;
    needDecodeSize_ = encodeSize();
    if (encodeSize()) {
      // Reset buffer
      varintBufferPos_ = 0;
    }
  }

  if (needDecodeSize_) {
    // Try decoding the varint. If the input does not contain the entire varint,
    // buffer the input. If the varint can not be decoded, fail.
    if (!decodeAndCheckVarint(input)) {
      return false;
    }
    needDecodeSize_ = false;
  }

  dstream_->next_in = const_cast<uint8_t*>(input.data());
  dstream_->avail_in = input.size();
  dstream_->next_out = output.data();
  dstream_->avail_out = output.size();
  SCOPE_EXIT {
    input.advance(input.size() - dstream_->avail_in);
    output.advance(output.size() - dstream_->avail_out);
  };

  lzma_ret rc;
  switch (flushOp) {
    case StreamCodec::FlushOp::NONE:
    case StreamCodec::FlushOp::FLUSH:
      rc = lzmaThrowOnError(lzma_code(dstream_.get_pointer(), LZMA_RUN));
      break;
    case StreamCodec::FlushOp::END:
      rc = lzmaThrowOnError(lzma_code(dstream_.get_pointer(), LZMA_FINISH));
      break;
    default:
      throw std::invalid_argument("LZMA2StreamCodec: invalid flush");
  }
  return rc == LZMA_STREAM_END;
}
#endif // FOLLY_HAVE_LIBLZMA

#if FOLLY_HAVE_LIBZSTD

static int zstdConvertLevel(int level) {
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
      return 1;
    case COMPRESSION_LEVEL_DEFAULT:
      return 1;
    case COMPRESSION_LEVEL_BEST:
      return 19;
  }
  if (level < 1 || level > ZSTD_maxCLevel()) {
    throw std::invalid_argument(
        to<std::string>("ZSTD: invalid level: ", level));
  }
  return level;
}

static int zstdFastConvertLevel(int level) {
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
      return -5;
    case COMPRESSION_LEVEL_DEFAULT:
      return -1;
    case COMPRESSION_LEVEL_BEST:
      return -1;
  }
  if (level < 1) {
    throw std::invalid_argument(
        to<std::string>("ZSTD: invalid level: ", level));
  }
  return -level;
}

std::unique_ptr<Codec> getZstdCodec(int level, CodecType type) {
  DCHECK(type == CodecType::ZSTD);
  return zstd::getCodec(zstd::Options(zstdConvertLevel(level)));
}

std::unique_ptr<StreamCodec> getZstdStreamCodec(int level, CodecType type) {
  DCHECK(type == CodecType::ZSTD);
  return zstd::getStreamCodec(zstd::Options(zstdConvertLevel(level)));
}

std::unique_ptr<Codec> getZstdFastCodec(int level, CodecType type) {
  DCHECK(type == CodecType::ZSTD_FAST);
  return zstd::getCodec(zstd::Options(zstdFastConvertLevel(level)));
}

std::unique_ptr<StreamCodec> getZstdFastStreamCodec(int level, CodecType type) {
  DCHECK(type == CodecType::ZSTD_FAST);
  return zstd::getStreamCodec(zstd::Options(zstdFastConvertLevel(level)));
}

#endif // FOLLY_HAVE_LIBZSTD

#if FOLLY_HAVE_LIBBZ2

class Bzip2StreamCodec final : public StreamCodec {
 public:
  static std::unique_ptr<Codec> createCodec(int level, CodecType type);
  static std::unique_ptr<StreamCodec> createStream(int level, CodecType type);
  explicit Bzip2StreamCodec(int level, CodecType type);

  ~Bzip2StreamCodec() override;

  std::vector<std::string> validPrefixes() const override;
  bool canUncompress(IOBuf const* data, Optional<uint64_t> uncompressedLength)
      const override;

 private:
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;

  void doResetStream() override;
  bool doCompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flushOp) override;
  bool doUncompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flushOp) override;

  void resetCStream();
  void resetDStream();

  Optional<bz_stream> cstream_{};
  Optional<bz_stream> dstream_{};

  int level_;
  bool needReset_{true};
};

/* static */ std::unique_ptr<Codec> Bzip2StreamCodec::createCodec(
    int level,
    CodecType type) {
  return createStream(level, type);
}

/* static */ std::unique_ptr<StreamCodec> Bzip2StreamCodec::createStream(
    int level,
    CodecType type) {
  return std::make_unique<Bzip2StreamCodec>(level, type);
}

Bzip2StreamCodec::Bzip2StreamCodec(int level, CodecType type)
    : StreamCodec(type) {
  DCHECK(type == CodecType::BZIP2);
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
      level = 1;
      break;
    case COMPRESSION_LEVEL_DEFAULT:
      level = 9;
      break;
    case COMPRESSION_LEVEL_BEST:
      level = 9;
      break;
  }
  if (level < 1 || level > 9) {
    throw std::invalid_argument(
        to<std::string>("Bzip2: invalid level: ", level));
  }
  level_ = level;
}

static uint32_t constexpr kBzip2MagicLE = 0x685a42;
static uint64_t constexpr kBzip2MagicBytes = 3;

std::vector<std::string> Bzip2StreamCodec::validPrefixes() const {
  return {prefixToStringLE(kBzip2MagicLE, kBzip2MagicBytes)};
}

bool Bzip2StreamCodec::canUncompress(IOBuf const* data, Optional<uint64_t>)
    const {
  return dataStartsWithLE(data, kBzip2MagicLE, kBzip2MagicBytes);
}

uint64_t Bzip2StreamCodec::doMaxCompressedLength(
    uint64_t uncompressedLength) const {
  // http://www.bzip.org/1.0.5/bzip2-manual-1.0.5.html#bzbufftobuffcompress
  //   To guarantee that the compressed data will fit in its buffer, allocate an
  //   output buffer of size 1% larger than the uncompressed data, plus six
  //   hundred extra bytes.
  return uncompressedLength + uncompressedLength / 100 + 600;
}

static bz_stream createBzStream() {
  bz_stream stream;
  stream.bzalloc = nullptr;
  stream.bzfree = nullptr;
  stream.opaque = nullptr;
  stream.next_in = stream.next_out = nullptr;
  stream.avail_in = stream.avail_out = 0;
  return stream;
}

// Throws on error condition, otherwise returns the code.
static int bzCheck(int const rc) {
  switch (rc) {
    case BZ_OK:
    case BZ_RUN_OK:
    case BZ_FLUSH_OK:
    case BZ_FINISH_OK:
    case BZ_STREAM_END:
    // Allow BZ_PARAM_ERROR.
    // It can get returned if no progress is made, but we handle that.
    case BZ_PARAM_ERROR:
      return rc;
    default:
      throw std::runtime_error(to<std::string>("Bzip2 error: ", rc));
  }
}

Bzip2StreamCodec::~Bzip2StreamCodec() {
  if (cstream_) {
    BZ2_bzCompressEnd(cstream_.get_pointer());
    cstream_.clear();
  }
  if (dstream_) {
    BZ2_bzDecompressEnd(dstream_.get_pointer());
    dstream_.clear();
  }
}

void Bzip2StreamCodec::doResetStream() {
  needReset_ = true;
}

void Bzip2StreamCodec::resetCStream() {
  if (cstream_) {
    BZ2_bzCompressEnd(cstream_.get_pointer());
  }
  cstream_ = createBzStream();
  bzCheck(BZ2_bzCompressInit(cstream_.get_pointer(), level_, 0, 0));
}

int bzip2TranslateFlush(StreamCodec::FlushOp flushOp) {
  switch (flushOp) {
    case StreamCodec::FlushOp::NONE:
      return BZ_RUN;
    case StreamCodec::FlushOp::END:
      return BZ_FINISH;
    case StreamCodec::FlushOp::FLUSH:
      throw std::invalid_argument(
          "Bzip2StreamCodec: FlushOp::FLUSH not supported");
    default:
      throw std::invalid_argument("Bzip2StreamCodec: Invalid flush");
  }
}

bool Bzip2StreamCodec::doCompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (needReset_) {
    resetCStream();
    needReset_ = false;
  }
  if (input.empty() && output.empty()) {
    return false;
  }

  cstream_->next_in =
      const_cast<char*>(reinterpret_cast<const char*>(input.data()));
  cstream_->avail_in = input.size();
  cstream_->next_out = reinterpret_cast<char*>(output.data());
  cstream_->avail_out = output.size();
  SCOPE_EXIT {
    input.uncheckedAdvance(input.size() - cstream_->avail_in);
    output.uncheckedAdvance(output.size() - cstream_->avail_out);
  };
  int const rc = bzCheck(
      BZ2_bzCompress(cstream_.get_pointer(), bzip2TranslateFlush(flushOp)));
  switch (flushOp) {
    case StreamCodec::FlushOp::NONE:
      return false;
    case StreamCodec::FlushOp::FLUSH:
      if (rc == BZ_RUN_OK) {
        DCHECK_EQ(cstream_->avail_in, 0);
        DCHECK(input.size() == 0 || cstream_->avail_out != output.size());
        return true;
      }
      return false;
    case StreamCodec::FlushOp::END:
      return rc == BZ_STREAM_END;
    default:
      throw std::invalid_argument("Bzip2StreamCodec: invalid FlushOp");
  }
  return false;
}

void Bzip2StreamCodec::resetDStream() {
  if (dstream_) {
    BZ2_bzDecompressEnd(dstream_.get_pointer());
  }
  dstream_ = createBzStream();
  bzCheck(BZ2_bzDecompressInit(dstream_.get_pointer(), 0, 0));
}

bool Bzip2StreamCodec::doUncompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (flushOp == StreamCodec::FlushOp::FLUSH) {
    throw std::invalid_argument(
        "Bzip2StreamCodec: FlushOp::FLUSH not supported");
  }
  if (needReset_) {
    resetDStream();
    needReset_ = false;
  }

  dstream_->next_in =
      const_cast<char*>(reinterpret_cast<const char*>(input.data()));
  dstream_->avail_in = input.size();
  dstream_->next_out = reinterpret_cast<char*>(output.data());
  dstream_->avail_out = output.size();
  SCOPE_EXIT {
    input.uncheckedAdvance(input.size() - dstream_->avail_in);
    output.uncheckedAdvance(output.size() - dstream_->avail_out);
  };
  int const rc = bzCheck(BZ2_bzDecompress(dstream_.get_pointer()));
  return rc == BZ_STREAM_END;
}

#endif // FOLLY_HAVE_LIBBZ2

#if FOLLY_HAVE_LIBZ

zlib::Options getZlibOptions(CodecType type) {
  DCHECK(type == CodecType::GZIP || type == CodecType::ZLIB);
  return type == CodecType::GZIP ? zlib::defaultGzipOptions()
                                 : zlib::defaultZlibOptions();
}

std::unique_ptr<Codec> getZlibCodec(int level, CodecType type) {
  return zlib::getCodec(getZlibOptions(type), level);
}

std::unique_ptr<StreamCodec> getZlibStreamCodec(int level, CodecType type) {
  return zlib::getStreamCodec(getZlibOptions(type), level);
}

#endif // FOLLY_HAVE_LIBZ

/**
 * Automatic decompression
 */
class AutomaticCodec final : public Codec {
 public:
  static std::unique_ptr<Codec> create(
      std::vector<std::unique_ptr<Codec>> customCodecs,
      std::unique_ptr<Codec> terminalCodec);
  explicit AutomaticCodec(
      std::vector<std::unique_ptr<Codec>> customCodecs,
      std::unique_ptr<Codec> terminalCodec);

  std::vector<std::string> validPrefixes() const override;
  bool canUncompress(const IOBuf* data, Optional<uint64_t> uncompressedLength)
      const override;

 private:
  bool doNeedsUncompressedLength() const override;
  uint64_t doMaxUncompressedLength() const override;

  uint64_t doMaxCompressedLength(uint64_t) const override {
    throw std::runtime_error(
        "AutomaticCodec error: maxCompressedLength() not supported.");
  }
  std::unique_ptr<IOBuf> doCompress(const IOBuf*) override {
    throw std::runtime_error("AutomaticCodec error: compress() not supported.");
  }
  std::unique_ptr<IOBuf> doUncompress(
      const IOBuf* data,
      Optional<uint64_t> uncompressedLength) override;

  void addCodecIfSupported(CodecType type);

  // Throws iff the codecs aren't compatible (very slow)
  void checkCompatibleCodecs() const;

  std::vector<std::unique_ptr<Codec>> codecs_;
  std::unique_ptr<Codec> terminalCodec_;
  bool needsUncompressedLength_;
  uint64_t maxUncompressedLength_;
};

std::vector<std::string> AutomaticCodec::validPrefixes() const {
  std::unordered_set<std::string> prefixes;
  for (const auto& codec : codecs_) {
    const auto codecPrefixes = codec->validPrefixes();
    prefixes.insert(codecPrefixes.begin(), codecPrefixes.end());
  }
  return std::vector<std::string>{prefixes.begin(), prefixes.end()};
}

bool AutomaticCodec::canUncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) const {
  return std::any_of(
      codecs_.begin(),
      codecs_.end(),
      [data, uncompressedLength](std::unique_ptr<Codec> const& codec) {
        return codec->canUncompress(data, uncompressedLength);
      });
}

void AutomaticCodec::addCodecIfSupported(CodecType type) {
  const bool present = std::any_of(
      codecs_.begin(),
      codecs_.end(),
      [&type](std::unique_ptr<Codec> const& codec) {
        return codec->type() == type;
      });
  bool const isTerminalType = terminalCodec_ && terminalCodec_->type() == type;
  if (hasCodec(type) && !present && !isTerminalType) {
    codecs_.push_back(getCodec(type));
  }
}

/* static */ std::unique_ptr<Codec> AutomaticCodec::create(
    std::vector<std::unique_ptr<Codec>> customCodecs,
    std::unique_ptr<Codec> terminalCodec) {
  return std::make_unique<AutomaticCodec>(
      std::move(customCodecs), std::move(terminalCodec));
}

AutomaticCodec::AutomaticCodec(
    std::vector<std::unique_ptr<Codec>> customCodecs,
    std::unique_ptr<Codec> terminalCodec)
    : Codec(CodecType::USER_DEFINED, folly::none, "auto"),
      codecs_(std::move(customCodecs)),
      terminalCodec_(std::move(terminalCodec)) {
  // Fastest -> slowest
  std::array<CodecType, 6> defaultTypes{{
      CodecType::LZ4_FRAME,
      CodecType::ZSTD,
      CodecType::ZLIB,
      CodecType::GZIP,
      CodecType::LZMA2,
      CodecType::BZIP2,
  }};

  for (auto type : defaultTypes) {
    addCodecIfSupported(type);
  }

  if (kIsDebug) {
    checkCompatibleCodecs();
  }

  // Check that none of the codecs are null
  DCHECK(std::none_of(
      codecs_.begin(), codecs_.end(), [](std::unique_ptr<Codec> const& codec) {
        return codec == nullptr;
      }));

  // Check that the terminal codec's type is not duplicated (with the exception
  // of USER_DEFINED).
  if (terminalCodec_) {
    DCHECK(std::none_of(
        codecs_.begin(),
        codecs_.end(),
        [&](std::unique_ptr<Codec> const& codec) {
          return codec->type() != CodecType::USER_DEFINED &&
              codec->type() == terminalCodec_->type();
        }));
  }

  bool const terminalNeedsUncompressedLength =
      terminalCodec_ && terminalCodec_->needsUncompressedLength();
  needsUncompressedLength_ = std::any_of(
                                 codecs_.begin(),
                                 codecs_.end(),
                                 [](std::unique_ptr<Codec> const& codec) {
                                   return codec->needsUncompressedLength();
                                 }) ||
      terminalNeedsUncompressedLength;

  const auto it = std::max_element(
      codecs_.begin(),
      codecs_.end(),
      [](std::unique_ptr<Codec> const& lhs, std::unique_ptr<Codec> const& rhs) {
        return lhs->maxUncompressedLength() < rhs->maxUncompressedLength();
      });
  DCHECK(it != codecs_.end());
  auto const terminalMaxUncompressedLength =
      terminalCodec_ ? terminalCodec_->maxUncompressedLength() : 0;
  maxUncompressedLength_ =
      std::max((*it)->maxUncompressedLength(), terminalMaxUncompressedLength);
}

void AutomaticCodec::checkCompatibleCodecs() const {
  // Keep track of all the possible headers.
  std::unordered_set<std::string> headers;
  // The empty header is not allowed.
  headers.insert("");
  // Step 1:
  // Construct a set of headers and check that none of the headers occur twice.
  // Eliminate edge cases.
  for (auto&& codec : codecs_) {
    const auto codecHeaders = codec->validPrefixes();
    // Codecs without any valid headers are not allowed.
    if (codecHeaders.empty()) {
      throw std::invalid_argument{
          "AutomaticCodec: validPrefixes() must not be empty."};
    }
    // Insert all the headers for the current codec.
    const size_t beforeSize = headers.size();
    headers.insert(codecHeaders.begin(), codecHeaders.end());
    // Codecs are not compatible if any header occurred twice.
    if (beforeSize + codecHeaders.size() != headers.size()) {
      throw std::invalid_argument{
          "AutomaticCodec: Two valid prefixes collide."};
    }
  }
  // Step 2:
  // Check if any strict non-empty prefix of any header is a header.
  for (const auto& header : headers) {
    for (size_t i = 1; i < header.size(); ++i) {
      if (headers.count(header.substr(0, i))) {
        throw std::invalid_argument{
            "AutomaticCodec: One valid prefix is a prefix of another valid "
            "prefix."};
      }
    }
  }
}

bool AutomaticCodec::doNeedsUncompressedLength() const {
  return needsUncompressedLength_;
}

uint64_t AutomaticCodec::doMaxUncompressedLength() const {
  return maxUncompressedLength_;
}

std::unique_ptr<IOBuf> AutomaticCodec::doUncompress(
    const IOBuf* data,
    Optional<uint64_t> uncompressedLength) {
  try {
    for (auto&& codec : codecs_) {
      if (codec->canUncompress(data, uncompressedLength)) {
        return codec->uncompress(data, uncompressedLength);
      }
    }
  } catch (std::exception const& e) {
    if (!terminalCodec_) {
      throw e;
    }
  }

  // Try terminal codec
  if (terminalCodec_) {
    return terminalCodec_->uncompress(data, uncompressedLength);
  }

  throw std::runtime_error("AutomaticCodec error: Unknown compressed data");
}

using CodecFactory = std::unique_ptr<Codec> (*)(int, CodecType);
using StreamCodecFactory = std::unique_ptr<StreamCodec> (*)(int, CodecType);
struct Factory {
  CodecFactory codec;
  StreamCodecFactory stream;
};

constexpr Factory
    codecFactories[static_cast<size_t>(CodecType::NUM_CODEC_TYPES)] = {
        {}, // USER_DEFINED
        {NoCompressionCodec::create, nullptr},

#if FOLLY_HAVE_LIBLZ4
        {LZ4Codec::create, nullptr},
#else
        {},
#endif

#if FOLLY_HAVE_LIBSNAPPY
        {SnappyCodec::create, nullptr},
#else
        {},
#endif

#if FOLLY_HAVE_LIBZ
        {getZlibCodec, getZlibStreamCodec},
#else
        {},
#endif

#if FOLLY_HAVE_LIBLZ4
        {LZ4Codec::create, nullptr},
#else
        {},
#endif

#if FOLLY_HAVE_LIBLZMA
        {LZMA2StreamCodec::createCodec, LZMA2StreamCodec::createStream},
        {LZMA2StreamCodec::createCodec, LZMA2StreamCodec::createStream},
#else
        {},
        {},
#endif

#if FOLLY_HAVE_LIBZSTD
        {getZstdCodec, getZstdStreamCodec},
#else
        {},
#endif

#if FOLLY_HAVE_LIBZ
        {getZlibCodec, getZlibStreamCodec},
#else
        {},
#endif

#if (FOLLY_HAVE_LIBLZ4 && LZ4_VERSION_NUMBER >= 10301)
        {LZ4FrameCodec::create, nullptr},
#else
        {},
#endif

#if FOLLY_HAVE_LIBBZ2
        {Bzip2StreamCodec::createCodec, Bzip2StreamCodec::createStream},
#else
        {},
#endif

#if FOLLY_HAVE_LIBZSTD
        {getZstdFastCodec, getZstdFastStreamCodec},
#else
        {},
#endif
};

Factory const& getFactory(CodecType type) {
  size_t const idx = static_cast<size_t>(type);
  if (idx >= static_cast<size_t>(CodecType::NUM_CODEC_TYPES)) {
    throw std::invalid_argument(
        to<std::string>("Compression type ", idx, " invalid"));
  }
  return codecFactories[idx];
}
} // namespace

bool hasCodec(CodecType type) {
  return getFactory(type).codec != nullptr;
}

std::unique_ptr<Codec> getCodec(CodecType type, int level) {
  auto const factory = getFactory(type).codec;
  if (!factory) {
    throw std::invalid_argument(
        to<std::string>("Compression type ", type, " not supported"));
  }
  auto codec = (*factory)(level, type);
  DCHECK(codec->type() == type);
  return codec;
}

bool hasStreamCodec(CodecType type) {
  return getFactory(type).stream != nullptr;
}

std::unique_ptr<StreamCodec> getStreamCodec(CodecType type, int level) {
  auto const factory = getFactory(type).stream;
  if (!factory) {
    throw std::invalid_argument(
        to<std::string>("Compression type ", type, " not supported"));
  }
  auto codec = (*factory)(level, type);
  DCHECK(codec->type() == type);
  return codec;
}

std::unique_ptr<Codec> getAutoUncompressionCodec(
    std::vector<std::unique_ptr<Codec>> customCodecs,
    std::unique_ptr<Codec> terminalCodec) {
  return AutomaticCodec::create(
      std::move(customCodecs), std::move(terminalCodec));
}
} // namespace io
} // namespace folly
