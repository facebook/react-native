/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <ostream>
#include <streambuf>
#include <string>

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

/// Subclass of \c std::ostream where flushing is implemented through a
/// callback.  Writes are collected in a buffer.  When filled, the buffer's
/// contents are emptied out and sent to a callback.
struct CallbackOStream : public std::ostream {
  /// Signature of callback called to flush buffer contents.  Accepts the buffer
  /// as a string.  Returns a boolean indicating whether flushing succeeded.
  /// Callback failure will be translated to stream failure.  If the callback
  /// throws an exception it will be swallowed and translated into stream
  /// failure.
  using Fn = std::function<bool(std::string)>;

  /// Construct a new stream.
  ///
  /// \p sz The size of the buffer -- how large it can get before it must be
  ///   flushed.  Must be non-zero.
  /// \p cb The callback function.
  CallbackOStream(size_t sz, Fn cb);

  /// This class is neither movable nor copyable.
  CallbackOStream(CallbackOStream &&that) = delete;
  CallbackOStream &operator=(CallbackOStream &&that) = delete;
  CallbackOStream(const CallbackOStream &that) = delete;
  CallbackOStream &operator=(const CallbackOStream &that) = delete;

 private:
  /// \c std::streambuf sub-class backed by a std::string buffer and
  /// implementing overflow by calling a callback.
  struct StreamBuf : public std::streambuf {
    /// Construct a new streambuf.  Parameters are the same as those of
    /// \c CallbackOStream .
    StreamBuf(size_t sz, Fn cb);

    /// Destruction will flush any remaining buffer contents.
    ~StreamBuf();

    /// StreamBufs are not copyable, to avoid the flush callback receiving
    /// the contents of multiple streams.
    StreamBuf(const StreamBuf &) = delete;
    StreamBuf &operator=(const StreamBuf &) = delete;

   protected:
    /// std::streambuf overrides
    int_type overflow(int_type ch) override;
    int sync() override;

   private:
    /// The size of the backing buffer.  Fixed for an instance of the streambuf.
    size_t sz_;

    /// The backing buffer that writes will go to until full.
    std::unique_ptr<char[]> buf_;

    /// The function called when buf_ has been filled.
    Fn cb_;

    /// Clears the backing buffer.
    void reset();

    /// Clears the backing buffer and returns it contents in a string.
    std::string take();
  };

  StreamBuf sbuf_;
};

} // namespace detail
} // namespace inspector
} // namespace hermes
} // namespace facebook
