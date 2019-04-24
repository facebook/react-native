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

#include <array>
#include <cstdint>
#include <memory>
#include <string>

#include <folly/FBString.h>
#include <folly/Optional.h>
#include <folly/Range.h>
#include <folly/String.h>
#include <folly/Synchronized.h>
#include <folly/container/EvictingCacheMap.h>
#include <folly/experimental/symbolizer/Dwarf.h>
#include <folly/experimental/symbolizer/Elf.h>
#include <folly/experimental/symbolizer/ElfCache.h>
#include <folly/experimental/symbolizer/StackTrace.h>
#include <folly/io/IOBuf.h>

namespace folly {
namespace symbolizer {

class Symbolizer;

/**
 * Frame information: symbol name and location.
 */
struct SymbolizedFrame {
  SymbolizedFrame() {}

  void set(
      const std::shared_ptr<ElfFile>& file,
      uintptr_t address,
      Dwarf::LocationInfoMode mode);

  void clear() {
    *this = SymbolizedFrame();
  }

  bool found = false;
  const char* name = nullptr;
  Dwarf::LocationInfo location;

  /**
   * Demangle the name and return it. Not async-signal-safe; allocates memory.
   */
  fbstring demangledName() const {
    return name ? demangle(name) : fbstring();
  }

 private:
  std::shared_ptr<ElfFile> file_;
};

template <size_t N>
struct FrameArray {
  FrameArray() {}

  size_t frameCount = 0;
  uintptr_t addresses[N];
  SymbolizedFrame frames[N];
};

/**
 * Get stack trace into a given FrameArray, return true on success (and
 * set frameCount to the actual frame count, which may be > N) and false
 * on failure.
 */
namespace detail {
template <size_t N>
bool fixFrameArray(FrameArray<N>& fa, ssize_t n) {
  if (n != -1) {
    fa.frameCount = n;
    for (size_t i = 0; i < fa.frameCount; ++i) {
      fa.frames[i].found = false;
    }
    return true;
  } else {
    fa.frameCount = 0;
    return false;
  }
}
} // namespace detail

// Always inline these functions; they don't do much, and unittests rely
// on them never showing up in a stack trace.
template <size_t N>
FOLLY_ALWAYS_INLINE bool getStackTrace(FrameArray<N>& fa);

template <size_t N>
inline bool getStackTrace(FrameArray<N>& fa) {
  return detail::fixFrameArray(fa, getStackTrace(fa.addresses, N));
}
template <size_t N>
FOLLY_ALWAYS_INLINE bool getStackTraceSafe(FrameArray<N>& fa);

template <size_t N>
inline bool getStackTraceSafe(FrameArray<N>& fa) {
  return detail::fixFrameArray(fa, getStackTraceSafe(fa.addresses, N));
}

class Symbolizer {
 public:
  static constexpr Dwarf::LocationInfoMode kDefaultLocationInfoMode =
      Dwarf::LocationInfoMode::FAST;

  explicit Symbolizer(Dwarf::LocationInfoMode mode = kDefaultLocationInfoMode)
      : Symbolizer(nullptr, mode) {}

  explicit Symbolizer(
      ElfCacheBase* cache,
      Dwarf::LocationInfoMode mode = kDefaultLocationInfoMode,
      size_t symbolCacheSize = 0);
  /**
   * Symbolize given addresses.
   */
  void symbolize(
      const uintptr_t* addresses,
      SymbolizedFrame* frames,
      size_t frameCount);

  template <size_t N>
  void symbolize(FrameArray<N>& fa) {
    symbolize(fa.addresses, fa.frames, fa.frameCount);
  }

  /**
   * Shortcut to symbolize one address.
   */
  bool symbolize(uintptr_t address, SymbolizedFrame& frame) {
    symbolize(&address, &frame, 1);
    return frame.found;
  }

 private:
  ElfCacheBase* const cache_;
  const Dwarf::LocationInfoMode mode_;

  using SymbolCache = EvictingCacheMap<uintptr_t, SymbolizedFrame>;
  folly::Optional<Synchronized<SymbolCache>> symbolCache_;
};

/**
 * Format one address in the way it's usually printed by SymbolizePrinter.
 * Async-signal-safe.
 */
class AddressFormatter {
 public:
  AddressFormatter();

