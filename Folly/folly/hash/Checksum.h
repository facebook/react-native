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

#include <stdint.h>
#include <cstddef>

/*
 * Checksum functions
 */

namespace folly {

/**
 * Compute the CRC-32C checksum of a buffer, using a hardware-accelerated
 * implementation if available or a portable software implementation as
 * a default.
 *
 * @note CRC-32C is different from CRC-32; CRC-32C starts with a different
 *       polynomial and thus yields different results for the same input
 *       than a traditional CRC-32.
 */
uint32_t
crc32c(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

/**
 * Compute the CRC-32 checksum of a buffer, using a hardware-accelerated
 * implementation if available or a portable software implementation as
 * a default.
 */
uint32_t
crc32(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

/**
 * Compute the CRC-32 checksum of a buffer, using a hardware-accelerated
 * implementation if available or a portable software implementation as
 * a default.
 *
 * @note compared to crc32(), crc32_type() uses a different set of default
 *       parameters to match the results returned by boost::crc_32_type and
 *       php's built-in crc32 implementation
 */
uint32_t
crc32_type(const uint8_t* data, size_t nbytes, uint32_t startingChecksum = ~0U);

/**
 * Given two checksums, combine them in to one checksum.
 *
 * Example:
 *                     len1            len2
 * Given a buffer [  checksum 1  |  checksum 2  ]
 * such that the first buffer's crc is checksum1 and has length len1,
 * and the remainder of the buffer's crc is checksum2 and len 2,
 * a total checksum over the whole buffer can be made by:
 *
 * crc32_combine(checksum1, checksum 2, len2); // len1 not needed.
 *
 * Note that this is equivalent to:
 *
 * crc32(buffer2, len2, crc32(buffer1, len1));
 *
 * However, this allows calculating the checksums in parallel
 * or calculating checksum 2 before checksum 1.
 *
 * Additionally, this is also equivalent, but much slower:
 * crc2 = crc32(buffer2, len2, 0);
 * crc1 = crc32(buffer1, len1, 0);
 * combined = crc2 ^ crc32(buffer_of_all_zeros, len2, crc1);
 *
 * crc32[c]_combine is roughly ~10x faster than either of the other
 * above two examples.
 */
uint32_t crc32_combine(uint32_t crc1, uint32_t crc2, size_t crc2len);

/* crc32c_combine is the same as crc32_combine, but uses the crc32c
   polynomial */
uint32_t crc32c_combine(uint32_t crc1, uint32_t crc2, size_t crc2len);

} // namespace folly
