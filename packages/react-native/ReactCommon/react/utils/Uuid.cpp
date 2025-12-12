/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Uuid.h"

#include <array>
#include <iomanip>
#include <random>
#include <sstream>

namespace {

std::mt19937& getThreadLocalEngine() {
  static thread_local std::random_device device;
  static thread_local std::mt19937 engine(device());
  return engine;
}

uint64_t randomUInt64(uint64_t max = std::numeric_limits<uint64_t>::max()) {
  std::uniform_int_distribution<uint64_t> distribution(0, max);
  return distribution(getThreadLocalEngine());
}

} // namespace

namespace facebook::react {

std::string generateRandomUuidString() {
  static constexpr uint8_t kUuidLength = 16;
  // see: https://tools.ietf.org/html/rfc4122#section-4.1.2 for reference
  static constexpr uint8_t kTimeLowSegBufEnd = sizeof(uint32_t);
  static constexpr uint8_t kTimeMidSegBufEnd =
      kTimeLowSegBufEnd + sizeof(uint16_t);
  static constexpr uint8_t kTimeHiAndVersionSegBufEnd =
      kTimeMidSegBufEnd + sizeof(uint16_t);
  static constexpr uint8_t kClockHiLoSegBufEnd =
      kTimeHiAndVersionSegBufEnd + sizeof(uint16_t);
  static constexpr uint8_t kNodeSegHiBufEnd =
      kClockHiLoSegBufEnd + sizeof(uint16_t);

  std::array<uint8_t, kUuidLength> uuidBytes;

  *(uint64_t*)uuidBytes.data() = randomUInt64();
  *(uint64_t*)(uuidBytes.data() + sizeof(uint64_t)) = randomUInt64();

  // Conforming to RFC 4122: https://www.cryptosys.net/pki/uuid-rfc4122.html
  uuidBytes[7] &= 0x0f;
  uuidBytes[7] |= 0x40;
  uuidBytes[9] &= 0x3f;
  uuidBytes[9] |= 0x80;

  std::stringstream ss;

  ss << std::setfill('0') << std::setw(8) << std::right << std::hex
     << *(uint32_t*)uuidBytes.data() << "-" << std::setw(4)
     << *(uint16_t*)(uuidBytes.data() + kTimeLowSegBufEnd) << "-"
     << *(uint16_t*)(uuidBytes.data() + kTimeMidSegBufEnd) << "-"
     << *(uint16_t*)(uuidBytes.data() + kTimeHiAndVersionSegBufEnd) << "-"
     << std::setw(8) << *(uint32_t*)(uuidBytes.data() + kNodeSegHiBufEnd)
     << std::setw(4) << *(uint16_t*)(uuidBytes.data() + kClockHiLoSegBufEnd);

  return ss.str();
}

} // namespace facebook::react
