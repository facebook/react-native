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

#ifndef FOLLY_IO_RECORDIO_H_
#error This file may only be included from folly/io/RecordIO.h
#endif

#include <boost/iterator/iterator_facade.hpp>

#include <folly/hash/SpookyHashV2.h>

namespace folly {

class RecordIOReader::Iterator : public boost::iterator_facade<
                                     RecordIOReader::Iterator,
                                     const std::pair<ByteRange, off_t>,
                                     boost::forward_traversal_tag> {
  friend class boost::iterator_core_access;
  friend class RecordIOReader;

 private:
  Iterator(ByteRange range, uint32_t fileId, off_t pos);

  reference dereference() const {
    return recordAndPos_;
  }
  bool equal(const Iterator& other) const {
    return range_ == other.range_;
  }
  void increment() {
    size_t skip = recordio_helpers::headerSize() + recordAndPos_.first.size();
    recordAndPos_.second += off_t(skip);
    range_.advance(skip);
    advanceToValid();
  }

  void advanceToValid();
  ByteRange range_;
  uint32_t fileId_;
  // stored as a pair so we can return by reference in dereference()
  std::pair<ByteRange, off_t> recordAndPos_;
};

inline auto RecordIOReader::cbegin() const -> Iterator {
  return seek(0);
}
inline auto RecordIOReader::begin() const -> Iterator {
  return cbegin();
}
inline auto RecordIOReader::cend() const -> Iterator {
  return seek(off_t(-1));
}
inline auto RecordIOReader::end() const -> Iterator {
  return cend();
}
inline auto RecordIOReader::seek(off_t pos) const -> Iterator {
  return Iterator(map_.range(), fileId_, pos);
}

namespace recordio_helpers {

namespace recordio_detail {

FOLLY_PACK_PUSH
struct Header {
  // First 4 bytes of SHA1("zuck"), big-endian
  // Any values will do, except that the sequence must not have a
  // repeated prefix (that is, if we see kMagic, we know that the next
  // occurrence must start at least 4 bytes later)
  static constexpr uint32_t kMagic = 0xeac313a1;
  uint32_t magic;
  uint8_t version; // backwards incompatible version, currently 0
  uint8_t hashFunction; // 0 = SpookyHashV2
  uint16_t flags; // reserved (must be 0)
  uint32_t fileId; // unique file ID
  uint32_t dataLength;
  std::size_t dataHash;
  uint32_t headerHash; // must be last
} FOLLY_PACK_ATTR;
FOLLY_PACK_POP

static_assert(
    offsetof(Header, headerHash) + sizeof(Header::headerHash) == sizeof(Header),
    "invalid header layout");

} // namespace recordio_detail

constexpr size_t headerSize() {
  return sizeof(recordio_detail::Header);
}

inline RecordInfo findRecord(ByteRange range, uint32_t fileId) {
  return findRecord(range, range, fileId);
}

} // namespace recordio_helpers

} // namespace folly
