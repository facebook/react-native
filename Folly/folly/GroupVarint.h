/*
 * Copyright 2012-present Facebook, Inc.
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

#include <cstdint>
#include <limits>

#include <glog/logging.h>

#if !defined(__GNUC__) && !defined(_MSC_VER)
#error GroupVarint.h requires GCC or MSVC
#endif

#include <folly/Portability.h>

#if FOLLY_X64 || defined(__i386__) || FOLLY_PPC64 || FOLLY_AARCH64
#define HAVE_GROUP_VARINT 1

#include <folly/Range.h>
#include <folly/detail/GroupVarintDetail.h>
#include <folly/lang/Bits.h>
#include <folly/portability/Builtins.h>

#if FOLLY_SSE >= 3
#include <nmmintrin.h>
namespace folly {
namespace detail {
extern const std::array<std::array<std::uint32_t, 4>, 256> groupVarintSSEMasks;
} // namespace detail
} // namespace folly
#endif

namespace folly {
namespace detail {
extern const std::array<std::uint8_t, 256> groupVarintLengths;
} // namespace detail
} // namespace folly

namespace folly {

template <typename T>
class GroupVarint;

/**
 * GroupVarint encoding for 32-bit values.
 *
 * Encodes 4 32-bit integers at once, each using 1-4 bytes depending on size.
 * There is one byte of overhead.  (The first byte contains the lengths of
 * the four integers encoded as two bits each; 00=1 byte .. 11=4 bytes)
 *
 * This implementation assumes little-endian and does unaligned 32-bit
 * accesses, so it's basically not portable outside of the x86[_64] world.
 */
template <>
class GroupVarint<uint32_t> : public detail::GroupVarintBase<uint32_t> {
 public:
  /**
   * Return the number of bytes used to encode these four values.
   */
  static size_t size(uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    return kHeaderSize + kGroupSize + key(a) + key(b) + key(c) + key(d);
  }

  /**
   * Return the number of bytes used to encode four uint32_t values stored
   * at consecutive positions in an array.
   */
  static size_t size(const uint32_t* p) {
    return size(p[0], p[1], p[2], p[3]);
  }

  /**
   * Return the number of bytes used to encode count (<= 4) values.
   * If you clip a buffer after these many bytes, you can still decode
   * the first "count" values correctly (if the remaining size() -
   * partialSize() bytes are filled with garbage).
   */
  static size_t partialSize(const type* p, size_t count) {
    DCHECK_LE(count, kGroupSize);
    size_t s = kHeaderSize + count;
    for (; count; --count, ++p) {
      s += key(*p);
    }
    return s;
  }

  /**
   * Return the number of values from *p that are valid from an encoded
   * buffer of size bytes.
   */
  static size_t partialCount(const char* p, size_t size) {
    uint8_t v = uint8_t(*p);
    size_t s = kHeaderSize;
    s += 1 + b0key(v);
    if (s > size) {
      return 0;
    }
    s += 1 + b1key(v);
    if (s > size) {
      return 1;
    }
    s += 1 + b2key(v);
    if (s > size) {
      return 2;
    }
    s += 1 + b3key(v);
    if (s > size) {
      return 3;
    }
    return 4;
  }

  /**
   * Given a pointer to the beginning of an GroupVarint32-encoded block,
   * return the number of bytes used by the encoding.
   */
  static size_t encodedSize(const char* p) {
    return kHeaderSize + kGroupSize + b0key(uint8_t(*p)) + b1key(uint8_t(*p)) +
        b2key(uint8_t(*p)) + b3key(uint8_t(*p));
  }

  /**
   * Encode four uint32_t values into the buffer pointed-to by p, and return
   * the next position in the buffer (that is, one character past the last
   * encoded byte).  p needs to have at least size()+4 bytes available.
   */
  static char* encode(char* p, uint32_t a, uint32_t b, uint32_t c, uint32_t d) {
    uint8_t b0key = key(a);
    uint8_t b1key = key(b);
    uint8_t b2key = key(c);
    uint8_t b3key = key(d);
    *p++ = (b3key << 6) | (b2key << 4) | (b1key << 2) | b0key;
    storeUnaligned(p, a);
    p += b0key + 1;
    storeUnaligned(p, b);
    p += b1key + 1;
    storeUnaligned(p, c);
    p += b2key + 1;
    storeUnaligned(p, d);
    p += b3key + 1;
    return p;
  }

