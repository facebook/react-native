/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/experimental/bser/Bser.h>

#include <folly/io/Cursor.h>

using namespace folly;
using folly::bser::serialization_opts;
using folly::io::QueueAppender;

namespace folly {
namespace bser {

const uint8_t kMagic[2] = {0, 1};

static void bserEncode(
    dynamic const& dyn,
    QueueAppender& appender,
    const serialization_opts& opts);

serialization_opts::serialization_opts()
    : sort_keys(false), growth_increment(8192) {}

static const dynamic* getTemplate(
    const serialization_opts& opts,
    dynamic const& dynArray) {
  if (!opts.templates.hasValue()) {
    return nullptr;
  }
  const auto& templates = opts.templates.value();
  const auto it = templates.find(&dynArray);
  if (it == templates.end()) {
    return nullptr;
  }
  return &it->second;
}

static void bserEncodeInt(int64_t ival, QueueAppender& appender) {
  /* Return the smallest size int that can store the value */
  auto size =
      ((ival == ((int8_t)ival))
           ? 1
           : (ival == ((int16_t)ival)) ? 2 : (ival == ((int32_t)ival)) ? 4 : 8);

  switch (size) {
    case 1:
      appender.write((int8_t)BserType::Int8);
      appender.write(int8_t(ival));
      return;
    case 2:
      appender.write((int8_t)BserType::Int16);
      appender.write(int16_t(ival));
      return;
    case 4:
      appender.write((int8_t)BserType::Int32);
      appender.write(int32_t(ival));
      return;
    case 8:
      appender.write((int8_t)BserType::Int64);
      appender.write(ival);
      return;
    default:
      throw std::runtime_error("impossible integer size");
  }
}

static void bserEncodeString(folly::StringPiece str, QueueAppender& appender) {
  appender.write((int8_t)BserType::String);
  bserEncodeInt(int64_t(str.size()), appender);
  appender.push((uint8_t*)str.data(), str.size());
}

static void bserEncodeArraySimple(
    dynamic const& dyn,
    QueueAppender& appender,
    const serialization_opts& opts) {
  appender.write((int8_t)BserType::Array);
  bserEncodeInt(int64_t(dyn.size()), appender);
  for (const auto& ele : dyn) {
    bserEncode(ele, appender, opts);
  }
}

static void bserEncodeArray(
    dynamic const& dyn,
    QueueAppender& appender,
    const serialization_opts& opts) {
  auto templ = getTemplate(opts, dyn);
  if (UNLIKELY(templ != nullptr)) {
    appender.write((int8_t)BserType::Template);

    // Emit the list of property names
    bserEncodeArraySimple(*templ, appender, opts);

    // The number of objects in the array
    bserEncodeInt(int64_t(dyn.size()), appender);

    // For each object in the array
    for (const auto& ele : dyn) {
      // For each key in the template
      for (const auto& name : *templ) {
        if (auto found = ele.get_ptr(name)) {
          if (found->isNull()) {
            // Prefer to Skip rather than encode a null value for
            // compatibility with the other bser implementations
            appender.write((int8_t)BserType::Skip);
          } else {
            bserEncode(*found, appender, opts);
          }
        } else {
          appender.write((int8_t)BserType::Skip);
        }
      }
    }
    return;
  }

  bserEncodeArraySimple(dyn, appender, opts);
}

static void bserEncodeObject(
    dynamic const& dyn,
    QueueAppender& appender,
    const serialization_opts& opts) {
  appender.write((int8_t)BserType::Object);
  bserEncodeInt(int64_t(dyn.size()), appender);

  if (opts.sort_keys) {
    std::vector<std::pair<dynamic, dynamic>> sorted(
        dyn.items().begin(), dyn.items().end());
    std::sort(sorted.begin(), sorted.end());
    for (const auto& item : sorted) {
      bserEncode(item.first, appender, opts);
      bserEncode(item.second, appender, opts);
    }
  } else {
    for (const auto& item : dyn.items()) {
      bserEncode(item.first, appender, opts);
      bserEncode(item.second, appender, opts);
    }
  }
}

static void bserEncode(
    dynamic const& dyn,
    QueueAppender& appender,
    const serialization_opts& opts) {
  switch (dyn.type()) {
    case dynamic::Type::NULLT:
      appender.write((int8_t)BserType::Null);
      return;
    case dynamic::Type::BOOL:
      appender.write(
          (int8_t)(dyn.getBool() ? BserType::True : BserType::False));
      return;
    case dynamic::Type::DOUBLE: {
      double dval = dyn.getDouble();
      appender.write((int8_t)BserType::Real);
      appender.write(dval);
      return;
    }
    case dynamic::Type::INT64:
      bserEncodeInt(dyn.getInt(), appender);
      return;
    case dynamic::Type::OBJECT:
      bserEncodeObject(dyn, appender, opts);
      return;
    case dynamic::Type::ARRAY:
      bserEncodeArray(dyn, appender, opts);
      return;
    case dynamic::Type::STRING:
      bserEncodeString(dyn.getString(), appender);
      return;
  }
}

std::unique_ptr<folly::IOBuf> toBserIOBuf(
    folly::dynamic const& dyn,
    const serialization_opts& opts) {
  IOBufQueue q(IOBufQueue::cacheChainLength());
  uint8_t hdrbuf[sizeof(kMagic) + 1 + sizeof(int64_t)];

  // Reserve some headroom for the overall PDU size; we'll fill this in
  // after we've serialized the data and know the length
  auto firstbuf = IOBuf::create(opts.growth_increment);
  firstbuf->advance(sizeof(hdrbuf));
  q.append(std::move(firstbuf));

  // encode the value
  QueueAppender appender(&q, opts.growth_increment);
  bserEncode(dyn, appender, opts);

  // compute the length
  auto len = q.chainLength();
  if (len > uint64_t(std::numeric_limits<int64_t>::max())) {
    throw std::range_error(folly::to<std::string>(
        "serialized data size ", len, " is too large to represent as BSER"));
  }

  // This is a bit verbose, but it computes a header that is appropriate
  // to the size of the serialized data

  memcpy(hdrbuf, kMagic, sizeof(kMagic));
  size_t hdrlen = sizeof(kMagic) + 1;
  auto magicptr = hdrbuf + sizeof(kMagic);
  auto lenptr = hdrbuf + hdrlen;

  if (len > uint64_t(std::numeric_limits<int32_t>::max())) {
    *magicptr = (int8_t)BserType::Int64;
    *(int64_t*)lenptr = (int64_t)len;
    hdrlen += sizeof(int64_t);
  } else if (len > uint64_t(std::numeric_limits<int16_t>::max())) {
    *magicptr = (int8_t)BserType::Int32;
    *(int32_t*)lenptr = (int32_t)len;
    hdrlen += sizeof(int32_t);
  } else if (len > uint64_t(std::numeric_limits<int8_t>::max())) {
    *magicptr = (int8_t)BserType::Int16;
    *(int16_t*)lenptr = (int16_t)len;
    hdrlen += sizeof(int16_t);
  } else {
    *magicptr = (int8_t)BserType::Int8;
    *(int8_t*)lenptr = (int8_t)len;
    hdrlen += sizeof(int8_t);
  }

  // and place the data in the headroom
  q.prepend(hdrbuf, hdrlen);

  return q.move();
}

fbstring toBser(dynamic const& dyn, const serialization_opts& opts) {
  auto buf = toBserIOBuf(dyn, opts);
  return buf->moveToFbString();
}
} // namespace bser
} // namespace folly

/* vim:ts=2:sw=2:et:
 */
