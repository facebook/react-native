/*
 * Copyright 2018-present Facebook, Inc.
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
#include <folly/compression/Zstd.h>

#if FOLLY_HAVE_LIBZSTD

#include <stdexcept>
#include <string>

#include <zstd.h>

#include <folly/Conv.h>
#include <folly/Range.h>
#include <folly/ScopeGuard.h>
#include <folly/compression/Utils.h>

static_assert(
    ZSTD_VERSION_NUMBER >= 10302,
    "zstd-1.3.2 is the minimum supported zstd version.");

using folly::io::compression::detail::dataStartsWithLE;
using folly::io::compression::detail::prefixToStringLE;

namespace folly {
namespace io {
namespace zstd {
namespace {

void zstdFreeCCtx(ZSTD_CCtx* zc) {
  ZSTD_freeCCtx(zc);
}

void zstdFreeDCtx(ZSTD_DCtx* zd) {
  ZSTD_freeDCtx(zd);
}

size_t zstdThrowIfError(size_t rc) {
  if (!ZSTD_isError(rc)) {
    return rc;
  }
  throw std::runtime_error(
      to<std::string>("ZSTD returned an error: ", ZSTD_getErrorName(rc)));
}

ZSTD_EndDirective zstdTranslateFlush(StreamCodec::FlushOp flush) {
  switch (flush) {
    case StreamCodec::FlushOp::NONE:
      return ZSTD_e_continue;
    case StreamCodec::FlushOp::FLUSH:
      return ZSTD_e_flush;
    case StreamCodec::FlushOp::END:
      return ZSTD_e_end;
    default:
      throw std::invalid_argument("ZSTDStreamCodec: Invalid flush");
  }
}

class ZSTDStreamCodec final : public StreamCodec {
 public:
  explicit ZSTDStreamCodec(Options options);

  std::vector<std::string> validPrefixes() const override;
  bool canUncompress(const IOBuf* data, Optional<uint64_t> uncompressedLength)
      const override;

 private:
  bool doNeedsUncompressedLength() const override;
  uint64_t doMaxCompressedLength(uint64_t uncompressedLength) const override;
  Optional<uint64_t> doGetUncompressedLength(
      IOBuf const* data,
      Optional<uint64_t> uncompressedLength) const override;

  void doResetStream() override;
  bool doCompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flushOp) override;
  bool doUncompressStream(
      ByteRange& input,
      MutableByteRange& output,
      StreamCodec::FlushOp flushOp) override;

  void resetCCtx();
  void resetDCtx();

  Options options_;
  bool needReset_{true};
  std::unique_ptr<
      ZSTD_CCtx,
      folly::static_function_deleter<ZSTD_CCtx, &zstdFreeCCtx>>
      cctx_{nullptr};
  std::unique_ptr<
      ZSTD_DCtx,
      folly::static_function_deleter<ZSTD_DCtx, &zstdFreeDCtx>>
      dctx_{nullptr};
};

constexpr uint32_t kZSTDMagicLE = 0xFD2FB528;

std::vector<std::string> ZSTDStreamCodec::validPrefixes() const {
  return {prefixToStringLE(kZSTDMagicLE)};
}

bool ZSTDStreamCodec::canUncompress(const IOBuf* data, Optional<uint64_t>)
    const {
  return dataStartsWithLE(data, kZSTDMagicLE);
}

CodecType codecType(Options const& options) {
  int const level = options.level();
  DCHECK_NE(level, 0);
  return level > 0 ? CodecType::ZSTD : CodecType::ZSTD_FAST;
}

ZSTDStreamCodec::ZSTDStreamCodec(Options options)
    : StreamCodec(codecType(options), options.level()),
      options_(std::move(options)) {}

bool ZSTDStreamCodec::doNeedsUncompressedLength() const {
  return false;
}

uint64_t ZSTDStreamCodec::doMaxCompressedLength(
    uint64_t uncompressedLength) const {
  return ZSTD_compressBound(uncompressedLength);
}

Optional<uint64_t> ZSTDStreamCodec::doGetUncompressedLength(
    IOBuf const* data,
    Optional<uint64_t> uncompressedLength) const {
  // Read decompressed size from frame if available in first IOBuf.
  auto const decompressedSize =
      ZSTD_getFrameContentSize(data->data(), data->length());
  if (decompressedSize == ZSTD_CONTENTSIZE_UNKNOWN ||
      decompressedSize == ZSTD_CONTENTSIZE_ERROR) {
    return uncompressedLength;
  }
  if (uncompressedLength && *uncompressedLength != decompressedSize) {
    throw std::runtime_error("ZSTD: invalid uncompressed length");
  }
  return decompressedSize;
}

void ZSTDStreamCodec::doResetStream() {
  needReset_ = true;
}

void ZSTDStreamCodec::resetCCtx() {
  if (!cctx_) {
    cctx_.reset(ZSTD_createCCtx());
    if (!cctx_) {
      throw std::bad_alloc{};
    }
  }
  ZSTD_CCtx_reset(cctx_.get());
  zstdThrowIfError(
      ZSTD_CCtx_setParametersUsingCCtxParams(cctx_.get(), options_.params()));
  zstdThrowIfError(ZSTD_CCtx_setPledgedSrcSize(
      cctx_.get(), uncompressedLength().value_or(ZSTD_CONTENTSIZE_UNKNOWN)));
}

bool ZSTDStreamCodec::doCompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp flushOp) {
  if (needReset_) {
    resetCCtx();
    needReset_ = false;
  }
  ZSTD_inBuffer in = {input.data(), input.size(), 0};
  ZSTD_outBuffer out = {output.data(), output.size(), 0};
  SCOPE_EXIT {
    input.uncheckedAdvance(in.pos);
    output.uncheckedAdvance(out.pos);
  };
  size_t const rc = zstdThrowIfError(ZSTD_compress_generic(
      cctx_.get(), &out, &in, zstdTranslateFlush(flushOp)));
  switch (flushOp) {
    case StreamCodec::FlushOp::NONE:
      return false;
    case StreamCodec::FlushOp::FLUSH:
    case StreamCodec::FlushOp::END:
      return rc == 0;
    default:
      throw std::invalid_argument("ZSTD: invalid FlushOp");
  }
}

void ZSTDStreamCodec::resetDCtx() {
  if (!dctx_) {
    dctx_.reset(ZSTD_createDCtx());
    if (!dctx_) {
      throw std::bad_alloc{};
    }
  }
  ZSTD_DCtx_reset(dctx_.get());
  if (options_.maxWindowSize() != 0) {
    zstdThrowIfError(
        ZSTD_DCtx_setMaxWindowSize(dctx_.get(), options_.maxWindowSize()));
  }
}

bool ZSTDStreamCodec::doUncompressStream(
    ByteRange& input,
    MutableByteRange& output,
    StreamCodec::FlushOp) {
  if (needReset_) {
    resetDCtx();
    needReset_ = false;
  }
  ZSTD_inBuffer in = {input.data(), input.size(), 0};
  ZSTD_outBuffer out = {output.data(), output.size(), 0};
  SCOPE_EXIT {
    input.uncheckedAdvance(in.pos);
    output.uncheckedAdvance(out.pos);
  };
  size_t const rc =
      zstdThrowIfError(ZSTD_decompress_generic(dctx_.get(), &out, &in));
  return rc == 0;
}

} // namespace

Options::Options(int level) : params_(ZSTD_createCCtxParams()), level_(level) {
  if (params_ == nullptr) {
    throw std::bad_alloc{};
  }
#if ZSTD_VERSION_NUMBER >= 10304
  zstdThrowIfError(ZSTD_CCtxParams_init(params_.get(), level));
#else
  zstdThrowIfError(ZSTD_initCCtxParams(params_.get(), level));
  set(ZSTD_p_contentSizeFlag, 1);
#endif
  // zstd-1.3.4 is buggy and only disables Huffman decompression for negative
  // compression levels if this call is present. This call is begign in other
  // versions.
  set(ZSTD_p_compressionLevel, level);
}

void Options::set(ZSTD_cParameter param, unsigned value) {
  zstdThrowIfError(ZSTD_CCtxParam_setParameter(params_.get(), param, value));
  if (param == ZSTD_p_compressionLevel) {
    level_ = static_cast<int>(value);
  }
}

/* static */ void Options::freeCCtxParams(ZSTD_CCtx_params* params) {
  ZSTD_freeCCtxParams(params);
}

std::unique_ptr<Codec> getCodec(Options options) {
  return std::make_unique<ZSTDStreamCodec>(std::move(options));
}

std::unique_ptr<StreamCodec> getStreamCodec(Options options) {
  return std::make_unique<ZSTDStreamCodec>(std::move(options));
}

} // namespace zstd
} // namespace io
} // namespace folly

#endif
