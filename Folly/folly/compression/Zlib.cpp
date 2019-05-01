/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/compression/Zlib.h>

#if FOLLY_HAVE_LIBZ

#include <folly/Conv.h>
#include <folly/Optional.h>
#include <folly/Range.h>
#include <folly/ScopeGuard.h>
#include <folly/compression/Compression.h>
#include <folly/compression/Utils.h>
#include <folly/io/Cursor.h>

using folly::io::compression::detail::dataStartsWithLE;
using folly::io::compression::detail::prefixToStringLE;

namespace folly {
namespace io {
namespace zlib {

namespace {

bool isValidStrategy(int strategy) {
  std::array<int, 5> strategies{{
      Z_DEFAULT_STRATEGY,
      Z_FILTERED,
      Z_HUFFMAN_ONLY,
      Z_RLE,
      Z_FIXED,
  }};
  return std::any_of(strategies.begin(), strategies.end(), [&](int i) {
    return i == strategy;
  });
}

int getWindowBits(Options::Format format, int windowSize) {
  switch (format) {
    case Options::Format::ZLIB:
      return windowSize;
    case Options::Format::GZIP:
      return windowSize + 16;
    case Options::Format::RAW:
      return -windowSize;
    case Options::Format::AUTO:
      return windowSize + 32;
    default:
      return windowSize;
  }
}

CodecType getCodecType(Options options) {
  if (options.windowSize == 15 && options.format == Options::Format::ZLIB) {
    return CodecType::ZLIB;
  } else if (
      options.windowSize == 15 && options.format == Options::Format::GZIP) {
    return CodecType::GZIP;
  } else {
    return CodecType::USER_DEFINED;
  }
}

class ZlibStreamCodec final : public StreamCodec {
 public:
  static std::unique_ptr<Codec> createCodec(Options options, int level);
  static std::unique_ptr<StreamCodec> createStream(Options options, int level);

  explicit ZlibStreamCodec(Options options, int level);
  ~ZlibStreamCodec() override;

  std::vector<std::string> validPrefixes() const override;
  bool canUncompress(const IOBuf* data, Optional<uint64_t> uncompressedLength)
      const override;

 private:
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;

  void doResetStream() override;
  bool doCompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flush) override;
  bool doUncompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flush) override;

  void resetDeflateStream();
  void resetInflateStream();

  Options options_;

