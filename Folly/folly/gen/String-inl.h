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

#ifndef FOLLY_GEN_STRING_H_
#error This file may only be included from folly/gen/String.h
#endif

#include <folly/Conv.h>
#include <folly/Portability.h>
#include <folly/String.h>

namespace folly {
namespace gen {
namespace detail {

/**
 * Finds the first occurrence of delimiter in "in", advances "in" past the
 * delimiter.  Populates "prefix" with the consumed bytes, including the
 * delimiter.
 *
 * Returns the number of trailing bytes of "prefix" that make up the
 * delimiter, or 0 if the delimiter was not found.
 */
inline size_t
splitPrefix(StringPiece& in, StringPiece& prefix, char delimiter) {
  size_t found = in.find(delimiter);
  if (found != StringPiece::npos) {
    ++found;
    prefix.assign(in.data(), in.data() + found);
    in.advance(found);
    return 1;
  }
  prefix.clear();
  return 0;
}

/**
 * As above, but supports multibyte delimiters.
 */
inline size_t
splitPrefix(StringPiece& in, StringPiece& prefix, StringPiece delimiter) {
  auto found = in.find(delimiter);
  if (found != StringPiece::npos) {
    found += delimiter.size();
    prefix.assign(in.data(), in.data() + found);
    in.advance(found);
    return delimiter.size();
  }
  prefix.clear();
  return 0;
}

/**
 * As above, but splits by any of the EOL terms: \r, \n, or \r\n.
 */
inline size_t splitPrefix(StringPiece& in, StringPiece& prefix, MixedNewlines) {
  const auto kCRLF = "\r\n";
  const size_t kLenCRLF = 2;

  auto p = in.find_first_of(kCRLF);
  if (p != std::string::npos) {
    const auto in_start = in.data();
    size_t delim_len = 1;
    in.advance(p);
    // Either remove an MS-DOS CR-LF 2-byte newline, or eat 1 byte at a time.
    if (in.removePrefix(kCRLF)) {
      delim_len = kLenCRLF;
    } else {
      in.advance(delim_len);
    }
    prefix.assign(in_start, in.data());
    return delim_len;
  }
  prefix.clear();
  return 0;
}

inline const char* ch(const unsigned char* p) {
  return reinterpret_cast<const char*>(p);
}

// Chop s into pieces of at most maxLength, feed them to cb
template <class Callback>
bool consumeFixedSizeChunks(Callback& cb, StringPiece& s, uint64_t maxLength) {
  while (!s.empty()) {
    auto num_to_add = s.size();
    if (maxLength) {
      num_to_add = std::min<uint64_t>(num_to_add, maxLength);
    }
    if (!cb(StringPiece(s.begin(), num_to_add))) {
      return false;
    }
    s.advance(num_to_add);
  }
  return true;
}

// Consumes all of buffer, plus n chars from s.
template <class Callback>
bool consumeBufferPlus(Callback& cb, IOBuf& buf, StringPiece& s, uint64_t n) {
  buf.reserve(0, n);
  memcpy(buf.writableTail(), s.data(), n);
  buf.append(n);
  s.advance(n);
  if (!cb(StringPiece(detail::ch(buf.data()), buf.length()))) {
    return false;
  }
  buf.clear();
  return true;
}

} // namespace detail

template <class Callback>
bool StreamSplitter<Callback>::flush() {
  CHECK(maxLength_ == 0 || buffer_.length() < maxLength_);
  if (!pieceCb_(StringPiece(detail::ch(buffer_.data()), buffer_.length()))) {
    return false;
  }
  // We are ready to handle another stream now.
  buffer_.clear();
  return true;
}

template <class Callback>
bool StreamSplitter<Callback>::operator()(StringPiece in) {
  StringPiece prefix;
  // NB This code assumes a 1-byte delimiter. It's not too hard to support
  // multibyte delimiters, just remember that maxLength_ chunks can end up
  // falling in the middle of a delimiter.
  bool found = detail::splitPrefix(in, prefix, delimiter_);
  if (buffer_.length() != 0) {
    if (found) {
      uint64_t num_to_add = prefix.size();
      if (maxLength_) {
        CHECK(buffer_.length() < maxLength_);
        // Consume as much of prefix as possible without exceeding maxLength_
        num_to_add = std::min(maxLength_ - buffer_.length(), num_to_add);
      }

      // Append part of the prefix to the buffer, and send it to the callback
      if (!detail::consumeBufferPlus(pieceCb_, buffer_, prefix, num_to_add)) {
        return false;
      }

      if (!detail::consumeFixedSizeChunks(pieceCb_, prefix, maxLength_)) {
        return false;
      }

      found = detail::splitPrefix(in, prefix, delimiter_);
      // Post-conditions:
      //  - we consumed all of buffer_ and all of the first prefix.
      //  - found, in, and prefix reflect the second delimiter_ search
    } else if (maxLength_ && buffer_.length() + in.size() >= maxLength_) {
      // Send all of buffer_, plus a bit of in, to the callback
      if (!detail::consumeBufferPlus(
              pieceCb_, buffer_, in, maxLength_ - buffer_.length())) {
        return false;
      }
      // Post-conditions:
      //  - we consumed all of buffer, and the minimal # of bytes from in
      //  - found is false
    } // Otherwise: found is false & we cannot invoke the callback this turn
  }
  // Post-condition: buffer_ is nonempty only if found is false **and**
  // len(buffer + in) < maxLength_.

  // Send lines to callback directly from input (no buffer)
  while (found) { // Buffer guaranteed to be empty
    if (!detail::consumeFixedSizeChunks(pieceCb_, prefix, maxLength_)) {
      return false;
    }
    found = detail::splitPrefix(in, prefix, delimiter_);
  }

  // No more delimiters left; consume 'in' until it is shorter than maxLength_
  if (maxLength_) {
    while (in.size() >= maxLength_) { // Buffer is guaranteed to be empty
      if (!pieceCb_(StringPiece(in.begin(), maxLength_))) {
        return false;
      }
      in.advance(maxLength_);
    }
  }

  if (!in.empty()) { // Buffer may be nonempty
    // Incomplete line left, append to buffer
    buffer_.reserve(0, in.size());
    memcpy(buffer_.writableTail(), in.data(), in.size());
    buffer_.append(in.size());
  }
  CHECK(maxLength_ == 0 || buffer_.length() < maxLength_);
  return true;
}

namespace detail {

class StringResplitter : public Operator<StringResplitter> {
  char delimiter_;
  bool keepDelimiter_;

