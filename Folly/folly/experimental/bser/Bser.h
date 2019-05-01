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
#pragma once
#include <folly/CPortability.h>
#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <folly/io/IOBuf.h>
#include <folly/io/IOBufQueue.h>
#include <unordered_map>

/* This is an implementation of the BSER binary serialization scheme.
 * BSER was created as a binary, local-system-only representation of
 * JSON values.  It is more space efficient in its output text than JSON,
 * and cheaper to decode.
 * It has no requirement that string values be UTF-8.
 * BSER was created for use with Watchman.
 * https://facebook.github.io/watchman/docs/bser.html
 */

namespace folly {
namespace bser {

class FOLLY_EXPORT BserDecodeError : public std::runtime_error {
 public:
  using std::runtime_error::runtime_error;
};

enum class BserType : int8_t {
  Array = 0,
  Object,
  String,
  Int8,
  Int16,
  Int32,
  Int64,
  Real,
  True,
  False,
  Null,
  Template,
  Skip,
};
extern const uint8_t kMagic[2];

struct serialization_opts {
  serialization_opts();

  // Whether to sort keys of object values before serializing them.
  // Note that this is potentially slow and that it does not apply
  // to templated arrays defined via defineTemplate; its keys are always
  // emitted in the order defined by the template.
  bool sort_keys;

  // incremental growth size for the underlying Appender when allocating
  // storage for the encoded output
  size_t growth_increment;

  // BSER allows generating a more space efficient representation of a list of
  // object values.  These are stored as an "object template" listing the keys
  // of the objects ahead of the objects themselves.  The objects are then
  // serialized without repeating the key string for each element.
  //
  // You may use the templates field to associate a template with an
  // array.  You should construct this map after all mutations have been
  // performed on the dynamic instance that you intend to serialize as bser,
  // as it captures the address of the dynamic to match at encoding time.
  // https://facebook.github.io/watchman/docs/bser.html#array-of-templated-objects
  using TemplateMap = std::unordered_map<const folly::dynamic*, folly::dynamic>;
  folly::Optional<TemplateMap> templates;
};

// parse a BSER value from a variety of sources.
// The complete BSER data must be present to succeed.
folly::dynamic parseBser(folly::StringPiece);
folly::dynamic parseBser(folly::ByteRange);
folly::dynamic parseBser(const folly::IOBuf*);

// When reading incrementally, it is useful to know how much data to
// read to fully decode a BSER pdu.
// Throws std::out_of_range if more data needs to be read to decode
// the header, or throws a runtime_error if the header is invalid
size_t decodePduLength(const folly::IOBuf*);

folly::fbstring toBser(folly::dynamic const&, const serialization_opts&);
std::unique_ptr<folly::IOBuf> toBserIOBuf(
    folly::dynamic const&,
    const serialization_opts&);
} // namespace bser
} // namespace folly

/* vim:ts=2:sw=2:et:
 */
