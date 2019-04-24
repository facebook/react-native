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

#pragma once

#include <memory.h>

#include <folly/Memory.h>
#include <folly/Portability.h>
#include <folly/compression/Compression.h>

#if FOLLY_HAVE_LIBZSTD

#ifndef ZSTD_STATIC_LINKING_ONLY
#define ZSTD_STATIC_LINKING_ONLY
#endif
#include <zstd.h>

namespace folly {
namespace io {
namespace zstd {

/**
 * Interface for zstd-specific codec initialization.
 */
class Options {
 public:
  /* Create an Options struct with the default options for the given `level`.
   * NOTE: This is the zstd level, COMPRESSION_LEVEL_DEFAULT and such aren't
   *       supported, since zstd supports negative compression levels.
   */
  explicit Options(int level);

  /**
   * Set the compression `param` to `value`.
   * See the zstd documentation for ZSTD_CCtx_setParameter() for details, this
   * is just a thin wrapper.
   */
  void set(ZSTD_cParameter param, unsigned value);

  /**
   * Set the maximum allowed window size during decompression.
   * `maxWindowSize == 0` means don't set the maximum window size.
   * zstd's current default limit is 2^27.
   * See the zstd documentation for ZSTD_DCtx_setMaxWindowSize() for details.
   */
  void setMaxWindowSize(size_t maxWindowSize) {
    maxWindowSize_ = maxWindowSize;
  }

  /// Get a reference to the ZSTD_CCtx_params.
  ZSTD_CCtx_params const* params() const {
    return params_.get();
  }

  /// Get the compression level.
  int level() const {
    return level_;
  }

  /// Get the maximum window size.
  size_t maxWindowSize() const {
    return maxWindowSize_;
  }

 private:
  static void freeCCtxParams(ZSTD_CCtx_params* params);
  std::unique_ptr<
      ZSTD_CCtx_params,
      folly::static_function_deleter<ZSTD_CCtx_params, &freeCCtxParams>>
      params_;
  size_t maxWindowSize_{0};
  int level_;
};

/// Get a zstd Codec with the given options.
std::unique_ptr<Codec> getCodec(Options options);
/// Get a zstd StreamCodec with the given options.
std::unique_ptr<StreamCodec> getStreamCodec(Options options);

} // namespace zstd
} // namespace io
} // namespace folly

#endif
