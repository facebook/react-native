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

#include <folly/io/RecordIO.h>

#include <sys/types.h>

#include <folly/Exception.h>
#include <folly/FileUtil.h>
#include <folly/Memory.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/String.h>
#include <folly/portability/Unistd.h>

namespace folly {

using namespace recordio_helpers;

RecordIOWriter::RecordIOWriter(File file, uint32_t fileId)
    : file_(std::move(file)),
      fileId_(fileId),
      writeLock_(file_, std::defer_lock),
      filePos_(0) {
  if (!writeLock_.try_lock()) {
    throw std::runtime_error("RecordIOWriter: file locked by another process");
  }

  struct stat st;
  checkUnixError(fstat(file_.fd(), &st), "fstat() failed");

  filePos_ = st.st_size;
}

void RecordIOWriter::write(std::unique_ptr<IOBuf> buf) {
  size_t totalLength = prependHeader(buf, fileId_);
  if (totalLength == 0) {
    return; // nothing to do
  }

  DCHECK_EQ(buf->computeChainDataLength(), totalLength);

  // We're going to write.  Reserve space for ourselves.
  off_t pos = filePos_.fetch_add(off_t(totalLength));

#if FOLLY_HAVE_PWRITEV
  auto iov = buf->getIov();
  ssize_t bytes = pwritevFull(file_.fd(), iov.data(), iov.size(), pos);
#else
  buf->unshare();
  buf->coalesce();
  ssize_t bytes = pwriteFull(file_.fd(), buf->data(), buf->length(), pos);
#endif

  checkUnixError(bytes, "pwrite() failed");
  DCHECK_EQ(size_t(bytes), totalLength);
}

RecordIOReader::RecordIOReader(File file, uint32_t fileId)
    : map_(std::move(file)), fileId_(fileId) {}

RecordIOReader::Iterator::Iterator(ByteRange range, uint32_t fileId, off_t pos)
    : range_(range), fileId_(fileId), recordAndPos_(ByteRange(), 0) {
  if (size_t(pos) >= range_.size()) {
    // Note that this branch can execute if pos is negative as well.
    recordAndPos_.second = off_t(-1);
    range_.clear();
  } else {
    recordAndPos_.second = pos;
    range_.advance(size_t(pos));
    advanceToValid();
  }
}

void RecordIOReader::Iterator::advanceToValid() {
  ByteRange record = findRecord(range_, fileId_).record;
  if (record.empty()) {
    recordAndPos_ = std::make_pair(ByteRange(), off_t(-1));
    range_.clear(); // at end
  } else {
    size_t skipped = size_t(record.begin() - range_.begin());
    DCHECK_GE(skipped, headerSize());
    skipped -= headerSize();
    range_.advance(skipped);
    recordAndPos_.first = record;
    recordAndPos_.second += off_t(skipped);
  }
}

namespace recordio_helpers {

using recordio_detail::Header;

namespace {

constexpr uint32_t kHashSeed = 0xdeadbeef; // for mcurtiss

uint32_t headerHash(const Header& header) {
  return hash::SpookyHashV2::Hash32(
      &header, offsetof(Header, headerHash), kHashSeed);
}

std::pair<size_t, std::size_t> dataLengthAndHash(const IOBuf* buf) {
  size_t len = 0;
  hash::SpookyHashV2 hasher;
  hasher.Init(kHashSeed, kHashSeed);
  for (auto br : *buf) {
    len += br.size();
    hasher.Update(br.data(), br.size());
  }
  uint64_t hash1;
  uint64_t hash2;
  hasher.Final(&hash1, &hash2);
  if (len + headerSize() >= std::numeric_limits<uint32_t>::max()) {
    throw std::invalid_argument("Record length must fit in 32 bits");
  }
  return std::make_pair(len, static_cast<std::size_t>(hash1));
}

std::size_t dataHash(ByteRange range) {
  return hash::SpookyHashV2::Hash64(range.data(), range.size(), kHashSeed);
}

} // namespace

size_t prependHeader(std::unique_ptr<IOBuf>& buf, uint32_t fileId) {
  if (fileId == 0) {
    throw std::invalid_argument("invalid file id");
  }
  auto lengthAndHash = dataLengthAndHash(buf.get());
  if (lengthAndHash.first == 0) {
    return 0; // empty, nothing to do, no zero-length records
  }

  // Prepend to the first buffer in the chain if we have room, otherwise
  // prepend a new buffer.
  if (buf->headroom() >= headerSize()) {
    buf->unshareOne();
    buf->prepend(headerSize());
  } else {
    auto b = IOBuf::create(headerSize());
    b->append(headerSize());
    b->appendChain(std::move(buf));
    buf = std::move(b);
  }
  Header* header = reinterpret_cast<Header*>(buf->writableData());
  memset(header, 0, sizeof(Header));
  header->magic = Header::kMagic;
  header->fileId = fileId;
  header->dataLength = uint32_t(lengthAndHash.first);
  header->dataHash = lengthAndHash.second;
  header->headerHash = headerHash(*header);

  return lengthAndHash.first + headerSize();
}

RecordInfo validateRecord(ByteRange range, uint32_t fileId) {
  if (range.size() <= headerSize()) { // records may not be empty
    return {0, {}};
  }
  const Header* header = reinterpret_cast<const Header*>(range.begin());
  range.advance(sizeof(Header));
  if (header->magic != Header::kMagic || header->version != 0 ||
      header->hashFunction != 0 || header->flags != 0 ||
      (fileId != 0 && header->fileId != fileId) ||
      header->dataLength > range.size()) {
    return {0, {}};
  }
  if (headerHash(*header) != header->headerHash) {
    return {0, {}};
  }
  range.reset(range.begin(), header->dataLength);
  if (dataHash(range) != header->dataHash) {
    return {0, {}};
  }
  return {header->fileId, range};
}

RecordInfo
findRecord(ByteRange searchRange, ByteRange wholeRange, uint32_t fileId) {
  static const uint32_t magic = Header::kMagic;
  static const ByteRange magicRange(
      reinterpret_cast<const uint8_t*>(&magic), sizeof(magic));

  DCHECK_GE(searchRange.begin(), wholeRange.begin());
  DCHECK_LE(searchRange.end(), wholeRange.end());

  const uint8_t* start = searchRange.begin();
  const uint8_t* end =
      std::min(searchRange.end(), wholeRange.end() - sizeof(Header));
  // end-1: the last place where a Header could start
  while (start < end) {
    auto p = ByteRange(start, end + sizeof(magic)).find(magicRange);
    if (p == ByteRange::npos) {
      break;
    }

    start += p;
    auto r = validateRecord(ByteRange(start, wholeRange.end()), fileId);
    if (!r.record.empty()) {
      return r;
    }

    // No repeated prefix in magic, so we can do better than start++
    start += sizeof(magic);
  }

  return {0, {}};
}

} // namespace recordio_helpers

} // namespace folly
