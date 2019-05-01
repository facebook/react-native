/*
 * Copyright 2012-present Facebook, Inc.
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
#define FOLLY_FORMAT_H_

#include <cstdio>
#include <stdexcept>
#include <tuple>
#include <type_traits>

#include <folly/CPortability.h>
#include <folly/Conv.h>
#include <folly/FormatArg.h>
#include <folly/Range.h>
#include <folly/String.h>
#include <folly/Traits.h>

// Ignore shadowing warnings within this file, so includers can use -Wshadow.
FOLLY_PUSH_WARNING
FOLLY_GNU_DISABLE_WARNING("-Wshadow")

namespace folly {

// forward declarations
template <bool containerMode, class... Args>
class Formatter;
template <class... Args>
Formatter<false, Args...> format(StringPiece fmt, Args&&... args);
template <class C>
Formatter<true, C> vformat(StringPiece fmt, C&& container);
template <class T, class Enable = void>
class FormatValue;

// meta-attribute to identify formatters in this sea of template weirdness
namespace detail {
class FormatterTag {};
} // namespace detail

/**
 * Formatter class.
 *
 * Note that this class is tricky, as it keeps *references* to its lvalue
 * arguments (while it takes ownership of the temporaries), and it doesn't
 * copy the passed-in format string. Thankfully, you can't use this
 * directly, you have to use format(...) below.
 */

/* BaseFormatter class.
 * Overridable behaviours:
 * You may override the actual formatting of positional parameters in
 * `doFormatArg`. The Formatter class provides the default implementation.
 *
 * You may also override `doFormat` and `getSizeArg`. These override points were
 * added to permit static analysis of format strings, when it is inconvenient
 * or impossible to instantiate a BaseFormatter with the correct storage
 */
template <class Derived, bool containerMode, class... Args>
class BaseFormatter {
 public:
  /**
   * Append to output.  out(StringPiece sp) may be called (more than once)
   */
  template <class Output>
  void operator()(Output& out) const;

  /**
   * Append to a string.
   */
  template <class Str>
  typename std::enable_if<IsSomeString<Str>::value>::type appendTo(
      Str& str) const {
    auto appender = [&str](StringPiece s) { str.append(s.data(), s.size()); };
    (*this)(appender);
  }

  /**
   * Conversion to string
   */
  std::string str() const {
    std::string s;
    appendTo(s);
    return s;
  }

  /**
   * Conversion to fbstring
   */
  fbstring fbstr() const {
    fbstring s;
    appendTo(s);
    return s;
  }

  /**
   * Metadata to identify generated children of BaseFormatter
   */
  typedef detail::FormatterTag IsFormatter;
  typedef BaseFormatter BaseType;

 private:
  typedef std::tuple<Args...> ValueTuple;
  static constexpr size_t valueCount = std::tuple_size<ValueTuple>::value;

  Derived const& asDerived() const {
    return *static_cast<const Derived*>(this);
  }

  template <size_t K, class Callback>
  typename std::enable_if<K == valueCount>::type
  doFormatFrom(size_t i, FormatArg& arg, Callback& /*cb*/) const {
    arg.error("argument index out of range, max=", i);
  }

  template <size_t K, class Callback>
  typename std::enable_if<(K < valueCount)>::type
  doFormatFrom(size_t i, FormatArg& arg, Callback& cb) const {
    if (i == K) {
      asDerived().template doFormatArg<K>(arg, cb);
    } else {
      doFormatFrom<K + 1>(i, arg, cb);
    }
  }

  template <class Callback>
  void doFormat(size_t i, FormatArg& arg, Callback& cb) const {
    return doFormatFrom<0>(i, arg, cb);
  }

  template <size_t K>
  typename std::enable_if<K == valueCount, int>::type getSizeArgFrom(
      size_t i,
      const FormatArg& arg) const {
    arg.error("argument index out of range, max=", i);
  }

  template <class T>
  typename std::enable_if<
      std::is_integral<T>::value && !std::is_same<T, bool>::value,
      int>::type
  getValue(const FormatValue<T>& format, const FormatArg&) const {
    return static_cast<int>(format.getValue());
  }

  template <class T>
  typename std::enable_if<
      !std::is_integral<T>::value || std::is_same<T, bool>::value,
      int>::type
  getValue(const FormatValue<T>&, const FormatArg& arg) const {
    arg.error("dynamic field width argument must be integral");
  }

  template <size_t K>
      typename std::enable_if <
      K<valueCount, int>::type getSizeArgFrom(size_t i, const FormatArg& arg)
          const {
    if (i == K) {
      return getValue(getFormatValue<K>(), arg);
    }
    return getSizeArgFrom<K + 1>(i, arg);
  }

  int getSizeArg(size_t i, const FormatArg& arg) const {
    return getSizeArgFrom<0>(i, arg);
  }

  StringPiece str_;

 protected:
  explicit BaseFormatter(StringPiece str, Args&&... args);

  // Not copyable
  BaseFormatter(const BaseFormatter&) = delete;
  BaseFormatter& operator=(const BaseFormatter&) = delete;

