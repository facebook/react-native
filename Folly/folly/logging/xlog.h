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

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/logging/LogStream.h>
#include <folly/logging/Logger.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/RateLimiter.h>
#include <cstdlib>

/*
 * This file contains the XLOG() and XLOGF() macros.
 *
 * These macros make it easy to use the logging library without having to
 * manually pick log category names.  All XLOG() and XLOGF() statements in a
 * given file automatically use a LogCategory based on the current file name.
 *
 * For instance, in src/foo/bar.cpp, the default log category name will be
 * "src.foo.bar"
 *
 * If desired, the log category name used by XLOG() in a .cpp file may be
 * overridden using XLOG_SET_CATEGORY_NAME() macro.
 */

/**
 * Log a message to this file's default log category.
 *
 * By default the log category name is automatically picked based on the
 * current filename.  In src/foo/bar.cpp the log category name "src.foo.bar"
 * will be used.  In "lib/stuff/foo.h" the log category name will be
 * "lib.stuff.foo"
 *
 * Note that the filename is based on the __FILE__ macro defined by the
 * compiler.  This is typically dependent on the filename argument that you
 * give to the compiler.  For example, if you compile src/foo/bar.cpp by
 * invoking the compiler inside src/foo and only give it "bar.cpp" as an
 * argument, the category name will simply be "bar".  In general XLOG() works
 * best if you always invoke the compiler from the root directory of your
 * project repository.
 */
