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

#pragma once

#include <folly/Portability.h>

#if FOLLY_SSE_PREREQ(4, 2)
#include <immintrin.h>
#endif

#include <stdint.h>
#include <cstddef>

namespace folly {
namespace detail {

/**
 * Compute a CRC-32C checksum of a buffer using a hardware-accelerated
 * implementation.
 *
 * @note This function is exposed to support special cases where the
 *       calling code is absolutely certain it ought to invoke a hardware-
 *       accelerated CRC-32C implementation - unit tests, for example.  For
 *       all other scenarios, please call crc32c() and let it pick an
 *       implementation based on the capabilities of the underlying CPU.
 */
uint32_t
crc32c_hw(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

/**
 * Check whether a hardware-accelerated CRC-32C implementation is
 * supported on the current CPU.
 */
bool crc32c_hw_supported();

/**
 * Compute a CRC-32C checksum of a buffer using a portable,
 * software-only implementation.
 *
 * @note This function is exposed to support special cases where the
 *       calling code is absolutely certain it wants to use the software
 *       implementation instead of the hardware-accelerated code - unit
 *       tests, for example.  For all other scenarios, please call crc32c()
 *       and let it pick an implementation based on the capabilities of
 *       the underlying CPU.
 */
uint32_t
crc32c_sw(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

/**
 * Compute a CRC-32 checksum of a buffer using a hardware-accelerated
 * implementation.
 *
 * @note This function is exposed to support special cases where the
 *       calling code is absolutely certain it ought to invoke a hardware-
 *       accelerated CRC-32 implementation - unit tests, for example.  For
 *       all other scenarios, please call crc32() and let it pick an
 *       implementation based on the capabilities of the underlying CPU.
 */
uint32_t
crc32_hw(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

#if FOLLY_SSE_PREREQ(4, 2)
uint32_t
crc32_hw_aligned(uint32_t remainder, const __m128i* p, size_t vec_count);
#endif

/**
 * Check whether a hardware-accelerated CRC-32 implementation is
 * supported on the current CPU.
 */
bool crc32_hw_supported();

/**
 * Compute a CRC-32 checksum of a buffer using a portable,
 * software-only implementation.
 *
 * @note This function is exposed to support special cases where the
 *       calling code is absolutely certain it wants to use the software
 *       implementation instead of the hardware-accelerated code - unit
 *       tests, for example.  For all other scenarios, please call crc32()
 *       and let it pick an implementation based on the capabilities of
 *       the underlying CPU.
 */
uint32_t
crc32_sw(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

/* See Checksum.h for details.
 *
 * crc2len *must* be a power of two >= 4.
 */
uint32_t crc32_combine_sw(uint32_t crc1, uint32_t crc2, size_t crc2len);
uint32_t crc32_combine_hw(uint32_t crc1, uint32_t crc2, size_t crc2len);
uint32_t crc32c_combine_sw(uint32_t crc1, uint32_t crc2, size_t crc2len);
uint32_t crc32c_combine_hw(uint32_t crc1, uint32_t crc2, size_t crc2len);

} // namespace detail
} // namespace folly
