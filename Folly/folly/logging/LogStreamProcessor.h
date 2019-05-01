/*
 * Copyright 2017-present Facebook, Inc.
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
#include <folly/Conv.h>
#include <folly/Demangle.h>
#include <folly/Format.h>
#include <folly/Portability.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogMessage.h>
#include <folly/logging/LogStream.h>
#include <cstdlib>

namespace folly {

/*
 * Helper functions for fallback-formatting of arguments if folly::format()
 * throws an exception.
 *
 * These are in a detail namespace so that we can include a using directive in
 * order to do proper argument-dependent lookup of the correct toAppend()
 * function to use.
 */
namespace detail {
/* using override */
using folly::toAppend;
template <typename Arg>
auto fallbackFormatOneArg(std::string* str, const Arg* arg, int) -> decltype(
    toAppend(std::declval<Arg>(), std::declval<std::string*>()),
    std::declval<void>()) {
  str->push_back('(');
  try {
#ifdef FOLLY_HAS_RTTI
    toAppend(folly::demangle(typeid(*arg)), str);
    str->append(": ");
#endif
    toAppend(*arg, str);
  } catch (const std::exception&) {
    str->append("<error_converting_to_string>");
  }
  str->push_back(')');
}

template <typename Arg>
inline void fallbackFormatOneArg(std::string* str, const Arg* arg, long) {
  str->push_back('(');
#ifdef FOLLY_HAS_RTTI
  try {
    toAppend(folly::demangle(typeid(*arg)), str);
    str->append(": ");
  } catch (const std::exception&) {
    // Ignore the error
  }
#endif
  str->append("<no_string_conversion>)");
}
} // namespace detail

template <bool IsInHeaderFile>
class XlogCategoryInfo;
class XlogFileScopeInfo;

/**
 * LogStreamProcessor receives a LogStream and logs it.
 *
 * This class is primarily intended to be used through the FB_LOG*() macros.
 * Its API is designed to support these macros, and is not designed for other
 * use.
 *
 * The operator&() method is used to trigger the logging.
 * This operator is used because it has lower precedence than <<, but higher
 * precedence than the ? ternary operator, allowing it to bind with the correct
 * precedence in the log macro implementations.
 */
class LogStreamProcessor {
 public:
  enum AppendType { APPEND };
  enum FormatType { FORMAT };

  /**
   * LogStreamProcessor constructor for use with a LOG() macro with no extra
   * arguments.
   *
   * Note that the filename argument is not copied.  The caller should ensure
   * that it points to storage that will remain valid for the lifetime of the
   * LogStreamProcessor.  (This is always the case for the __FILE__
   * preprocessor macro.)
   */
  LogStreamProcessor(
      const LogCategory* category,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType) noexcept;

  /**
   * LogStreamProcessor constructor for use with a LOG() macro with arguments
   * to be concatenated with folly::to<std::string>()
   *
   * Note that the filename argument is not copied.  The caller should ensure
   * that it points to storage that will remain valid for the lifetime of the
   * LogStreamProcessor.  (This is always the case for the __FILE__
   * preprocessor macro.)
   */
  template <typename... Args>
  LogStreamProcessor(
      const LogCategory* category,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType,
      Args&&... args) noexcept
      : LogStreamProcessor(
            category,
            level,
            filename,
            lineNumber,
            functionName,
            INTERNAL,
            createLogString(std::forward<Args>(args)...)) {}

  /**
   * LogStreamProcessor constructor for use with a LOG() macro with arguments
   * to be concatenated with folly::to<std::string>()
   *
   * Note that the filename argument is not copied.  The caller should ensure
   * that it points to storage that will remain valid for the lifetime of the
   * LogStreamProcessor.  (This is always the case for the __FILE__
   * preprocessor macro.)
   */
  template <typename... Args>
  LogStreamProcessor(
      const LogCategory* category,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      FormatType,
      folly::StringPiece fmt,
      Args&&... args) noexcept
      : LogStreamProcessor(
            category,
            level,
            filename,
            lineNumber,
            functionName,
            INTERNAL,
            formatLogString(fmt, std::forward<Args>(args)...)) {}