  Optional<z_stream> deflateStream_{};
  Optional<z_stream> inflateStream_{};
  int level_;
  bool needReset_{true};
};
static constexpr uint16_t kGZIPMagicLE = 0x8B1F;

std::vector<std::string> ZlibStreamCodec::validPrefixes() const {
  if (type() == CodecType::ZLIB) {
    // Zlib streams start with a 2 byte header.
    //
    //   0   1
    // +---+---+
    // |CMF|FLG|
    // +---+---+
    //
    // We won't restrict the values of any sub-fields except as described below.
    //
    // The lowest 4 bits of CMF is the compression method (CM).
    // CM == 0x8 is the deflate compression method, which is currently the only
    // supported compression method, so any valid prefix must have CM == 0x8.
    //
    // The lowest 5 bits of FLG is FCHECK.
    // FCHECK must be such that the two header bytes are a multiple of 31 when
    // interpreted as a big endian 16-bit number.
    std::vector<std::string> result;
    // 16 values for the first byte, 8 values for the second byte.
    // There are also 4 combinations where both 0x00 and 0x1F work as FCHECK.
    result.reserve(132);
    // Select all values for the CMF byte that use the deflate algorithm 0x8.
    for (uint32_t first = 0x0800; first <= 0xF800; first += 0x1000) {
      // Select all values for the FLG, but leave FCHECK as 0 since it's fixed.
      for (uint32_t second = 0x00; second <= 0xE0; second += 0x20) {
        uint16_t prefix = first | second;
        // Compute FCHECK.
        prefix += 31 - (prefix % 31);
        result.push_back(prefixToStringLE(Endian::big(prefix)));
        // zlib won't produce this, but it is a valid prefix.
        if ((prefix & 0x1F) == 31) {
          prefix -= 31;
          result.push_back(prefixToStringLE(Endian::big(prefix)));
        }
      }
    }
    return result;
  } else if (type() == CodecType::GZIP) {
    // The gzip frame starts with 2 magic bytes.
    return {prefixToStringLE(kGZIPMagicLE)};
  } else {
    return {};
  }
}

bool ZlibStreamCodec::canUncompress(const IOBuf* data, Optional<uint64_t>)
    const {
  if (type() == CodecType::ZLIB) {
    uint16_t value;
    Cursor cursor{data};
    if (!cursor.tryReadBE(value)) {
      return false;
    }
    // zlib compressed if using deflate and is a multiple of 31.
    return (value & 0x0F00) == 0x0800 && value % 31 == 0;
  } else if (type() == CodecType::GZIP) {
    return dataStartsWithLE(data, kGZIPMagicLE);
  } else {
    return false;
  }
}

uint64_t ZlibStreamCodec::doMaxCompressedLength(
    uint64_t uncompressedLength) const {
  // When passed a nullptr, deflateBound() adds 6 bytes for a zlib wrapper. A
  // gzip wrapper is 18 bytes, so we add the 12 byte difference.
  return deflateBound(nullptr, uncompressedLength) +
      (options_.format == Options::Format::GZIP ? 12 : 0);
}

std::unique_ptr<Codec> ZlibStreamCodec::createCodec(
    Options options,
    int level) {
  return std::make_unique<ZlibStreamCodec>(options, level);
}

std::unique_ptr<StreamCodec> ZlibStreamCodec::createStream(
    Options options,
    int level) {
  return std::make_unique<ZlibStreamCodec>(options, level);
}

static bool inBounds(int value, int low, int high) {
  return (value >= low) && (value <= high);
}

static int zlibConvertLevel(int level) {
  switch (level) {
    case COMPRESSION_LEVEL_FASTEST:
      return 1;
    case COMPRESSION_LEVEL_DEFAULT:
      return 6;
    case COMPRESSION_LEVEL_BEST:
      return 9;
  }
  if (!inBounds(level, 0, 9)) {
    throw std::invalid_argument(
        to<std::string>("ZlibStreamCodec: invalid level: ", level));
  }
  return level;
}

ZlibStreamCodec::ZlibStreamCodec(Options options, int level)
    : StreamCodec(
          getCodecType(options),
          zlibConvertLevel(level),
          getCodecType(options) == CodecType::GZIP ? "gzip" : "zlib"),
      level_(zlibConvertLevel(level)) {
  options_ = options;

  // Although zlib allows a windowSize of 8..15, a value of 8 is not
  // properly supported and is treated as a value of 9. This means data deflated
  // with windowSize==8 can not be re-inflated with windowSize==8. windowSize==8
  // is also not supported for gzip and raw deflation.
  // Hence, the codec supports only 9..15.
  if (!inBounds(options_.windowSize, 9, 15)) {
    throw std::invalid_argument(to<std::string>(
        "ZlibStreamCodec: invalid windowSize option: ", options.windowSize));
  }
  if (!inBounds(options_.memLevel, 1, 9)) {
    throw std::invalid_argument(to<std::string>(
        "ZlibStreamCodec: invalid memLevel option: ", options.memLevel));
  }
  if (!isValidStrategy(options_.strategy)) {
    throw std::invalid_argument(to<std::string>(
        "ZlibStreamCodec: invalid strategy: ", options.strategy));
  }
}

ZlibStreamCodec::~ZlibStreamCodec() {
  if (deflateStream_) {
    deflateEnd(deflateStream_.get_pointer());
    deflateStream_.clear();
  }
  if (inflateStream_) {
    inflateEnd(inflateStream_.get_pointer());
    inflateStream_.clear();
  }
}

void ZlibStreamCodec::doResetStream() {
  needReset_ = true;
}

void ZlibStreamCodec::resetDeflateStream() {
  if (deflateStream_) {
    int const rc = deflateReset(deflateStream_.get_pointer());
    if (rc != Z_OK) {
      deflateStream_.clear();
      throw std::runtime_error(
          to<std::string>("ZlibStreamCodec: deflateReset error: ", rc));
    }
    return;
  }
  deflateStream_ = z_stream{};

  // The automatic header detection format is only for inflation.
  // Use zlib for deflation if the format is auto.
  int const windowBits = getWindowBits(
      options_.format == Options::Format::AUTO ? Options::Format::ZLIB
                                               : options_.format,
      options_.windowSize);

  int const rc = deflateInit2(
      deflateStream_.get_pointer(),
      level_,
      Z_DEFLATED,
      windowBits,
      options_.memLevel,
      options_.strategy);
  if (rc != Z_OK) {
    deflateStream_.clear();
    throw std::runtime_error(
        to<std::string>("ZlibStreamCodec: deflateInit error: ", rc));
  }
}

void ZlibStreamCodec::resetInflateStream() {
  if (inflateStream_) {
    int const rc = inflateReset(inflateStream_.get_pointer());
    if (rc != Z_OK) {
      inflateStream_.clear();
      throw std::runtime_error(
          to<std::string>("ZlibStreamCodec: inflateReset error: ", rc));
    }
    return;
  }
  inflateStream_ = z_stream{};
  int const rc = inflateInit2(
      inflateStream_.get_pointer(),
      getWindowBits(options_.format, options_.windowSize));
  if (rc != Z_OK) {
    inflateStream_.clear();
    throw std::runtime_error(
        to<std::string>("ZlibStreamCodec: inflateInit error: ", rc));
  }
}

static int zlibTranslateFlush(StreamCodec::FlushOp flush) {
  switch (flush) {
    case StreamCodec::FlushOp::NONE:
      return Z_NO_FLUSH;
    case StreamCodec::FlushOp::FLUSH:
      return Z_SYNC_FLUSH;
    case StreamCodec::FlushOp::END:
      return Z_FINISH;
    default:
      throw std::invalid_argument("ZlibStreamCodec: Invalid flush");
  }
}

static int zlibThrowOnError(int rc) {
  switch (rc) {
    case Z_OK:
    case Z_BUF_ERROR:
    case Z_STREAM_END:
      return rc;
    default:
      throw std::runtime_error(to<std::string>("ZlibStreamCodec: error: ", rc));
  }
}

bool ZlibStreamCodec::doCompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flush) {
  if (needReset_) {
    resetDeflateStream();
    needReset_ = false;
  }
  DCHECK(deflateStream_.hasValue());
  // zlib will return Z_STREAM_ERROR if output.data() is null.
  if (output.data() == nullptr) {
    return false;
  }
  deflateStream_->next_in = const_cast<uint8_t*>(input.data());
  deflateStream_->avail_in = input.size();
  deflateStream_->next_out = output.data();
  deflateStream_->avail_out = output.size();
  SCOPE_EXIT {
    input.uncheckedAdvance(input.size() - deflateStream_->avail_in);
    output.uncheckedAdvance(output.size() - deflateStream_->avail_out);
  };
  int const rc = zlibThrowOnError(
      deflate(deflateStream_.get_pointer(), zlibTranslateFlush(flush)));
  switch (flush) {
    case StreamCodec::FlushOp::NONE:
      return false;
    case StreamCodec::FlushOp::FLUSH:
      return deflateStream_->avail_in == 0 && deflateStream_->avail_out != 0;
    case StreamCodec::FlushOp::END:
      return rc == Z_STREAM_END;
    default:
      throw std::invalid_argument("ZlibStreamCodec: Invalid flush");
  }
}

bool ZlibStreamCodec::doUncompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flush) {
  if (needReset_) {
    resetInflateStream();
    needReset_ = false;
  }
  DCHECK(inflateStream_.hasValue());
  // zlib will return Z_STREAM_ERROR if output.data() is null.
  if (output.data() == nullptr) {
    return false;
  }
  inflateStream_->next_in = const_cast<uint8_t*>(input.data());
  inflateStream_->avail_in = input.size();
  inflateStream_->next_out = output.data();
  inflateStream_->avail_out = output.size();
  SCOPE_EXIT {
    input.advance(input.size() - inflateStream_->avail_in);
    output.advance(output.size() - inflateStream_->avail_out);
  };
  int const rc = zlibThrowOnError(
      inflate(inflateStream_.get_pointer(), zlibTranslateFlush(flush)));
  return rc == Z_STREAM_END;
}

} // namespace

Options defaultGzipOptions() {
  return Options(Options::Format::GZIP);
}

Options defaultZlibOptions() {
  return Options(Options::Format::ZLIB);
}

std::unique_ptr<Codec> getCodec(Options options, int level) {
  return ZlibStreamCodec::createCodec(options, level);
}

std::unique_ptr<StreamCodec> getStreamCodec(Options options, int level) {
  return ZlibStreamCodec::createStream(options, level);
}

} // namespace zlib
} // namespace io
} // namespace folly

#endif // FOLLY_HAVE_LIBZ
