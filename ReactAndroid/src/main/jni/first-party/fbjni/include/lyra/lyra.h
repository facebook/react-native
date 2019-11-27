/**
 * Copyright 2004-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <iomanip>
#include <string>
#include <vector>

namespace facebook {
namespace lyra {

constexpr size_t kDefaultLimit = 64;

using InstructionPointer = const void*;

class StackTraceElement {
 public:
  StackTraceElement(InstructionPointer absoluteProgramCounter,
                    InstructionPointer libraryBase,
                    InstructionPointer functionAddress,
                    std::string libraryName,
                    std::string functionName)
      : absoluteProgramCounter_{absoluteProgramCounter},
        libraryBase_{libraryBase},
        functionAddress_{functionAddress},
        libraryName_{std::move(libraryName)},
        functionName_{std::move(functionName)},
        hasBuildId_{false},
        buildId_{}
  {}

  InstructionPointer libraryBase() const noexcept { return libraryBase_; }

  InstructionPointer functionAddress() const noexcept {
    return functionAddress_;
  }

  InstructionPointer absoluteProgramCounter() const noexcept {
    return absoluteProgramCounter_;
  }

  const std::string& libraryName() const noexcept { return libraryName_; }

  const std::string& functionName() const noexcept { return functionName_; }

  /**
   * The offset of the program counter to the base of the library (i.e. the
   * address that addr2line takes as input>
   */
  std::ptrdiff_t libraryOffset() const noexcept {
    auto absoluteLibrary = static_cast<const char*>(libraryBase_);
    auto absoluteabsoluteProgramCounter =
        static_cast<const char*>(absoluteProgramCounter_);
    return absoluteabsoluteProgramCounter - absoluteLibrary;
  }

  /**
   * The offset within the current function
   */
  int functionOffset() const noexcept {
    auto absoluteSymbol = static_cast<const char*>(functionAddress_);
    auto absoluteabsoluteProgramCounter =
        static_cast<const char*>(absoluteProgramCounter_);
    return absoluteabsoluteProgramCounter - absoluteSymbol;
  }

  std::string buildId() const;
 private:
  const InstructionPointer absoluteProgramCounter_;
  const InstructionPointer libraryBase_;
  const InstructionPointer functionAddress_;
  const std::string libraryName_;
  const std::string functionName_;

  mutable bool hasBuildId_;
  mutable std::string buildId_;
};

/**
 * If a library identifier function is set, it is passed a libraryName
 * for the frame, and returns a library build id string, which will be
 * included in the logged stack trace.  The most common use for this
 * will be correlating stack traces with breakpad identifiers.
 */
typedef std::string (*LibraryIdentifierFunctionType)(const std::string&);

void setLibraryIdentifierFunction(LibraryIdentifierFunctionType func);

/**
 * Populate the vector with the current stack trace
 *
 * Note that this trace needs to be symbolicated to get the library offset even
 * if it is to be symbolicated off-line.
 *
 * Beware of a bug on some platforms, which makes the trace loop until the
 * buffer is full when it reaches a noexpr function. It seems to be fixed in
 * newer versions of gcc. https://gcc.gnu.org/bugzilla/show_bug.cgi?id=56846
 *
 * @param stackTrace The vector that will receive the stack trace. Before
 * filling the vector it will be cleared. The vector will never grow so the
 * number of frames captured is limited by the capacity of it.
 *
 * @param skip The number of frames to skip before capturing the trace
 */
void getStackTrace(std::vector<InstructionPointer>& stackTrace, size_t skip = 0);

/**
 * Creates a vector and populates it with the current stack trace
 *
 * Note that this trace needs to be symbolicated to get the library offset even
 * if it is to be symbolicated off-line.
 *
 * Beware of a bug on some platforms, which makes the trace loop until the
 * buffer is full when it reaches a noexpr function. It seems to be fixed in
 * newer versions of gcc. https://gcc.gnu.org/bugzilla/show_bug.cgi?id=56846
 *
 * @param skip The number of frames to skip before capturing the trace
 *
 * @limit The maximum number of frames captured
 */
inline std::vector<InstructionPointer> getStackTrace(
    size_t skip = 0,
    size_t limit = kDefaultLimit) {
  auto stackTrace = std::vector<InstructionPointer>{};
  stackTrace.reserve(limit);
  getStackTrace(stackTrace, skip + 1);
  return stackTrace;
}

/**
 * Symbolicates a stack trace into a given vector
 *
 * @param symbols The vector to receive the output. The vector is cleared and
 * enough room to keep the frames are reserved.
 *
 * @param stackTrace The input stack trace
 */
void getStackTraceSymbols(std::vector<StackTraceElement>& symbols,
                          const std::vector<InstructionPointer>& trace);

/**
 * Symbolicates a stack trace into a new vector
 *
 * @param stackTrace The input stack trace
 */
inline std::vector<StackTraceElement> getStackTraceSymbols(
    const std::vector<InstructionPointer>& trace) {
  auto symbols = std::vector<StackTraceElement>{};
  getStackTraceSymbols(symbols, trace);
  return symbols;
}


/**
 * Captures and symbolicates a stack trace
 *
 * Beware of a bug on some platforms, which makes the trace loop until the
 * buffer is full when it reaches a noexpr function. It seems to be fixed in
 * newer versions of gcc. https://gcc.gnu.org/bugzilla/show_bug.cgi?id=56846
 *
 * @param skip The number of frames before capturing the trace
 *
 * @param limit The maximum number of frames captured
 */
inline std::vector<StackTraceElement> getStackTraceSymbols(
    size_t skip = 0,
    size_t limit = kDefaultLimit) {
  return getStackTraceSymbols(getStackTrace(skip + 1, limit));
}

/**
 * Formatting a stack trace element
 */
std::ostream& operator<<(std::ostream& out, const StackTraceElement& elm);

/**
 * Formatting a stack trace
 */
std::ostream& operator<<(std::ostream& out,
                         const std::vector<StackTraceElement>& trace);

/**
 * Log stack trace
 *
 * Makes it possible to log a trace without using a temporary stream when the
 * underlying log API is not stream based.
 */
void logStackTrace(const std::vector<StackTraceElement>& trace);

}
}