#define XLOG(level, ...)                   \
  XLOG_IMPL(                               \
      ::folly::LogLevel::level,            \
      ::folly::LogStreamProcessor::APPEND, \
      ##__VA_ARGS__)

/**
 * Log a message if and only if the specified condition predicate evaluates
 * to true. Note that the condition is *only* evaluated if the log-level check
 * passes.
 */
#define XLOG_IF(level, cond, ...)          \
  XLOG_IF_IMPL(                            \
      ::folly::LogLevel::level,            \
      cond,                                \
      ::folly::LogStreamProcessor::APPEND, \
      ##__VA_ARGS__)
/**
 * Log a message to this file's default log category, using a format string.
 */
#define XLOGF(level, fmt, arg1, ...)       \
  XLOG_IMPL(                               \
      ::folly::LogLevel::level,            \
      ::folly::LogStreamProcessor::FORMAT, \
      fmt,                                 \
      arg1,                                \
      ##__VA_ARGS__)

/**
 * Log a message using a format string if and only if the specified condition
 * predicate evaluates to true. Note that the condition is *only* evaluated
 * if the log-level check passes.
 */
#define XLOGF_IF(level, cond, fmt, arg1, ...) \
  XLOG_IF_IMPL(                               \
      ::folly::LogLevel::level,               \
      cond,                                   \
      ::folly::LogStreamProcessor::FORMAT,    \
      fmt,                                    \
      arg1,                                   \
      ##__VA_ARGS__)

/**
 * Similar to XLOG(...) except only log a message every @param ms
 * milliseconds.
 *
 * Note that this is threadsafe.
 */
#define XLOG_EVERY_MS(level, ms, ...)                                    \
  XLOG_IF(                                                               \
      level,                                                             \
      [] {                                                               \
        static ::folly::logging::IntervalRateLimiter                     \
            folly_detail_xlog_limiter(1, std::chrono::milliseconds(ms)); \
        return folly_detail_xlog_limiter.check();                        \
      }(),                                                               \
      ##__VA_ARGS__)

/**
 * Similar to XLOG(...) except only log a message every @param n
 * invocations.
 *
 * The internal counter is process-global and threadsafe.
 */
#define XLOG_EVERY_N(level, n, ...)                                            \
  XLOG_IF(                                                                     \
      level,                                                                   \
      [] {                                                                     \
        static std::atomic<size_t> folly_detail_xlog_count{0};                 \
        return FOLLY_UNLIKELY(                                                 \
            (folly_detail_xlog_count.fetch_add(1, std::memory_order_relaxed) % \
             (n)) == 0);                                                       \
      }(),                                                                     \
      ##__VA_ARGS__)

/**
 * Similar to XLOG(...) except only log at most @param count messages
 * per @param ms millisecond interval.
 *
 * The internal counters are process-global and threadsafe.
 */
#define XLOG_N_PER_MS(level, count, ms, ...)                                   \
  XLOG_IF(                                                                     \
      level,                                                                   \
      [] {                                                                     \
        static ::folly::logging::IntervalRateLimiter                           \
            folly_detail_xlog_limiter((count), std::chrono::milliseconds(ms)); \
        return folly_detail_xlog_limiter.check();                              \
      }(),                                                                     \
      ##__VA_ARGS__)
/**
 * FOLLY_XLOG_STRIP_PREFIXES can be defined to a string containing a
 * colon-separated list of directory prefixes to strip off from the filename
 * before using it to compute the log category name.
 *
 * If this is defined, use xlogStripFilename() to strip off directory prefixes;
 * otherwise just use __FILE__ literally.  xlogStripFilename() is a constexpr
 * expression so that this stripping can be performed fully at compile time.
 * (There is no guarantee that the compiler will evaluate it at compile time,
 * though.)
 */
#ifdef FOLLY_XLOG_STRIP_PREFIXES
#define XLOG_FILENAME \
  folly::xlogStripFilename(__FILE__, FOLLY_XLOG_STRIP_PREFIXES)
#else
#define XLOG_FILENAME __FILE__
#endif

#define XLOG_IMPL(level, type, ...) \
  XLOG_ACTUAL_IMPL(                 \
      level, true, ::folly::isLogLevelFatal(level), type, ##__VA_ARGS__)

#define XLOG_IF_IMPL(level, cond, type, ...) \
  XLOG_ACTUAL_IMPL(level, cond, false, type, ##__VA_ARGS__)

/**
 * Helper macro used to implement XLOG() and XLOGF()
 *
 * Beware that the level argument is evaluated twice.
 *
 * This macro is somewhat tricky:
 *
 * - In order to support streaming argument support (with the << operator),
 *   the macro must expand to a single ternary ? expression.  This is the only
 *   way we can avoid evaluating the log arguments if the log check fails,
 *   and still have the macro behave as expected when used as the body of an if
 *   or else statement.
 *
 * - We need to store some static-scope local state in order to track the
 *   LogCategory to use.  This is a bit tricky to do and still meet the
 *   requirements of being a single expression, but fortunately static
 *   variables inside a lambda work for this purpose.
 *
 *   Inside header files, each XLOG() statement defines to static variables:
 *   - the LogLevel for this category
 *   - a pointer to the LogCategory
 *
 *   If the __INCLUDE_LEVEL__ macro is available (both gcc and clang support
 *   this), then we we can detect when we are inside a .cpp file versus a
 *   header file.  If we are inside a .cpp file, we can avoid declaring these
 *   variables once per XLOG() statement, and instead we only declare one copy
 *   of these variables for the entire file.
 *
 * - We want to make sure this macro is safe to use even from inside static
 *   initialization code that runs before main.  We also want to make the log
 *   admittance check as cheap as possible, so that disabled debug logs have
 *   minimal overhead, and can be left in place even in performance senstive
 *   code.
 *
 *   In order to do this, we rely on zero-initialization of variables with
 *   static storage duration.  The LogLevel variable will always be
 *   0-initialized before any code runs.  Therefore the very first time an
 *   XLOG() statement is hit the initial log level check will always pass
 *   (since all level values are greater or equal to 0), and we then do a
 *   second check to see if the log level and category variables need to be
 *   initialized.  On all subsequent calls, disabled log statements can be
 *   skipped with just a single check of the LogLevel.
 */
#define XLOG_ACTUAL_IMPL(level, cond, always_fatal, type, ...)             \
  (!XLOG_IS_ON_IMPL(level) || !(cond))                                     \
      ? ::folly::logDisabledHelper(::folly::bool_constant<always_fatal>{}) \
      : ::folly::LogStreamVoidify<::folly::isLogLevelFatal(level)>{} &     \
          ::folly::LogStreamProcessor(                                     \
              [] {                                                         \
                static ::folly::XlogCategoryInfo<XLOG_IS_IN_HEADER_FILE>   \
                    folly_detail_xlog_category;                            \
                return folly_detail_xlog_category.getInfo(                 \
                    &xlog_detail::xlogFileScopeInfo);                      \
              }(),                                                         \
              (level),                                                     \
              xlog_detail::getXlogCategoryName(XLOG_FILENAME, 0),          \
              xlog_detail::isXlogCategoryOverridden(0),                    \
              XLOG_FILENAME,                                               \
              __LINE__,                                                    \
              __func__,                                                    \
              (type),                                                      \
              ##__VA_ARGS__)                                               \
              .stream()

/**
 * Check if an XLOG() statement with the given log level would be enabled.
 *
 * The level parameter must be an unqualified LogLevel enum value.
 */
#define XLOG_IS_ON(level) XLOG_IS_ON_IMPL(::folly::LogLevel::level)

/**
 * Helper macro to implement of XLOG_IS_ON()
 *
 * This macro is used in the XLOG() implementation, and therefore must be as
 * cheap as possible.  It stores the category's LogLevel as a local static
 * variable.  The very first time this macro is evaluated it will look up the
 * correct LogCategory and initialize the LogLevel.  Subsequent calls then
 * are only a single conditional log level check.
 *
 * The LogCategory object keeps track of this local LogLevel variable and
 * automatically keeps it up-to-date when the category's effective level is
 * changed.
 *
 * See XlogLevelInfo for the implementation details.
 */
#define XLOG_IS_ON_IMPL(level)                              \
  ([] {                                                     \
    static ::folly::XlogLevelInfo<XLOG_IS_IN_HEADER_FILE>   \
        folly_detail_xlog_level;                            \
    return folly_detail_xlog_level.check(                   \
        (level),                                            \
        xlog_detail::getXlogCategoryName(XLOG_FILENAME, 0), \
        xlog_detail::isXlogCategoryOverridden(0),           \
        &xlog_detail::xlogFileScopeInfo);                   \
  }())

/**
 * Get the name of the log category that will be used by XLOG() statements
 * in this file.
 */
#define XLOG_GET_CATEGORY_NAME()                            \
  (xlog_detail::isXlogCategoryOverridden(0)                 \
       ? xlog_detail::getXlogCategoryName(XLOG_FILENAME, 0) \
       : ::folly::getXlogCategoryNameForFile(XLOG_FILENAME))

/**
 * Get a pointer to the LogCategory that will be used by XLOG() statements in
 * this file.
 *
 * This is just a small wrapper around a LoggerDB::getCategory() call.
 * This must be implemented as a macro since it uses __FILE__, and that must
 * expand to the correct filename based on where the macro is used.
 */
#define XLOG_GET_CATEGORY() \
  folly::LoggerDB::get().getCategory(XLOG_GET_CATEGORY_NAME())

/**
 * XLOG_SET_CATEGORY_NAME() can be used to explicitly define the log category
 * name used by all XLOG() and XLOGF() calls in this translation unit.
 *
 * This overrides the default behavior of picking a category name based on the
 * current filename.
 *
 * This should be used at the top-level scope in a .cpp file, before any XLOG()
 * or XLOGF() macros have been used in the file.
 *
 * XLOG_SET_CATEGORY_NAME() cannot be used inside header files.
 */
#ifdef __INCLUDE_LEVEL__
#define XLOG_SET_CATEGORY_CHECK \
  static_assert(                \
      __INCLUDE_LEVEL__ == 0,   \
      "XLOG_SET_CATEGORY_NAME() should not be used in header files");
#else
#define XLOG_SET_CATEGORY_CHECK
#endif

#define XLOG_SET_CATEGORY_NAME(category)                   \
  namespace {                                              \
  namespace xlog_detail {                                  \
  XLOG_SET_CATEGORY_CHECK                                  \
  constexpr inline folly::StringPiece getXlogCategoryName( \
      folly::StringPiece,                                  \
      int) {                                               \
    return category;                                       \
  }                                                        \
  constexpr inline bool isXlogCategoryOverridden(int) {    \
    return true;                                           \
  }                                                        \
  }                                                        \
  }

/**
 * Assert that a condition is true.
 *
 * This crashes the program with an XLOG(FATAL) message if the condition is
 * false.  Unlike assert() CHECK statements are always enabled, regardless of
 * the setting of NDEBUG.
 */
#define XCHECK(cond, ...) \
  XLOG_IF(FATAL, UNLIKELY(!(cond)), "Check failed: " #cond " ", ##__VA_ARGS__)

/**
 * Assert that a condition is true in non-debug builds.
 *
 * When NDEBUG is set this behaves like XDCHECK()
 * When NDEBUG is not defined XDCHECK statements are not evaluated and will
 * never log.
 *
 * You can use `XLOG_IF(DFATAL, condition)` instead if you want the condition to
 * be evaluated in release builds but log a message without crashing the
 * program.
 */
#define XDCHECK(cond, ...) \
  (!::folly::kIsDebug) ? static_cast<void>(0) : XCHECK(cond, ##__VA_ARGS__)

/**
 * XLOG_IS_IN_HEADER_FILE evaluates to false if we can definitively tell if we
 * are not in a header file.  Otherwise, it evaluates to true.
 */
#ifdef __INCLUDE_LEVEL__
#define XLOG_IS_IN_HEADER_FILE bool(__INCLUDE_LEVEL__ > 0)
#else
// Without __INCLUDE_LEVEL__ we canot tell if we are in a header file or not,
// and must pessimstically assume we are always in a header file.
#define XLOG_IS_IN_HEADER_FILE true
#endif

namespace folly {

class XlogFileScopeInfo {
 public:
#ifdef __INCLUDE_LEVEL__
  std::atomic<::folly::LogLevel> level;
  ::folly::LogCategory* category;
#endif
};

/**
 * A file-static XlogLevelInfo and XlogCategoryInfo object is declared for each
 * XLOG() statement.
 *
 * We intentionally do not provide constructors for these structures, and rely
 * on their members to be zero-initialized when the program starts.  This
 * ensures that everything will work as desired even if XLOG() statements are
 * used during dynamic object initialization before main().
 */
template <bool IsInHeaderFile>
class XlogLevelInfo {
 public:
  bool check(
      LogLevel levelToCheck,
      folly::StringPiece categoryName,
      bool isOverridden,
      XlogFileScopeInfo*) {
    // Do an initial relaxed check.  If this fails we know the category level
    // is initialized and the log admittance check failed.
    // Use LIKELY() to optimize for the case of disabled debug statements:
    // we disabled debug statements to be cheap.  If the log message is
    // enabled then this check will still be minimal perf overhead compared to
    // the overall cost of logging it.
    if (LIKELY(levelToCheck < level_.load(std::memory_order_relaxed))) {
      return false;
    }

    // If we are still here, then either:
    // - The log level check actually passed, or
    // - level_ has not been initialized yet, and we have to initialize it and
    //   then re-perform the check.
    //
    // Do this work in a separate helper method.  It is intentionally defined
    // in the xlog.cpp file to avoid inlining, to reduce the amount of code
    // emitted for each XLOG() statement.
    auto currentLevel = loadLevelFull(categoryName, isOverridden);
    return levelToCheck >= currentLevel;
  }

 private:
  LogLevel loadLevelFull(folly::StringPiece categoryName, bool isOverridden);

  // XlogLevelInfo objects are always defined with static storage.
  // This member will always be zero-initialized on program start.
  std::atomic<LogLevel> level_;
};

template <bool IsInHeaderFile>
class XlogCategoryInfo {
 public:
  bool isInitialized() const {
    return isInitialized_.load(std::memory_order_acquire);
  }

  LogCategory* init(folly::StringPiece categoryName, bool isOverridden);

  LogCategory* getCategory(XlogFileScopeInfo*) {
    return category_;
  }

  /**
   * Get a pointer to pass into the LogStreamProcessor constructor,
   * so that it is able to look up the LogCategory information.
   */
  XlogCategoryInfo<IsInHeaderFile>* getInfo(XlogFileScopeInfo*) {
    return this;
  }

 private:
  // These variables will always be zero-initialized on program start.
  std::atomic<bool> isInitialized_;
  LogCategory* category_;
};

#ifdef __INCLUDE_LEVEL__
/**
 * Specialization of XlogLevelInfo for XLOG() statements in the .cpp file being
 * compiled.  In this case we only define a single file-static LogLevel object
 * for the entire file, rather than defining one for each XLOG() statement.
 */
template <>
class XlogLevelInfo<false> {
 public:
  static bool check(
      LogLevel levelToCheck,
      folly::StringPiece categoryName,
      bool isOverridden,
      XlogFileScopeInfo* fileScopeInfo) {
    // As above in the non-specialized XlogFileScopeInfo code, do a simple
    // relaxed check first.
    if (LIKELY(
            levelToCheck <
            fileScopeInfo->level.load(::std::memory_order_relaxed))) {
      return false;
    }

    // If we are still here we the file-scope log level either needs to be
    // initalized, or the log level check legitimately passed.
    auto currentLevel =
        loadLevelFull(categoryName, isOverridden, fileScopeInfo);
    return levelToCheck >= currentLevel;
  }

 private:
  static LogLevel loadLevelFull(
      folly::StringPiece categoryName,
      bool isOverridden,
      XlogFileScopeInfo* fileScopeInfo);
};

/**
 * Specialization of XlogCategoryInfo for XLOG() statements in the .cpp file
 * being compiled.  In this case we only define a single file-static LogLevel
 * object for the entire file, rather than defining one for each XLOG()
 * statement.
 */
template <>
class XlogCategoryInfo<false> {
 public:
  /**
   * Get a pointer to pass into the LogStreamProcessor constructor,
   * so that it is able to look up the LogCategory information.
   */
  XlogFileScopeInfo* getInfo(XlogFileScopeInfo* fileScopeInfo) {
    return fileScopeInfo;
  }
};
#endif

/**
 * Get the default XLOG() category name for the given filename.
 *
 * This function returns the category name that will be used by XLOG() if
 * XLOG_SET_CATEGORY_NAME() has not been used.
 */
folly::StringPiece getXlogCategoryNameForFile(folly::StringPiece filename);

constexpr bool xlogIsDirSeparator(char c) {
  return c == '/' || (kIsWindows && c == '\\');
}

namespace detail {
constexpr const char* xlogStripFilenameRecursive(
    const char* filename,
    const char* prefixes,
    size_t prefixIdx,
    size_t filenameIdx,
    bool match);
constexpr const char* xlogStripFilenameMatchFound(
    const char* filename,
    const char* prefixes,
    size_t prefixIdx,
    size_t filenameIdx) {
  return (filename[filenameIdx] == '\0')
      ? xlogStripFilenameRecursive(filename, prefixes, prefixIdx + 1, 0, true)
      : (xlogIsDirSeparator(filename[filenameIdx])
             ? xlogStripFilenameMatchFound(
                   filename, prefixes, prefixIdx, filenameIdx + 1)
             : (filename + filenameIdx));
}
constexpr const char* xlogStripFilenameRecursive(
    const char* filename,
    const char* prefixes,
    size_t prefixIdx,
    size_t filenameIdx,
    bool match) {
  // This would be much easier to understand if written as a while loop.
  // However, in order to maintain compatibility with pre-C++14 compilers we
  // have implemented it recursively to adhere to C++11 restrictions for
  // constexpr functions.
  return (prefixes[prefixIdx] == ':' || prefixes[prefixIdx] == '\0')
      ? ((match && filenameIdx > 0 &&
          (xlogIsDirSeparator(prefixes[filenameIdx - 1]) ||
           xlogIsDirSeparator(filename[filenameIdx])))
             ? (xlogStripFilenameMatchFound(
                   filename, prefixes, prefixIdx, filenameIdx))
             : ((prefixes[prefixIdx] == '\0')
                    ? filename
                    : xlogStripFilenameRecursive(
                          filename, prefixes, prefixIdx + 1, 0, true)))
      : ((match && (prefixes[prefixIdx] == filename[filenameIdx]))
             ? xlogStripFilenameRecursive(
                   filename, prefixes, prefixIdx + 1, filenameIdx + 1, true)
             : xlogStripFilenameRecursive(
                   filename, prefixes, prefixIdx + 1, 0, false));
}
} // namespace detail

/**
 * Strip directory prefixes from a filename before using it in XLOG macros.
 *
 * This is primarily used to strip off the initial project directory path for
 * projects that invoke the compiler with absolute path names.
 *
 * The filename argument is the filename to process.  This is normally the
 * contents of the __FILE__ macro from the invoking file.
 *
 * prefixes is a colon-separated list of directory prefixes to strip off if
 * present at the beginning of the filename.  The prefix list is searched in
 * order, and only the first match found will be stripped.
 *
 * e.g., xlogStripFilename("/my/project/src/foo.cpp", "/tmp:/my/project")
 * would return "src/foo.cpp"
 */
constexpr const char* xlogStripFilename(
    const char* filename,
    const char* prefixes) {
  return detail::xlogStripFilenameRecursive(filename, prefixes, 0, 0, true);
}
} // namespace folly

/*
 * We intentionally use an unnamed namespace inside a header file here.
 *
 * We want each .cpp file that uses xlog.h to get its own separate
 * implementation of the following functions and variables.
 */
namespace {
namespace xlog_detail {
/**
 * The default getXlogCategoryName() function.
 *
 * By default this simply returns the filename argument passed in.
 * The default isXlogCategoryOverridden() function returns false, indicating
 * that the return value from getXlogCategoryName() needs to be converted
 * using getXlogCategoryNameForFile().
 *
 * These are two separate steps because getXlogCategoryName() itself needs to
 * remain constexpr--it is always evaluated in XLOG() statements, but we only
 * want to call getXlogCategoryNameForFile() the very first time through, when
 * we have to initialize the LogCategory object.
 *
 * This is a template function purely so that XLOG_SET_CATEGORY_NAME() can
 * define a more specific version of this function that will take precedence
 * over this one.
 */
template <typename T>
constexpr inline folly::StringPiece getXlogCategoryName(
    folly::StringPiece filename,
    T) {
  return filename;
}

/**
 * The default isXlogCategoryOverridden() function.
 *
 * This returns false indicating that the category name has not been
 * overridden, so getXlogCategoryName() returns a raw filename that needs
 * to be translated with getXlogCategoryNameForFile().
 *
 * This is a template function purely so that XLOG_SET_CATEGORY_NAME() can
 * define a more specific version of this function that will take precedence
 * over this one.
 */
template <typename T>
constexpr inline bool isXlogCategoryOverridden(T) {
  return false;
}

/**
 * File-scope LogLevel and LogCategory data for XLOG() statements,
 * if __INCLUDE_LEVEL__ is supported.
 *
 * This allows us to only have one LogLevel and LogCategory pointer for the
 * entire .cpp file, rather than needing a separate copy for each XLOG()
 * statement.
 */
::folly::XlogFileScopeInfo xlogFileScopeInfo;
} // namespace xlog_detail
} // namespace