  /*
   * Versions of the above constructors for use in XLOG() statements.
   *
   * These are defined separately from the above constructor so that the work
   * of initializing the XLOG LogCategory data is done in a separate function
   * body defined in LogStreamProcessor.cpp.  We intentionally want to avoid
   * inlining this work at every XLOG() statement, to reduce the emitted code
   * size.
   */
  LogStreamProcessor(
      XlogCategoryInfo<true>* categoryInfo,
      LogLevel level,
      folly::StringPiece categoryName,
      bool isCategoryNameOverridden,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType) noexcept;
  template <typename... Args>
  LogStreamProcessor(
      XlogCategoryInfo<true>* categoryInfo,
      LogLevel level,
      folly::StringPiece categoryName,
      bool isCategoryNameOverridden,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType,
      Args&&... args) noexcept
      : LogStreamProcessor(
            categoryInfo,
            level,
            categoryName,
            isCategoryNameOverridden,
            filename,
            lineNumber,
            functionName,
            INTERNAL,
            createLogString(std::forward<Args>(args)...)) {}
  template <typename... Args>
  LogStreamProcessor(
      XlogCategoryInfo<true>* categoryInfo,
      LogLevel level,
      folly::StringPiece categoryName,
      bool isCategoryNameOverridden,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      FormatType,
      folly::StringPiece fmt,
      Args&&... args) noexcept
      : LogStreamProcessor(
            categoryInfo,
            level,
            categoryName,
            isCategoryNameOverridden,
            filename,
            lineNumber,
            functionName,
            INTERNAL,
            formatLogString(fmt, std::forward<Args>(args)...)) {}

#ifdef __INCLUDE_LEVEL__
  /*
   * Versions of the above constructors to use in XLOG() macros that appear in
   * .cpp files.  These are only used if the compiler supports the
   * __INCLUDE_LEVEL__ macro, which we need to determine that the XLOG()
   * statement is not in a header file.
   *
   * These behave identically to the XlogCategoryInfo<true> versions of the
   * APIs, but slightly more optimized, and allow the XLOG() code to avoid
   * storing category information at each XLOG() call site.
   */
  LogStreamProcessor(
      XlogFileScopeInfo* fileScopeInfo,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType) noexcept;
  LogStreamProcessor(
      XlogFileScopeInfo* fileScopeInfo,
      LogLevel level,
      folly::StringPiece /* categoryName */,
      bool /* isCategoryNameOverridden */,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType) noexcept
      : LogStreamProcessor(
            fileScopeInfo,
            level,
            filename,
            lineNumber,
            functionName,
            APPEND) {}
  template <typename... Args>
  LogStreamProcessor(
      XlogFileScopeInfo* fileScopeInfo,
      LogLevel level,
      folly::StringPiece /* categoryName */,
      bool /* isCategoryNameOverridden */,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      AppendType,
      Args&&... args) noexcept
      : LogStreamProcessor(
            fileScopeInfo,
            level,
            filename,
            lineNumber,
            functionName,
            INTERNAL,
            createLogString(std::forward<Args>(args)...)) {}
  template <typename... Args>
  LogStreamProcessor(
      XlogFileScopeInfo* fileScopeInfo,
      LogLevel level,
      folly::StringPiece /* categoryName */,
      bool /* isCategoryNameOverridden */,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      FormatType,
      folly::StringPiece fmt,
      Args&&... args) noexcept
      : LogStreamProcessor(
            fileScopeInfo,
            level,
            filename,
            lineNumber,
            functionName,
            INTERNAL,
            formatLogString(fmt, std::forward<Args>(args)...)) {}
#endif

  ~LogStreamProcessor() noexcept;

  /**
   * This version of operator&() is typically used when the user specifies
   * log arguments using the << stream operator.  The operator<<() generally
   * returns a std::ostream&
   */
  void operator&(std::ostream& stream) noexcept;

  /**
   * This version of operator&() is used when no extra arguments are specified
   * with the << operator.  In this case the & operator is applied directly to
   * the temporary LogStream object.
   */
  void operator&(LogStream&& stream) noexcept;

  std::ostream& stream() noexcept {
    return stream_;
  }

  void logNow() noexcept;

 private:
  enum InternalType { INTERNAL };
  LogStreamProcessor(
      const LogCategory* category,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      InternalType,
      std::string&& msg) noexcept;
  LogStreamProcessor(
      XlogCategoryInfo<true>* categoryInfo,
      LogLevel level,
      folly::StringPiece categoryName,
      bool isCategoryNameOverridden,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      InternalType,
      std::string&& msg) noexcept;
  LogStreamProcessor(
      XlogFileScopeInfo* fileScopeInfo,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      InternalType,
      std::string&& msg) noexcept;

  std::string extractMessageString(LogStream& stream) noexcept;

  /**
   * Construct a log message string using folly::to<std::string>()
   *
   * This function attempts to avoid throwing exceptions.  If an error occurs
   * during formatting, a message including the error details is returned
   * instead.  This is done to help ensure that log statements do not generate
   * exceptions, but instead just log an error string when something goes wrong.
   */
  template <typename... Args>
  FOLLY_NOINLINE std::string createLogString(Args&&... args) noexcept {
    try {
      return folly::to<std::string>(std::forward<Args>(args)...);
    } catch (const std::exception& ex) {
      // This most likely means there was some error converting the arguments
      // to strings.  Handle the exception here, rather than letting it
      // propagate up, since callers generally do not expect log statements to
      // throw.
      //
      // Just log an error message letting indicating that something went wrong
      // formatting the log message.
      return folly::to<std::string>(
          "error constructing log message: ", ex.what());
    }
  }