  /**
   * Format the address. Returns an internal buffer.
   */
  StringPiece format(uintptr_t address);

 private:
  static constexpr char bufTemplate[] = "    @ 0000000000000000";
  char buf_[sizeof(bufTemplate)];
};

/**
 * Print a list of symbolized addresses. Base class.
 */
class SymbolizePrinter {
 public:
  /**
   * Print one address, no ending newline.
   */
  void print(uintptr_t address, const SymbolizedFrame& frame);

  /**
   * Print one address with ending newline.
   */
  void println(uintptr_t address, const SymbolizedFrame& frame);

  /**
   * Print multiple addresses on separate lines.
   */
  void println(
      const uintptr_t* addresses,
      const SymbolizedFrame* frames,
      size_t frameCount);

  /**
   * Print a string, no endling newline.
   */
  void print(StringPiece sp) {
    doPrint(sp);
  }

  /**
   * Print multiple addresses on separate lines, skipping the first
   * skip addresses.
   */
  template <size_t N>
  void println(const FrameArray<N>& fa, size_t skip = 0) {
    if (skip < fa.frameCount) {
      println(fa.addresses + skip, fa.frames + skip, fa.frameCount - skip);
    }
  }

  /**
   * If output buffered inside this class, send it to the output stream, so that
   * any output done in other ways appears after this.
   */
  virtual void flush() {}

  virtual ~SymbolizePrinter() {}

  enum Options {
    // Skip file and line information
    NO_FILE_AND_LINE = 1 << 0,

    // As terse as it gets: function name if found, address otherwise
    TERSE = 1 << 1,

    // Always colorize output (ANSI escape code)
    COLOR = 1 << 2,

    // Colorize output only if output is printed to a TTY (ANSI escape code)
    COLOR_IF_TTY = 1 << 3,

    // Skip frame address information
    NO_FRAME_ADDRESS = 1 << 4,
  };

  // NOTE: enum values used as indexes in kColorMap.
  enum Color { DEFAULT, RED, GREEN, YELLOW, BLUE, CYAN, WHITE, PURPLE, NUM };
  void color(Color c);

 protected:
  explicit SymbolizePrinter(int options, bool isTty = false)
      : options_(options), isTty_(isTty) {}

  const int options_;
  const bool isTty_;

 private:
  void printTerse(uintptr_t address, const SymbolizedFrame& frame);
  virtual void doPrint(StringPiece sp) = 0;

  static constexpr std::array<const char*, Color::NUM> kColorMap = {{
      "\x1B[0m",
      "\x1B[31m",
      "\x1B[32m",
      "\x1B[33m",
      "\x1B[34m",
      "\x1B[36m",
      "\x1B[37m",
      "\x1B[35m",
  }};
};

/**
 * Print a list of symbolized addresses to a stream.
 * Not reentrant. Do not use from signal handling code.
 */
class OStreamSymbolizePrinter : public SymbolizePrinter {
 public:
  explicit OStreamSymbolizePrinter(std::ostream& out, int options = 0);

 private:
  void doPrint(StringPiece sp) override;
  std::ostream& out_;
};

/**
 * Print a list of symbolized addresses to a file descriptor.
 * Ignores errors. Async-signal-safe.
 */
class FDSymbolizePrinter : public SymbolizePrinter {
 public:
  explicit FDSymbolizePrinter(int fd, int options = 0, size_t bufferSize = 0);
  ~FDSymbolizePrinter() override;
  virtual void flush() override;

 private:
  void doPrint(StringPiece sp) override;

  const int fd_;
  std::unique_ptr<IOBuf> buffer_;
};

/**
 * Print a list of symbolized addresses to a FILE*.
 * Ignores errors. Not reentrant. Do not use from signal handling code.
 */
class FILESymbolizePrinter : public SymbolizePrinter {
 public:
  explicit FILESymbolizePrinter(FILE* file, int options = 0);

