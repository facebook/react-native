/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CallbackOStream.h"

#include <algorithm>
#include <cassert>

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

CallbackOStream::CallbackOStream(size_t sz, Fn cb)
    : std::ostream(&sbuf_), sbuf_(sz, std::move(cb)) {}

CallbackOStream::StreamBuf::StreamBuf(size_t sz, Fn cb)
    : sz_(sz), buf_(std::make_unique<char[]>(sz)), cb_(std::move(cb)) {
  reset();
}

CallbackOStream::StreamBuf::~StreamBuf() {
  sync();
}

std::streambuf::int_type CallbackOStream::StreamBuf::overflow(
    std::streambuf::int_type ch) {
  assert(pptr() <= epptr() && "overflow expects the buffer not to be overfull");

  if (!pptr()) {
    return traits_type::eof();
  }

  *pptr() = ch;
  pbump(1);

  if (sync() == 0) {
    return traits_type::not_eof(ch);
  }

  // Set to nullptr on failure.
  setp(nullptr, nullptr);
  return traits_type::eof();
}

int CallbackOStream::StreamBuf::sync() {
  try {
    return pbase() == pptr() || cb_(take()) ? 0 : -1;
  } catch (...) {
    return -1;
  }
}

void CallbackOStream::StreamBuf::reset() {
  assert(sz_ > 0 && "Buffer cannot be empty.");
  // std::streambuf::overflow accepts the character that caused the overflow as
  // a parameter.  Part of handling the overflow is adding this character to the
  // stream.  We choose to do this by stealing a byte at the end of the "put"
  // area where the character can be written, even if the area is otherwise
  // full, immediately prior to being flushed.
  setp(&buf_[0], &buf_[0] + sz_ - 1);
}

std::string CallbackOStream::StreamBuf::take() {
  const size_t strsz = pptr() - pbase();
  reset();
  return std::string(pbase(), strsz);
}

} // namespace detail
} // namespace inspector
} // namespace hermes
} // namespace facebook
