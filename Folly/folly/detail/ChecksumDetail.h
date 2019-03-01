/*
 * Copyright 2017 Facebook, Inc.
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

namespace folly { namespace detail {

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
uint32_t crc32c_hw(const uint8_t* data, size_t nbytes,
    uint32_t startingChecksum = ~0U);

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
uint32_t crc32c_sw(const uint8_t* data, size_t nbytes,
    uint32_t startingChecksum = ~0U);


}} // folly::detail
