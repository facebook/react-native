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
#include "Bser.h"
#include <folly/io/Cursor.h>
#include <folly/String.h>

using namespace folly;
using folly::io::Cursor;

namespace folly {
namespace bser {
static dynamic parseBser(Cursor& curs);

template <typename... ARGS>
[[noreturn]] static void throwDecodeError(Cursor& curs, ARGS&&... args) {
  throw BserDecodeError(folly::to<std::string>(std::forward<ARGS>(args)...,
                                               " with ",
                                               curs.length(),
                                               " bytes remaining in cursor"));
}

static int64_t decodeInt(Cursor& curs) {
  auto enc = (BserType)curs.read<int8_t>();
  switch (enc) {
    case BserType::Int8:
      return curs.read<int8_t>();
    case BserType::Int16:
      return curs.read<int16_t>();
    case BserType::Int32:
      return curs.read<int32_t>();
    case BserType::Int64:
      return curs.read<int64_t>();
    default:
      throwDecodeError(
          curs, "invalid integer encoding detected (", (int8_t)enc, ")");
  }
}

static std::string decodeString(Cursor& curs) {
  auto len = decodeInt(curs);
  std::string str;

  if (len < 0) {
    throw std::range_error("string length must not be negative");
  }
  str.reserve(size_t(len));

  size_t available = curs.length();
  while (available < (size_t)len) {
    if (available == 0) {
      // Saw this case when we decodeHeader was returning the incorrect length
      // and we were splitting off too few bytes from the IOBufQueue
      throwDecodeError(curs,
                       "no data available while decoding a string, header was "
                       "not decoded properly");
    }
    str.append(reinterpret_cast<const char*>(curs.data()), available);
    curs.skipAtMost(available);
    len -= available;
    available = curs.length();
  }

  str.append(reinterpret_cast<const char*>(curs.data()), size_t(len));
  curs.skipAtMost(size_t(len));
  return str;
}

static dynamic decodeArray(Cursor& curs) {
  dynamic arr = dynamic::array();
  auto size = decodeInt(curs);
  while (size-- > 0) {
    arr.push_back(parseBser(curs));
  }
  return arr;
}

static dynamic decodeObject(Cursor& curs) {
  dynamic obj = dynamic::object;
  auto size = decodeInt(curs);
  while (size-- > 0) {
    if ((BserType)curs.read<int8_t>() != BserType::String) {
      throwDecodeError(curs, "expected String");
    }
    auto key = decodeString(curs);
    obj[key] = parseBser(curs);
  }
  return obj;
}

static dynamic decodeTemplate(Cursor& curs) {
  dynamic arr = folly::dynamic::array;

  // List of property names
  if ((BserType)curs.read<int8_t>() != BserType::Array) {
    throw std::runtime_error("Expected array encoding for property names");
  }
  auto names = decodeArray(curs);

  auto size = decodeInt(curs);

  while (size-- > 0) {
    dynamic obj = dynamic::object;

    for (auto& name : names) {
      auto bytes = curs.peekBytes();
      if ((BserType)bytes.at(0) == BserType::Skip) {
        obj[name.getString()] = nullptr;
        curs.skipAtMost(1);
        continue;
      }

      obj[name.getString()] = parseBser(curs);
    }

    arr.push_back(std::move(obj));
  }

  return arr;
}

static dynamic parseBser(Cursor& curs) {
  switch ((BserType)curs.read<int8_t>()) {
    case BserType::Int8:
      return curs.read<int8_t>();
    case BserType::Int16:
      return curs.read<int16_t>();
    case BserType::Int32:
      return curs.read<int32_t>();
    case BserType::Int64:
      return curs.read<int64_t>();
    case BserType::Real: {
      double dval;
      curs.pull((void*)&dval, sizeof(dval));
      return dval;
    }
    case BserType::Null:
      return nullptr;
    case BserType::True:
      return (bool)true;
    case BserType::False:
      return (bool)false;
    case BserType::String:
      return decodeString(curs);
    case BserType::Array:
      return decodeArray(curs);
    case BserType::Object:
      return decodeObject(curs);
    case BserType::Template:
      return decodeTemplate(curs);
    case BserType::Skip:
      throw std::runtime_error(
          "Skip not valid at this location in the bser stream");
    default:
      throw std::runtime_error("invalid bser encoding");
  }
}

static size_t decodeHeader(Cursor& curs) {
  char header[sizeof(kMagic)];
  curs.pull(header, sizeof(header));
  if (memcmp(header, kMagic, sizeof(kMagic))) {
    throw std::runtime_error("invalid BSER magic header");
  }

  auto enc = (BserType)curs.peekBytes().at(0);
  size_t int_size;
  switch (enc) {
    case BserType::Int8:
      int_size = 1;
      break;
    case BserType::Int16:
      int_size = 2;
      break;
    case BserType::Int32:
      int_size = 4;
      break;
    case BserType::Int64:
      int_size = 8;
      break;
    default:
      int_size = 0;
  }

  return int_size + 3 /* magic + int type */ + decodeInt(curs);
}

size_t decodePduLength(const folly::IOBuf* buf) {
  Cursor curs(buf);
  return decodeHeader(curs);
}

folly::dynamic parseBser(const IOBuf* buf) {
  Cursor curs(buf);

  decodeHeader(curs);
  return parseBser(curs);
}

folly::dynamic parseBser(ByteRange str) {
  auto buf = IOBuf::wrapBuffer(str.data(), str.size());
  return parseBser(&*buf);
}

folly::dynamic parseBser(StringPiece str) {
  return parseBser(ByteRange((uint8_t*)str.data(), str.size()));
}
}
}

/* vim:ts=2:sw=2:et:
 */