 public:
  explicit StringResplitter(char delimiter, bool keepDelimiter = false)
      : delimiter_(delimiter), keepDelimiter_(keepDelimiter) {}

  template <class Source>
  class Generator : public GenImpl<StringPiece, Generator<Source>> {
    Source source_;
    char delimiter_;
    bool keepDelimiter_;

   public:
    Generator(Source source, char delimiter, bool keepDelimiter)
        : source_(std::move(source)),
          delimiter_(delimiter),
          keepDelimiter_(keepDelimiter) {}

    template <class Body>
    bool apply(Body&& body) const {
      auto splitter =
          streamSplitter(this->delimiter_, [this, &body](StringPiece s) {
            // The stream ended with a delimiter; our contract is to swallow
            // the final empty piece.
            if (s.empty()) {
              return true;
            }
            if (s.back() != this->delimiter_) {
              return body(s);
            }
            if (!keepDelimiter_) {
              s.pop_back(); // Remove the 1-character delimiter
            }
            return body(s);
          });
      if (!source_.apply(splitter)) {
        return false;
      }
      return splitter.flush();
    }

    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), delimiter_, keepDelimiter_);
  }

  template <class Source, class Value, class Gen = Generator<Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), delimiter_, keepDelimiter_);
  }
};

template <class DelimiterType = char>
class SplitStringSource
    : public GenImpl<StringPiece, SplitStringSource<DelimiterType>> {
  StringPiece source_;
  DelimiterType delimiter_;

 public:
  SplitStringSource(const StringPiece source, DelimiterType delimiter)
      : source_(source), delimiter_(std::move(delimiter)) {}

  template <class Body>
  bool apply(Body&& body) const {
    StringPiece rest(source_);
    StringPiece prefix;
    while (size_t delim_len = splitPrefix(rest, prefix, this->delimiter_)) {
      prefix.subtract(delim_len); // Remove the delimiter
      if (!body(prefix)) {
        return false;
      }
    }
    if (!rest.empty()) {
      if (!body(rest)) {
        return false;
      }
    }
    return true;
  }
};