  /**
   * Encode four uint32_t values from the array pointed-to by src into the
   * buffer pointed-to by p, similar to encode(p,a,b,c,d) above.
   */
  static char* encode(char* p, const uint32_t* src) {
    return encode(p, src[0], src[1], src[2], src[3]);
  }

  /**
   * Decode four uint32_t values from a buffer, and return the next position
   * in the buffer (that is, one character past the last encoded byte).
   * The buffer needs to have at least 3 extra bytes available (they
   * may be read but ignored).
   */
  static const char* decode_simple(
      const char* p,
      uint32_t* a,
      uint32_t* b,
      uint32_t* c,
      uint32_t* d) {
    size_t k = loadUnaligned<uint8_t>(p);
    const char* end = p + detail::groupVarintLengths[k];
    ++p;
    size_t k0 = b0key(k);
    *a = loadUnaligned<uint32_t>(p) & kMask[k0];
    p += k0 + 1;
    size_t k1 = b1key(k);
    *b = loadUnaligned<uint32_t>(p) & kMask[k1];
    p += k1 + 1;
    size_t k2 = b2key(k);
    *c = loadUnaligned<uint32_t>(p) & kMask[k2];
    p += k2 + 1;
    size_t k3 = b3key(k);
    *d = loadUnaligned<uint32_t>(p) & kMask[k3];
    // p += k3+1;
    return end;
  }

  /**
   * Decode four uint32_t values from a buffer and store them in the array
   * pointed-to by dest, similar to decode(p,a,b,c,d) above.
   */
  static const char* decode_simple(const char* p, uint32_t* dest) {
    return decode_simple(p, dest, dest + 1, dest + 2, dest + 3);
  }

#if FOLLY_SSE >= 3
  /**
   * Just like the non-SSSE3 decode below, but with the additional constraint
   * that we must be able to read at least 17 bytes from the input pointer, p.
   */
  static const char* decode(const char* p, uint32_t* dest) {
    uint8_t key = uint8_t(p[0]);
    __m128i val = _mm_loadu_si128((const __m128i*)(p + 1));
    __m128i mask =
        _mm_load_si128((const __m128i*)detail::groupVarintSSEMasks[key].data());
    __m128i r = _mm_shuffle_epi8(val, mask);
    _mm_storeu_si128((__m128i*)dest, r);
    return p + detail::groupVarintLengths[key];
  }

  /**
   * Just like decode_simple, but with the additional constraint that
   * we must be able to read at least 17 bytes from the input pointer, p.
   */
  static const char*
  decode(const char* p, uint32_t* a, uint32_t* b, uint32_t* c, uint32_t* d) {
    uint8_t key = uint8_t(p[0]);
    __m128i val = _mm_loadu_si128((const __m128i*)(p + 1));
    __m128i mask =
        _mm_load_si128((const __m128i*)detail::groupVarintSSEMasks[key].data());
    __m128i r = _mm_shuffle_epi8(val, mask);

    // Extracting 32 bits at a time out of an XMM register is a SSE4 feature
#if FOLLY_SSE >= 4
    *a = uint32_t(_mm_extract_epi32(r, 0));
    *b = uint32_t(_mm_extract_epi32(r, 1));
    *c = uint32_t(_mm_extract_epi32(r, 2));
    *d = uint32_t(_mm_extract_epi32(r, 3));
#else /* !__SSE4__ */
    *a = _mm_extract_epi16(r, 0) + (_mm_extract_epi16(r, 1) << 16);
    *b = _mm_extract_epi16(r, 2) + (_mm_extract_epi16(r, 3) << 16);
    *c = _mm_extract_epi16(r, 4) + (_mm_extract_epi16(r, 5) << 16);
    *d = _mm_extract_epi16(r, 6) + (_mm_extract_epi16(r, 7) << 16);
#endif /* __SSE4__ */

    return p + detail::groupVarintLengths[key];
  }

#else /* !__SSSE3__ */
  static const char*
  decode(const char* p, uint32_t* a, uint32_t* b, uint32_t* c, uint32_t* d) {
    return decode_simple(p, a, b, c, d);
  }

