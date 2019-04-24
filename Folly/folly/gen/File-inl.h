/*
 * Copyright 2014-present Facebook, Inc.
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

#ifndef FOLLY_GEN_FILE_H_
#error This file may only be included from folly/gen/File.h
#endif

#include <system_error>

#include <folly/gen/String.h>

namespace folly {
namespace gen {
namespace detail {

class FileReader : public GenImpl<ByteRange, FileReader> {
 public:
  FileReader(File file, std::unique_ptr<IOBuf> buffer)
      : file_(std::move(file)), buffer_(std::move(buffer)) {
    buffer_->clear();
  }

  template <class Body>
  bool apply(Body&& body) const {
    for (;;) {
      ssize_t n;
      do {
        n = ::read(file_.fd(), buffer_->writableTail(), buffer_->capacity());
      } while (n == -1 && errno == EINTR);
      if (n == -1) {
        throw std::system_error(errno, std::system_category(), "read failed");
      }
      if (n == 0) {
        return true;
      }
      if (!body(ByteRange(buffer_->tail(), size_t(n)))) {
        return false;
      }
    }
  }

  // Technically, there could be infinite files (e.g. /dev/random), but people
  // who open those can do so at their own risk.
  static constexpr bool infinite = false;

 private:
  File file_;
  std::unique_ptr<IOBuf> buffer_;
};

class FileWriter : public Operator<FileWriter> {
 public:
  FileWriter(File file, std::unique_ptr<IOBuf> buffer)
      : file_(std::move(file)), buffer_(std::move(buffer)) {
    if (buffer_) {
      buffer_->clear();
    }
  }

  template <class Source, class Value>
  void compose(const GenImpl<Value, Source>& source) const {
    auto fn = [&](ByteRange v) {
      if (!this->buffer_ || v.size() >= this->buffer_->capacity()) {
        this->flushBuffer();
        this->write(v);
      } else {
        if (v.size() > this->buffer_->tailroom()) {
          this->flushBuffer();
        }
        memcpy(this->buffer_->writableTail(), v.data(), v.size());
        this->buffer_->append(v.size());
      }
    };

    // Iterate
    source.foreach(std::move(fn));

    flushBuffer();
    file_.close();
  }

 private:
  void write(ByteRange v) const {
    ssize_t n;
    while (!v.empty()) {
      do {
        n = ::write(file_.fd(), v.data(), v.size());
      } while (n == -1 && errno == EINTR);
      if (n == -1) {
        throw std::system_error(
            errno, std::system_category(), "write() failed");
      }
      v.advance(size_t(n));
    }
  }

  void flushBuffer() const {
    if (buffer_ && buffer_->length() != 0) {
      write(ByteRange(buffer_->data(), buffer_->length()));
      buffer_->clear();
    }
  }

  mutable File file_;
  std::unique_ptr<IOBuf> buffer_;
};

inline auto byLineImpl(File file, char delim, bool keepDelimiter) {
  // clang-format off
  return fromFile(std::move(file))
      | eachAs<StringPiece>()
      | resplit(delim, keepDelimiter);
  // clang-format on
}

} // namespace detail

/**
 * Generator which reads lines from a file.
 * Note: This produces StringPieces which reference temporary strings which are
 * only valid during iteration.
 */
inline auto byLineFull(File file, char delim = '\n') {
  return detail::byLineImpl(std::move(file), delim, true);
}

inline auto byLineFull(int fd, char delim = '\n') {
  return byLineFull(File(fd), delim);
}

inline auto byLineFull(const char* f, char delim = '\n') {
  return byLineFull(File(f), delim);
}

inline auto byLine(File file, char delim = '\n') {
  return detail::byLineImpl(std::move(file), delim, false);
}

inline auto byLine(int fd, char delim = '\n') {
  return byLine(File(fd), delim);
}

inline auto byLine(const char* f, char delim = '\n') {
  return byLine(File(f), delim);
}

} // namespace gen
} // namespace folly
