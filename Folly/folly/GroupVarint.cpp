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

#include <folly/GroupVarint.h>

#include <folly/container/Array.h>

#if HAVE_GROUP_VARINT
namespace folly {

const uint32_t GroupVarint32::kMask[] = {
    0xff,
    0xffff,
    0xffffff,
    0xffffffff,
};

const uint64_t GroupVarint64::kMask[] = {
    0xff,
    0xffff,
    0xffffff,
    0xffffffff,
    0xffffffffffULL,
    0xffffffffffffULL,
    0xffffffffffffffULL,
    0xffffffffffffffffULL,
};

namespace detail {

struct group_varint_table_base_make_item {
  constexpr std::size_t get_d(std::size_t index, std::size_t j) const {
    return 1u + ((index >> (2 * j)) & 3u);
  }
  constexpr std::size_t get_offset(std::size_t index, std::size_t j) const {
    // clang-format off
    return
        (j > 0 ? get_d(index, 0) : 0) +
        (j > 1 ? get_d(index, 1) : 0) +
        (j > 2 ? get_d(index, 2) : 0) +
        (j > 3 ? get_d(index, 3) : 0) +
        0;
    // clang-format on
  }
};

struct group_varint_table_length_make_item : group_varint_table_base_make_item {
  constexpr std::uint8_t operator()(std::size_t index) const {
    return 1u + get_offset(index, 4);
  }
};

//  Reference: http://www.stepanovpapers.com/CIKM_2011.pdf
//
//  From 17 encoded bytes, we may use between 5 and 17 bytes to encode 4
//  integers.  The first byte is a key that indicates how many bytes each of
//  the 4 integers takes:
//
//  bit 0..1: length-1 of first integer
//  bit 2..3: length-1 of second integer
//  bit 4..5: length-1 of third integer
//  bit 6..7: length-1 of fourth integer
//
//  The value of the first byte is used as the index in a table which returns
//  a mask value for the SSSE3 PSHUFB instruction, which takes an XMM register
//  (16 bytes) and shuffles bytes from it into a destination XMM register
//  (optionally setting some of them to 0)
//
//  For example, if the key has value 4, that means that the first integer
//  uses 1 byte, the second uses 2 bytes, the third and fourth use 1 byte each,
//  so we set the mask value so that
//
//  r[0] = a[0]
//  r[1] = 0
//  r[2] = 0
//  r[3] = 0
//
//  r[4] = a[1]
//  r[5] = a[2]
//  r[6] = 0
//  r[7] = 0
//
//  r[8] = a[3]
//  r[9] = 0
//  r[10] = 0
//  r[11] = 0
//
//  r[12] = a[4]
//  r[13] = 0
//  r[14] = 0
//  r[15] = 0

struct group_varint_table_sse_mask_make_item
    : group_varint_table_base_make_item {
  constexpr auto partial_item(std::size_t d, std::size_t offset, std::size_t k)
      const {
    // if k < d, the j'th integer uses d bytes, consume them
    // set remaining bytes in result to 0
    // 0xff: set corresponding byte in result to 0
    return std::uint32_t((k < d ? offset + k : std::size_t(0xff)) << (8 * k));
  }

  constexpr auto item_impl(std::size_t d, std::size_t offset) const {
    // clang-format off
    return
        partial_item(d, offset, 0) |
        partial_item(d, offset, 1) |
        partial_item(d, offset, 2) |
        partial_item(d, offset, 3) |
        0;
    // clang-format on
  }

  constexpr auto item(std::size_t index, std::size_t j) const {
    return item_impl(get_d(index, j), get_offset(index, j));
  }

  constexpr auto operator()(std::size_t index) const {
    return std::array<std::uint32_t, 4>{{
        item(index, 0),
        item(index, 1),
        item(index, 2),
        item(index, 3),
    }};
  }
};

#if FOLLY_SSE >= 3
alignas(16) FOLLY_STORAGE_CONSTEXPR
    decltype(groupVarintSSEMasks) groupVarintSSEMasks =
        make_array_with<256>(group_varint_table_sse_mask_make_item{});
#endif

FOLLY_STORAGE_CONSTEXPR decltype(groupVarintLengths) groupVarintLengths =
    make_array_with<256>(group_varint_table_length_make_item{});

} // namespace detail

} // namespace folly
#endif