  static const char* decode(const char* p, uint32_t* dest) {
    return decode_simple(p, dest);
  }
#endif /* __SSSE3__ */

 private:
  static uint8_t key(uint32_t x) {
    // __builtin_clz is undefined for the x==0 case
    return uint8_t(3 - (__builtin_clz(x | 1) / 8));
  }
  static size_t b0key(size_t x) {
    return x & 3;
  }
  static size_t b1key(size_t x) {
    return (x >> 2) & 3;
  }
  static size_t b2key(size_t x) {
    return (x >> 4) & 3;
  }
  static size_t b3key(size_t x) {
    return (x >> 6) & 3;
  }

  static const uint32_t kMask[];
};

/**
 * GroupVarint encoding for 64-bit values.
 *
 * Encodes 5 64-bit integers at once, each using 1-8 bytes depending on size.
 * There are two bytes of overhead.  (The first two bytes contain the lengths
 * of the five integers encoded as three bits each; 000=1 byte .. 111 = 8 bytes)
 *
 * This implementation assumes little-endian and does unaligned 64-bit
 * accesses, so it's basically not portable outside of the x86[_64] world.
 */
template <>
class GroupVarint<uint64_t> : public detail::GroupVarintBase<uint64_t> {
 public:
  /**
   * Return the number of bytes used to encode these five values.
   */
  static size_t
  size(uint64_t a, uint64_t b, uint64_t c, uint64_t d, uint64_t e) {
    return kHeaderSize + kGroupSize + key(a) + key(b) + key(c) + key(d) +
        key(e);
  }

  /**
   * Return the number of bytes used to encode five uint64_t values stored
   * at consecutive positions in an array.
   */
  static size_t size(const uint64_t* p) {
    return size(p[0], p[1], p[2], p[3], p[4]);
  }

  /**
   * Return the number of bytes used to encode count (<= 4) values.
   * If you clip a buffer after these many bytes, you can still decode
   * the first "count" values correctly (if the remaining size() -
   * partialSize() bytes are filled with garbage).
   */
  static size_t partialSize(const type* p, size_t count) {
    DCHECK_LE(count, kGroupSize);
    size_t s = kHeaderSize + count;
    for (; count; --count, ++p) {
      s += key(*p);
    }
    return s;
  }

  /**
   * Return the number of values from *p that are valid from an encoded
   * buffer of size bytes.
   */
  static size_t partialCount(const char* p, size_t size) {
    uint16_t v = loadUnaligned<uint16_t>(p);
    size_t s = kHeaderSize;
    s += 1 + b0key(v);
    if (s > size) {
      return 0;
    }
    s += 1 + b1key(v);
    if (s > size) {
      return 1;
    }
    s += 1 + b2key(v);
    if (s > size) {
      return 2;
    }
    s += 1 + b3key(v);
    if (s > size) {
      return 3;
    }
    s += 1 + b4key(v);
    if (s > size) {
      return 4;
    }
    return 5;
  }

  /**
   * Given a pointer to the beginning of an GroupVarint64-encoded block,
   * return the number of bytes used by the encoding.
   */
  static size_t encodedSize(const char* p) {
    uint16_t n = loadUnaligned<uint16_t>(p);
    return kHeaderSize + kGroupSize + b0key(n) + b1key(n) + b2key(n) +
        b3key(n) + b4key(n);
  }

  /**
   * Encode five uint64_t values into the buffer pointed-to by p, and return
   * the next position in the buffer (that is, one character past the last
   * encoded byte).  p needs to have at least size()+8 bytes available.
   */
  static char*
  encode(char* p, uint64_t a, uint64_t b, uint64_t c, uint64_t d, uint64_t e) {
    uint16_t b0key = key(a);
    uint16_t b1key = key(b);
    uint16_t b2key = key(c);
    uint16_t b3key = key(d);
    uint16_t b4key = key(e);
    storeUnaligned<uint16_t>(
        p,
        uint16_t(
            (b4key << 12) | (b3key << 9) | (b2key << 6) | (b1key << 3) |
            b0key));
    p += 2;
    storeUnaligned(p, a);
    p += b0key + 1;
    storeUnaligned(p, b);
    p += b1key + 1;
    storeUnaligned(p, c);
    p += b2key + 1;
    storeUnaligned(p, d);
    p += b3key + 1;
    storeUnaligned(p, e);
    p += b4key + 1;
    return p;
  }