  // Movable, but the move constructor and assignment operator are private,
  // for the exclusive use of format() (below).  This way, you can't create
  // a Formatter object, but can handle references to it (for streaming,
  // conversion to string, etc) -- which is good, as Formatter objects are
  // dangerous (they may hold references).
  BaseFormatter(BaseFormatter&&) = default;
  BaseFormatter& operator=(BaseFormatter&&) = default;

  template <size_t K>
  using ArgType = typename std::tuple_element<K, ValueTuple>::type;

  template <size_t K>
  FormatValue<typename std::decay<ArgType<K>>::type> getFormatValue() const {
    return FormatValue<typename std::decay<ArgType<K>>::type>(
        std::get<K>(values_));
  }

  ValueTuple values_;
};

template <bool containerMode, class... Args>
class Formatter : public BaseFormatter<
                      Formatter<containerMode, Args...>,
                      containerMode,
                      Args...> {
 private:
  explicit Formatter(StringPiece& str, Args&&... args)
      : BaseFormatter<
            Formatter<containerMode, Args...>,
            containerMode,
            Args...>(str, std::forward<Args>(args)...) {
    static_assert(
        !containerMode || sizeof...(Args) == 1,
        "Exactly one argument required in container mode");
  }

  template <size_t K, class Callback>
  void doFormatArg(FormatArg& arg, Callback& cb) const {
    this->template getFormatValue<K>().format(arg, cb);
  }

  friend class BaseFormatter<
      Formatter<containerMode, Args...>,
      containerMode,
      Args...>;

  template <class... A>
  friend Formatter<false, A...> format(StringPiece fmt, A&&... arg);
  template <class C>
  friend Formatter<true, C> vformat(StringPiece fmt, C&& container);
};

/**
 * Formatter objects can be written to streams.
 */
template <bool containerMode, class... Args>
std::ostream& operator<<(
    std::ostream& out,
    const Formatter<containerMode, Args...>& formatter) {
  auto writer = [&out](StringPiece sp) {
    out.write(sp.data(), std::streamsize(sp.size()));
  };
  formatter(writer);
  return out;
}

/**
 * Formatter objects can be written to stdio FILEs.
 */
template <class Derived, bool containerMode, class... Args>
void writeTo(
    FILE* fp,
    const BaseFormatter<Derived, containerMode, Args...>& formatter);

/**
 * Create a formatter object.
 *
 * std::string formatted = format("{} {}", 23, 42).str();
 * LOG(INFO) << format("{} {}", 23, 42);
 * writeTo(stdout, format("{} {}", 23, 42));
 */
template <class... Args>
Formatter<false, Args...> format(StringPiece fmt, Args&&... args) {
  return Formatter<false, Args...>(fmt, std::forward<Args>(args)...);
}

/**
 * Like format(), but immediately returns the formatted string instead of an
 * intermediate format object.
 */
template <class... Args>
inline std::string sformat(StringPiece fmt, Args&&... args) {
  return format(fmt, std::forward<Args>(args)...).str();
}

/**
 * Create a formatter object that takes one argument (of container type)
 * and uses that container to get argument values from.
 *
 * std::map<string, string> map { {"hello", "world"}, {"answer", "42"} };
 *
 * The following are equivalent:
 * format("{0[hello]} {0[answer]}", map);
 *
 * vformat("{hello} {answer}", map);
 *
 * but the latter is cleaner.
 */
template <class Container>
Formatter<true, Container> vformat(StringPiece fmt, Container&& container) {
  return Formatter<true, Container>(fmt, std::forward<Container>(container));
}

/**
 * Like vformat(), but immediately returns the formatted string instead of an
 * intermediate format object.
 */
template <class Container>
inline std::string svformat(StringPiece fmt, Container&& container) {
  return vformat(fmt, std::forward<Container>(container)).str();
}

/**
 * Exception class thrown when a format key is not found in the given
 * associative container keyed by strings. We inherit std::out_of_range for
 * compatibility with callers that expect exception to be thrown directly
 * by std::map or std::unordered_map.
 *
 * Having the key be at the end of the message string, we can access it by
 * simply adding its offset to what(). Not storing separate std::string key
 * makes the exception type small and noexcept-copyable like std::out_of_range,
 * and therefore able to fit in-situ in exception_wrapper.
 */
class FOLLY_EXPORT FormatKeyNotFoundException : public std::out_of_range {
 public:
  explicit FormatKeyNotFoundException(StringPiece key);

  char const* key() const noexcept {
    return what() + kMessagePrefix.size();
  }

 private:
  static constexpr StringPiece const kMessagePrefix = "format key not found: ";
};

/**
 * Wrap a sequence or associative container so that out-of-range lookups
 * return a default value rather than throwing an exception.
 *
 * Usage:
 * format("[no_such_key"], defaulted(map, 42))  -> 42
 */
