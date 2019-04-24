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

#pragma once

#include <folly/Portability.h>
#include <folly/compression/Compression.h>

#if FOLLY_HAVE_LIBZ

#include <zlib.h>

/**
 * Interface for Zlib-specific codec initialization.
 */
namespace folly {
namespace io {
namespace zlib {

struct Options {
  /**
   * ZLIB: default option -- write a zlib wrapper as documented in RFC 1950.
   *
   * GZIP: write a simple gzip header and trailer around the compressed data
   * instead of a zlib wrapper.
   *
   * RAW: deflate will generate raw deflate data with no zlib header or
   * trailer, and will not compute a check value.
   *
   * AUTO: enable automatic header detection for decoding gzip or zlib data.
   * For deflation, ZLIB will be used.
   */
  enum class Format { ZLIB, GZIP, RAW, AUTO };

  explicit Options(
      Format format_ = Format::ZLIB,
      int windowSize_ = 15,
      int memLevel_ = 8,
      int strategy_ = Z_DEFAULT_STRATEGY)
      : format(format_),
        windowSize(windowSize_),
        memLevel(memLevel_),
        strategy(strategy_) {}

  Format format;

  /**
   * windowSize is the base two logarithm of the window size (the size of the
   * history buffer). It should be in the range 9..15. Larger values of this
   * parameter result in better compression at the expense of memory usage.
   *
   * The default value is 15.
   *
   * NB: when inflating/uncompressing data, the windowSize must be greater than
   * or equal to the size used when deflating/compressing.
   */
  int windowSize;

  /**
   * "The memLevel parameter specifies how much memory should be allocated for
   * the internal compression state. memLevel=1 uses minimum memory but is slow
   * and reduces compression ratio; memLevel=9 uses maximum memory for optimal
   * speed. The default value is 8."
   */
  int memLevel;

  /**
   * The strategy parameter is used to tune the compression algorithm.
   * Supported values:
   * - Z_DEFAULT_STRATEGY: normal data
   * - Z_FILTERED: data produced by a filter (or predictor)
   * - Z_HUFFMAN_ONLY: force Huffman encoding only (no string match)
   * - Z_RLE: limit match distances to one
   * - Z_FIXED: prevents the use of dynamic Huffman codes
   *
   * The strategy parameter only affects the compression ratio but not the
   * correctness of the compressed output.
   */
  int strategy;
};

/**
 * Get the default options for gzip compression.
 * A codec created with these options will have type CodecType::GZIP.
 */
Options defaultGzipOptions();

/**
 * Get the default options for zlib compression.
 * A codec created with these options will have type CodecType::ZLIB.
 */
Options defaultZlibOptions();

/**
 * Get a codec with the given options and compression level.
 *
 * If the windowSize is 15 and the format is Format::ZLIB or Format::GZIP, then
 * the type of the codec will be CodecType::ZLIB or CodecType::GZIP
 * respectively. Otherwise, the type will be CodecType::USER_DEFINED.
 *
 * Automatic uncompression is not supported with USER_DEFINED codecs.
 *
 * Levels supported: 0 = no compression, 1 = fast, ..., 9 = best; default = 6
 */
std::unique_ptr<Codec> getCodec(
    Options options = Options(),
    int level = COMPRESSION_LEVEL_DEFAULT);
std::unique_ptr<StreamCodec> getStreamCodec(
    Options options = Options(),
    int level = COMPRESSION_LEVEL_DEFAULT);

} // namespace zlib
} // namespace io
} // namespace folly

#endif // FOLLY_HAVE_LIBZ