  /**
   * Encode five uint64_t values from the array pointed-to by src into the
   * buffer pointed-to by p, similar to encode(p,a,b,c,d,e) above.
   */
  static char* encode(char* p, const uint64_t* src) {
    return encode(p, src[0], src[1], src[2], src[3], src[4]);
  }

  /**
   * Decode five uint64_t values from a buffer, and return the next position
   * in the buffer (that is, one character past the last encoded byte).
   * The buffer needs to have at least 7 bytes available (they may be read
   * but ignored).
   */
  static const char* decode(
      const char* p,
      uint64_t* a,
      uint64_t* b,
      uint64_t* c,
      uint64_t* d,
      uint64_t* e) {
    uint16_t k = loadUnaligned<uint16_t>(p);
    p += 2;
    uint8_t k0 = b0key(k);
    *a = loadUnaligned<uint64_t>(p) & kMask[k0];
    p += k0 + 1;
    uint8_t k1 = b1key(k);
    *b = loadUnaligned<uint64_t>(p) & kMask[k1];
    p += k1 + 1;
    uint8_t k2 = b2key(k);
    *c = loadUnaligned<uint64_t>(p) & kMask[k2];
    p += k2 + 1;
    uint8_t k3 = b3key(k);
    *d = loadUnaligned<uint64_t>(p) & kMask[k3];
    p += k3 + 1;
    uint8_t k4 = b4key(k);
    *e = loadUnaligned<uint64_t>(p) & kMask[k4];
    p += k4 + 1;
    return p;
  }

  /**
   * Decode five uint64_t values from a buffer and store them in the array
   * pointed-to by dest, similar to decode(p,a,b,c,d,e) above.
   */
  static const char* decode(const char* p, uint64_t* dest) {
    return decode(p, dest, dest + 1, dest + 2, dest + 3, dest + 4);
  }

 private:
  enum { kHeaderBytes = 2 };

  static uint8_t key(uint64_t x) {
    // __builtin_clzll is undefined for the x==0 case
    return uint8_t(7 - (__builtin_clzll(x | 1) / 8));
  }

  static uint8_t b0key(uint16_t x) {
    return x & 7u;
  }
  static uint8_t b1key(uint16_t x) {
    return (x >> 3) & 7u;
  }
  static uint8_t b2key(uint16_t x) {
    return (x >> 6) & 7u;
  }
  static uint8_t b3key(uint16_t x) {
    return (x >> 9) & 7u;
  }
  static uint8_t b4key(uint16_t x) {
    return (x >> 12) & 7u;
  }

  static const uint64_t kMask[];
};

typedef GroupVarint<uint32_t> GroupVarint32;
typedef GroupVarint<uint64_t> GroupVarint64;

/**
 * Simplify use of GroupVarint* for the case where data is available one
 * entry at a time (instead of one group at a time).  Handles buffering
 * and an incomplete last chunk.
 *
 * Output is a function object that accepts character ranges:
 * out(StringPiece) appends the given character range to the output.
 */
template <class T, class Output>
class GroupVarintEncoder {
 public:
  typedef GroupVarint<T> Base;
  typedef T type;

  explicit GroupVarintEncoder(Output out) : out_(out), count_(0) {}

  ~GroupVarintEncoder() {
    finish();
  }

  /**
   * Add a value to the encoder.
   */
  void add(type val) {
    buf_[count_++] = val;
    if (count_ == Base::kGroupSize) {
      char* p = Base::encode(tmp_, buf_);
      out_(StringPiece(tmp_, p));
      count_ = 0;
    }
  }