  /**
   * Construct a log message string using folly::sformat()
   *
   * This function attempts to avoid throwing exceptions.  If an error occurs
   * during formatting, a message including the error details is returned
   * instead.  This is done to help ensure that log statements do not generate
   * exceptions, but instead just log an error string when something goes wrong.
   */
  template <typename... Args>
  FOLLY_NOINLINE std::string formatLogString(
      folly::StringPiece fmt,
      const Args&... args) noexcept {
    try {
      return folly::sformat(fmt, args...);
    } catch (const std::exception& ex) {
      // This most likely means that the caller had a bug in their format
      // string/arguments.  Handle the exception here, rather than letting it
      // propagate up, since callers generally do not expect log statements to
      // throw.
      //
      // Log the format string and as much of the arguments as we can convert,
      // to aid debugging.
      std::string result;
      result.append("error formatting log message: ");
      result.append(ex.what());
      result.append("; format string: \"");
      result.append(fmt.data(), fmt.size());
      result.append("\", arguments: ");
      fallbackFormat(&result, args...);
      return result;
    }
  }

  /**
   * Helper function generate a fallback version of the arguments in case
   * folly::sformat() throws an exception.
   *
   * This attempts to convert each argument to a string using a similar
   * mechanism to folly::to<std::string>(), if supported.
   */
  template <typename Arg1, typename... Args>
  void
  fallbackFormat(std::string* str, const Arg1& arg1, const Args&... remainder) {
    detail::fallbackFormatOneArg(str, &arg1, 0);
    str->append(", ");
    fallbackFormat(str, remainder...);
  }

  template <typename Arg>
  void fallbackFormat(std::string* str, const Arg& arg) {
    detail::fallbackFormatOneArg(str, &arg, 0);
  }

  const LogCategory* const category_;
  LogLevel const level_;
  folly::StringPiece filename_;
  unsigned int lineNumber_;
  folly::StringPiece functionName_;
  std::string message_;
  LogStream stream_;
};

/**
 * LogStreamVoidify() is a helper class used in the FB_LOG() and XLOG() macros.
 *
 * It's only purpose is to provide an & operator overload that returns void.
 * This allows the log macros to expand roughly to:
 *
 *   (logEnabled) ? (void)0
 *                : LogStreamVoidify{} & LogStreamProcessor{}.stream() << "msg";
 *
 * This enables the right hand (':') side of the ternary ? expression to have a
 * void type, and allows various streaming operator expressions to be placed on
 * the right hand side of the expression.
 *
 * Operator & is used since it has higher precedence than ?:, but lower
 * precedence than <<.
 *
 * This class is templated on whether the log message is fatal so that the
 * operator& can be declared [[noreturn]] for fatal log messages.  This
 * prevents the compiler from complaining about functions that do not return a
 * value after a fatal log statement.
 */
template <bool Fatal>
class LogStreamVoidify {
 public:
  /**
   * In the default (non-fatal) case, the & operator implementation is a no-op.
   *
   * We perform the actual logging in the LogStreamProcessor destructor.  It
   * feels slightly hacky to perform logging in the LogStreamProcessor
   * destructor instead of here, since the LogStreamProcessor destructor is not
   * evaluated until the very end of the statement.  In practice log
   * statements really shouldn't be in the middle of larger statements with
   * other side effects, so this ordering distinction shouldn't make much
   * difference.
   *
   * However, by keeping this function a no-op we reduce the amount of code
   * generated for log statements.  This function call can be completely
   * eliminated by the compiler, leaving only the LogStreamProcessor destructor
   * invocation, which cannot be eliminated.
   */
  void operator&(std::ostream&)noexcept {}
};

template <>
class LogStreamVoidify<true> {
 public:
  /**
   * A specialized noreturn version of operator&() for fatal log statements.
   */
  [[noreturn]] void operator&(std::ostream&);
};

/**
 * logDisabledHelper() is invoked in FB_LOG() and XLOG() statements if the log
 * admittance check fails.
 *
 * This function exists solely to ensure that both sides of the log check are
 * marked [[noreturn]] for fatal log messages.  This allows the compiler to
 * recognize that the full statement is noreturn, preventing warnings about
 * missing return statements after fatal log messages.
 *
 * Unfortunately it does not appear possible to get the compiler to recognize
 * that the disabled side of the log statement should never be reached for
 * fatal messages.  Even if we make the check something like
 * `(isLogLevelFatal(level) || realCheck)`, where isLogLevelFatal() is
 * constexpr, this is not sufficient for gcc or clang to recognize that the
 * full expression is noreturn.
 *
 * Ideally this would just be a template function specialized on a boolean
 * IsFatal parameter.  Unfortunately this triggers a bug in clang, which does
 * not like differing noreturn behavior for different template instantiations.
 * Therefore we overload on integral_constant instead.
 *
 * clang-format also doesn't do a good job understanding this code and figuring
 * out how to format it.
 */
// clang-format off
inline void logDisabledHelper(std::false_type) noexcept {}
[[noreturn]] void logDisabledHelper(std::true_type) noexcept;
// clang-format on
} // namespace folly