/**
 * Unsplit - For joining tokens from a generator into a string.  This is
 * the inverse of `split` above.
 *
 * This type is primarily used through the 'unsplit' function.
 */
template <class Delimiter, class Output>
class Unsplit : public Operator<Unsplit<Delimiter, Output>> {
  Delimiter delimiter_;

 public:
  explicit Unsplit(const Delimiter& delimiter) : delimiter_(delimiter) {}

  template <class Source, class Value>
  Output compose(const GenImpl<Value, Source>& source) const {
    Output outputBuffer;
    UnsplitBuffer<Delimiter, Output> unsplitter(delimiter_, &outputBuffer);
    unsplitter.compose(source);
    return outputBuffer;
  }
};

/**
 * UnsplitBuffer - For joining tokens from a generator into a string,
 * and inserting them into a custom buffer.
 *
 * This type is primarily used through the 'unsplit' function.
 */
template <class Delimiter, class OutputBuffer>
class UnsplitBuffer : public Operator<UnsplitBuffer<Delimiter, OutputBuffer>> {
  Delimiter delimiter_;
  OutputBuffer* outputBuffer_;

 public:
  UnsplitBuffer(const Delimiter& delimiter, OutputBuffer* outputBuffer)
      : delimiter_(delimiter), outputBuffer_(outputBuffer) {
    CHECK(outputBuffer);
  }

  template <class Source, class Value>
  void compose(const GenImpl<Value, Source>& source) const {
    // If the output buffer is empty, we skip inserting the delimiter for the
    // first element.
    bool skipDelim = outputBuffer_->empty();
    source | [&](Value v) {
      if (skipDelim) {
        skipDelim = false;
        toAppend(std::forward<Value>(v), outputBuffer_);
      } else {
        toAppend(delimiter_, std::forward<Value>(v), outputBuffer_);
      }
    };
  }
};

/**
 * Hack for static for-like constructs
 */
template <class Target, class = void>
inline Target passthrough(Target target) {
  return target;
}

FOLLY_PUSH_WARNING
#ifdef __clang__
// Clang isn't happy with eatField() hack below.
#pragma GCC diagnostic ignored "-Wreturn-stack-address"
#endif // __clang__

/**
 * ParseToTuple - For splitting a record and immediatlely converting it to a
 * target tuple type. Primary used through the 'eachToTuple' helper, like so:
 *
 *  auto config
 *    = split("1:a 2:b", ' ')
 *    | eachToTuple<int, string>()
 *    | as<vector<tuple<int, string>>>();
 *
 */
template <class TargetContainer, class Delimiter, class... Targets>
class SplitTo {
  Delimiter delimiter_;

 public:
  explicit SplitTo(Delimiter delimiter) : delimiter_(delimiter) {}

  TargetContainer operator()(StringPiece line) const {
    int i = 0;
    StringPiece fields[sizeof...(Targets)];
    // HACK(tjackson): Used for referencing fields[] corresponding to variadic
    // template parameters.
    auto eatField = [&]() -> StringPiece& { return fields[i++]; };
    if (!split(
            delimiter_,
            line,
            detail::passthrough<StringPiece&, Targets>(eatField())...)) {
      throw std::runtime_error("field count mismatch");
    }
    i = 0;
    return TargetContainer(To<Targets>()(eatField())...);
  }
};

FOLLY_POP_WARNING

} // namespace detail

} // namespace gen
} // namespace folly