  /**
   * Finish encoding, flushing any buffered values if necessary.
   * After finish(), the encoder is immediately ready to encode more data
   * to the same output.
   */
  void finish() {
    if (count_) {
      // This is not strictly necessary, but it makes testing easy;
      // uninitialized bytes are guaranteed to be recorded as taking one byte
      // (not more).
      for (size_t i = count_; i < Base::kGroupSize; i++) {
        buf_[i] = 0;
      }
      Base::encode(tmp_, buf_);
      out_(StringPiece(tmp_, Base::partialSize(buf_, count_)));
      count_ = 0;
    }
  }

  /**
   * Return the appender that was used.
   */
  Output& output() {
    return out_;
  }
  const Output& output() const {
    return out_;
  }

  /**
   * Reset the encoder, disregarding any state (except what was already
   * flushed to the output, of course).
   */
  void clear() {
    count_ = 0;
  }

 private:
  Output out_;
  char tmp_[Base::kMaxSize];
  type buf_[Base::kGroupSize];
  size_t count_;
};

/**
 * Simplify use of GroupVarint* for the case where the last group in the
 * input may be incomplete (but the exact size of the input is known).
 * Allows for extracting values one at a time.
 */
template <typename T>
class GroupVarintDecoder {
 public:
  typedef GroupVarint<T> Base;
  typedef T type;

  GroupVarintDecoder() = default;

  explicit GroupVarintDecoder(StringPiece data, size_t maxCount = (size_t)-1)
      : rrest_(data.end()),
        p_(data.data()),
        end_(data.end()),
        limit_(end_),
        pos_(0),
        count_(0),
        remaining_(maxCount) {}

  void reset(StringPiece data, size_t maxCount = (size_t)-1) {
    rrest_ = data.end();
    p_ = data.data();
    end_ = data.end();
    limit_ = end_;
    pos_ = 0;
    count_ = 0;
    remaining_ = maxCount;
  }

  /**
   * Read and return the next value.
   */
  bool next(type* val) {
    if (pos_ == count_) {
      // refill
      size_t rem = size_t(end_ - p_);
      if (rem == 0 || remaining_ == 0) {
        return false;
      }
      // next() attempts to read one full group at a time, and so we must have
      // at least enough bytes readable after its end to handle the case if the
      // last group is full.
      //
      // The best way to ensure this is to ensure that data has at least
      // Base::kMaxSize - 1 bytes readable *after* the end, otherwise we'll copy
      // into a temporary buffer.
      if (limit_ - p_ < Base::kMaxSize) {
        memcpy(tmp_, p_, rem);
        p_ = tmp_;
        end_ = p_ + rem;
        limit_ = tmp_ + sizeof(tmp_);
      }
      pos_ = 0;
      const char* n = Base::decode(p_, buf_);
      if (n <= end_) {
        // Full group could be decoded
        if (remaining_ >= Base::kGroupSize) {
          remaining_ -= Base::kGroupSize;
          count_ = Base::kGroupSize;
          p_ = n;
        } else {
          count_ = remaining_;
          remaining_ = 0;
          p_ += Base::partialSize(buf_, count_);
        }
      } else {
        // Can't decode a full group
        count_ = Base::partialCount(p_, size_t(end_ - p_));
        if (remaining_ >= count_) {
          remaining_ -= count_;
          p_ = end_;
        } else {
          count_ = remaining_;
          remaining_ = 0;
          p_ += Base::partialSize(buf_, count_);
        }
        if (count_ == 0) {
          return false;
        }
      }
    }
    *val = buf_[pos_++];
    return true;
  }

  StringPiece rest() const {
    // This is only valid after next() returned false
    CHECK(pos_ == count_ && (p_ == end_ || remaining_ == 0));
    // p_ may point to the internal buffer (tmp_), but we want
    // to return subpiece of the original data
    size_t size = size_t(end_ - p_);
    return StringPiece(rrest_ - size, rrest_);
  }

 private:
  const char* rrest_;
  const char* p_;
  const char* end_;
  const char* limit_;
  char tmp_[2 * Base::kMaxSize];
  type buf_[Base::kGroupSize];
  size_t pos_;
  size_t count_;
  size_t remaining_;
};

typedef GroupVarintDecoder<uint32_t> GroupVarint32Decoder;
typedef GroupVarintDecoder<uint64_t> GroupVarint64Decoder;

} // namespace folly

#endif /* FOLLY_X64 || defined(__i386__) || FOLLY_PPC64 */
