// Copyright 2004-present Facebook. All Rights Reserved.

//TODO #14683310 remove this header as soon as RN iOS OSS links against folly

#pragma once

#if defined(ANDROID)
  #define USE_FOLLY_FOR_ENDIAN_SWAP 1
  #define USE_FOLLY_FOR_TO_STRING 1
#elif defined(__has_include)
  #define USE_FOLLY_FOR_ENDIAN_SWAP __has_include(<folly/Bits.h>)
  #define USE_FOLLY_FOR_TO_STRING __has_include(<folly/String.h>)
#else
  #define USE_FOLLY_FOR_ENDIAN_SWAP 0
  #define USE_FOLLY_FOR_TO_STRING 0
#endif

#if USE_FOLLY_FOR_ENDIAN_SWAP
#include <folly/Bits.h>
#elif defined(__APPLE__)
#include <cstdint>
#include <CoreFoundation/CFByteOrder.h>
#endif // USE_FOLLY_FOR_ENDIAN_SWAP

#if USE_FOLLY_FOR_TO_STRING
#include <folly/String.h>
#else
#include <sstream>
#include <string>
#endif // USE_FOLLY_FOR_TO_STRING


#if USE_FOLLY_FOR_ENDIAN_SWAP
namespace facebook {
namespace react {

template <typename T>
inline T littleEndianToHost(T x) {
  return folly::Endian::little(x);
}

#elif defined(__APPLE__)

namespace facebook {
namespace react {

// Yes, this is horrible. #14683310

inline int32_t littleEndianToHost(int32_t x) {
  return CFSwapInt32LittleToHost(x);
}

inline uint32_t littleEndianToHost(uint32_t x) {
  return CFSwapInt32LittleToHost(x);
}

inline int64_t littleEndianToHost(int64_t x) {
  return CFSwapInt64LittleToHost(x);
}

inline uint64_t littleEndianToHost(uint64_t x) {
  return CFSwapInt64LittleToHost(x);
}

#endif // USE_FOLLY_FOR_ENDIAN_SWAP

#if USE_FOLLY_FOR_TO_STRING

template <typename ...Ts>
inline std::string toString(Ts... values) {
  return folly::to<std::string>(std::forward<Ts>(values)...);
}

#else

namespace {

template <typename ...Ts>
std::string toString(const std::stringstream& buf) {
  return buf.str();
}

template <typename T, typename ...Ts>
std::string toString(std::stringstream& buf, T value, Ts... values) {
  buf << value;
  return toString(buf, std::forward<Ts>(values)...);
}

} // anonymous namespace

template <typename ...Ts>
std::string toString(Ts... values) {
  std::stringstream buf{};
  return toString(buf, std::forward<Ts>(values)...);
}

#endif // USE_FOLLY_FOR_TO_STRING

}  // namespace react
}  // namespace facebook

#undef USE_FOLLY_FOR_ENDIAN_SWAP
#undef USE_FOLLY_FOR_TO_STRING