namespace detail {
template <class Container, class Value>
struct DefaultValueWrapper {
  DefaultValueWrapper(const Container& container, const Value& defaultValue)
      : container(container), defaultValue(defaultValue) {}

  const Container& container;
  const Value& defaultValue;
};
} // namespace detail

template <class Container, class Value>
detail::DefaultValueWrapper<Container, Value> defaulted(
    const Container& c,
    const Value& v) {
  return detail::DefaultValueWrapper<Container, Value>(c, v);
}

/**
 * Append formatted output to a string.
 *
 * std::string foo;
 * format(&foo, "{} {}", 42, 23);
 *
 * Shortcut for toAppend(format(...), &foo);
 */
template <class Str, class... Args>
typename std::enable_if<IsSomeString<Str>::value>::type
format(Str* out, StringPiece fmt, Args&&... args) {
  format(fmt, std::forward<Args>(args)...).appendTo(*out);
}

/**
 * Append vformatted output to a string.
 */
template <class Str, class Container>
typename std::enable_if<IsSomeString<Str>::value>::type
vformat(Str* out, StringPiece fmt, Container&& container) {
  vformat(fmt, std::forward<Container>(container)).appendTo(*out);
}

/**
 * Utilities for all format value specializations.
 */
namespace format_value {

/**
 * Format a string in "val", obeying appropriate alignment, padding, width,
 * and precision.  Treats Align::DEFAULT as Align::LEFT, and
 * Align::PAD_AFTER_SIGN as Align::RIGHT; use formatNumber for
 * number-specific formatting.
 */
template <class FormatCallback>
void formatString(StringPiece val, FormatArg& arg, FormatCallback& cb);

/**
 * Format a number in "val"; the first prefixLen characters form the prefix
 * (sign, "0x" base prefix, etc) which must be left-aligned if the alignment
 * is Align::PAD_AFTER_SIGN.  Treats Align::DEFAULT as Align::LEFT.  Ignores
 * arg.precision, as that has a different meaning for numbers (not "maximum
 * field width")
 */
template <class FormatCallback>
void formatNumber(
    StringPiece val,
    int prefixLen,
    FormatArg& arg,
    FormatCallback& cb);

/**
 * Format a Formatter object recursively.  Behaves just like
 * formatString(fmt.str(), arg, cb); but avoids creating a temporary
 * string if possible.
 */
template <
    class FormatCallback,
    class Derived,
    bool containerMode,
    class... Args>
void formatFormatter(
    const BaseFormatter<Derived, containerMode, Args...>& formatter,
    FormatArg& arg,
    FormatCallback& cb);

} // namespace format_value

/*
 * Specialize folly::FormatValue for your type.
 *
 * FormatValue<T> is constructed with a (reference-collapsed) T&&, which is
 * guaranteed to stay alive until the FormatValue object is destroyed, so you
 * may keep a reference (or pointer) to it instead of making a copy.
 *
 * You must define
 *   template <class Callback>
 *   void format(FormatArg& arg, Callback& cb) const;
 * with the following semantics: format the value using the given argument.
 *
 * arg is given by non-const reference for convenience -- it won't be reused,
 * so feel free to modify it in place if necessary.  (For example, wrap an
 * existing conversion but change the default, or remove the "key" when
 * extracting an element from a container)
 *
 * Call the callback to append data to the output.  You may call the callback
 * as many times as you'd like (or not at all, if you want to output an
 * empty string)
 */

namespace detail {

template <class T, class Enable = void>
struct IsFormatter : public std::false_type {};

template <class T>
struct IsFormatter<
    T,
    typename std::enable_if<
        std::is_same<typename T::IsFormatter, detail::FormatterTag>::value>::
        type> : public std::true_type {};
} // namespace detail

// Deprecated API. formatChecked() et. al. now behave identically to their
// non-Checked counterparts.
template <class... Args>
Formatter<false, Args...> formatChecked(StringPiece fmt, Args&&... args) {
  return format(fmt, std::forward<Args>(args)...);
}
template <class... Args>
inline std::string sformatChecked(StringPiece fmt, Args&&... args) {
  return formatChecked(fmt, std::forward<Args>(args)...).str();
}
template <class Container>
Formatter<true, Container> vformatChecked(
    StringPiece fmt,
    Container&& container) {
  return vformat(fmt, std::forward<Container>(container));
}
template <class Container>
inline std::string svformatChecked(StringPiece fmt, Container&& container) {
  return vformatChecked(fmt, std::forward<Container>(container)).str();
}
template <class Str, class... Args>
typename std::enable_if<IsSomeString<Str>::value>::type
formatChecked(Str* out, StringPiece fmt, Args&&... args) {
  formatChecked(fmt, std::forward<Args>(args)...).appendTo(*out);
}
template <class Str, class Container>
typename std::enable_if<IsSomeString<Str>::value>::type
vformatChecked(Str* out, StringPiece fmt, Container&& container) {
  vformatChecked(fmt, std::forward<Container>(container)).appendTo(*out);
}

} // namespace folly

#include <folly/Format-inl.h>

FOLLY_POP_WARNING