 private:
  void doPrint(StringPiece sp) override;
  FILE* const file_ = nullptr;
};

/**
 * Print a list of symbolized addresses to a std::string.
 * Not reentrant. Do not use from signal handling code.
 */
class StringSymbolizePrinter : public SymbolizePrinter {
 public:
  explicit StringSymbolizePrinter(int options = 0)
      : SymbolizePrinter(options) {}

  std::string str() const {
    return buf_.toStdString();
  }
  const fbstring& fbstr() const {
    return buf_;
  }
  fbstring moveFbString() {
    return std::move(buf_);
  }

 private:
  void doPrint(StringPiece sp) override;
  fbstring buf_;
};

/**
 * Use this class to print a stack trace from a signal handler, or other place
 * where you shouldn't allocate memory on the heap, and fsync()ing your file
 * descriptor is more important than performance.
 *
 * Make sure to create one of these on startup, not in the signal handler, as
 * the constructor allocates on the heap, whereas the other methods don't.  Best
 * practice is to just leak this object, rather than worry about destruction
 * order.
 *
 * These methods aren't thread safe, so if you could have signals on multiple
 * threads at the same time, you need to do your own locking to ensure you don't
 * call these methods from multiple threads.  They are signal safe, however.
 */
class SafeStackTracePrinter {
 public:
  static constexpr size_t kDefaultMinSignalSafeElfCacheSize = 500;

  explicit SafeStackTracePrinter(
      size_t minSignalSafeElfCacheSize = kDefaultMinSignalSafeElfCacheSize,
      int fd = STDERR_FILENO);

  virtual ~SafeStackTracePrinter() {}

  /**
   * Only allocates on the stack and is signal-safe but not thread-safe.  Don't
   * call printStackTrace() on the same StackTracePrinter object from multiple
   * threads at the same time.
   *
   * This is NOINLINE to make sure it shows up in the stack we grab, which makes
   * it easy to skip printing it.
   */
  FOLLY_NOINLINE void printStackTrace(bool symbolize);

  void print(StringPiece sp) {
    printer_.print(sp);
  }

  // Flush printer_, also fsync, in case we're about to crash again...
  void flush();

 protected:
  virtual void printSymbolizedStackTrace();

 private:
  static constexpr size_t kMaxStackTraceDepth = 100;

  int fd_;
  SignalSafeElfCache elfCache_;
  FDSymbolizePrinter printer_;
  std::unique_ptr<FrameArray<kMaxStackTraceDepth>> addresses_;
};

/**
 * Use this class to print a stack trace from normal code.  It will malloc and
 * won't flush or sync.
 *
 * These methods are thread safe, through locking.  However, they are not signal
 * safe.
 */
class FastStackTracePrinter {
 public:
  static constexpr size_t kDefaultSymbolCacheSize = 10000;

  explicit FastStackTracePrinter(
      std::unique_ptr<SymbolizePrinter> printer,
      size_t elfCacheSize = 0, // 0 means "use the default elf cache instance."
      size_t symbolCacheSize = kDefaultSymbolCacheSize);

  ~FastStackTracePrinter();

  /**
   * This is NOINLINE to make sure it shows up in the stack we grab, which makes
   * it easy to skip printing it.
   */
  FOLLY_NOINLINE void printStackTrace(bool symbolize);

  void flush();

 private:
  static constexpr size_t kMaxStackTraceDepth = 100;

  const std::unique_ptr<ElfCache> elfCache_;
  const std::unique_ptr<SymbolizePrinter> printer_;
  Symbolizer symbolizer_;
};

/**
 * Use this class in rare situations where signal handlers are running in a
 * tiny stack specified by sigaltstack.
 *
 * This is neither thread-safe nor signal-safe. However, it can usually print
 * something useful while SafeStackTracePrinter would stack overflow.
 *
 * Signal handlers would need to block other signals to make this safer.
 * Note it's still unsafe even with that.
 */
class UnsafeSelfAllocateStackTracePrinter : public SafeStackTracePrinter {
 protected:
  void printSymbolizedStackTrace() override;
  const long pageSizeUnchecked_ = sysconf(_SC_PAGESIZE);
};

} // namespace symbolizer
} // namespace folly
