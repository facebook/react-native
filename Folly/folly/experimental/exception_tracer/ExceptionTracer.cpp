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

#include <folly/experimental/exception_tracer/ExceptionTracer.h>

#include <exception>
#include <iostream>

#include <dlfcn.h>

#include <glog/logging.h>

#include <folly/String.h>
#include <folly/experimental/exception_tracer/ExceptionAbi.h>
#include <folly/experimental/exception_tracer/StackTrace.h>
#include <folly/experimental/symbolizer/Symbolizer.h>

namespace {

using namespace ::folly::exception_tracer;
using namespace ::folly::symbolizer;
using namespace __cxxabiv1;

extern "C" {
StackTraceStack* getExceptionStackTraceStack(void) __attribute__((__weak__));
typedef StackTraceStack* (*GetExceptionStackTraceStackType)();
GetExceptionStackTraceStackType getExceptionStackTraceStackFn;
}

} // namespace

namespace folly {
namespace exception_tracer {

std::ostream& operator<<(std::ostream& out, const ExceptionInfo& info) {
  printExceptionInfo(out, info, SymbolizePrinter::COLOR_IF_TTY);
  return out;
}

void printExceptionInfo(
    std::ostream& out,
    const ExceptionInfo& info,
    int options) {
  out << "Exception type: ";
  if (info.type) {
    out << folly::demangle(*info.type);
  } else {
    out << "(unknown type)";
  }
  out << " (" << info.frames.size()
      << (info.frames.size() == 1 ? " frame" : " frames") << ")\n";
  try {
    size_t frameCount = info.frames.size();

    // Skip our own internal frames
    static constexpr size_t kInternalFramesNumber = 3;
    if (frameCount > kInternalFramesNumber) {
      auto addresses = info.frames.data() + kInternalFramesNumber;
      frameCount -= kInternalFramesNumber;

      std::vector<SymbolizedFrame> frames;
      frames.resize(frameCount);

      Symbolizer symbolizer(
          (options & SymbolizePrinter::NO_FILE_AND_LINE)
              ? Dwarf::LocationInfoMode::DISABLED
              : Symbolizer::kDefaultLocationInfoMode);
      symbolizer.symbolize(addresses, frames.data(), frameCount);

      OStreamSymbolizePrinter osp(out, options);
      osp.println(addresses, frames.data(), frameCount);
    }
  } catch (const std::exception& e) {
    out << "\n !! caught " << folly::exceptionStr(e) << "\n";
  } catch (...) {
    out << "\n !!! caught unexpected exception\n";
  }
}

namespace {

/**
 * Is this a standard C++ ABI exception?
 *
 * Dependent exceptions (thrown via std::rethrow_exception) aren't --
 * exc doesn't actually point to a __cxa_exception structure, but
 * the offset of unwindHeader is correct, so exc->unwindHeader actually
 * returns a _Unwind_Exception object.  Yeah, it's ugly like that.
 */
bool isAbiCppException(const __cxa_exception* exc) {
  // The least significant four bytes must be "C++\0"
  static const uint64_t cppClass =
      ((uint64_t)'C' << 24) | ((uint64_t)'+' << 16) | ((uint64_t)'+' << 8);
  return (exc->unwindHeader.exception_class & 0xffffffff) == cppClass;
}

} // namespace

std::vector<ExceptionInfo> getCurrentExceptions() {
  struct Once {
    Once() {
      // See if linked in with us (getExceptionStackTraceStack is weak)
      getExceptionStackTraceStackFn = getExceptionStackTraceStack;

      if (!getExceptionStackTraceStackFn) {
        // Nope, see if it's in a shared library
        getExceptionStackTraceStackFn = (GetExceptionStackTraceStackType)dlsym(
            RTLD_NEXT, "getExceptionStackTraceStack");
      }
    }
  };
  static Once once;

  std::vector<ExceptionInfo> exceptions;
  auto currentException = __cxa_get_globals()->caughtExceptions;
  if (!currentException) {
    return exceptions;
  }

  StackTraceStack* traceStack = nullptr;
  if (!getExceptionStackTraceStackFn) {
    static bool logged = false;
    if (!logged) {
      LOG(WARNING)
          << "Exception tracer library not linked, stack traces not available";
      logged = true;
    }
  } else if ((traceStack = getExceptionStackTraceStackFn()) == nullptr) {
    static bool logged = false;
    if (!logged) {
      LOG(WARNING)
          << "Exception stack trace invalid, stack traces not available";
      logged = true;
    }
  }

  StackTrace* trace = traceStack ? traceStack->top() : nullptr;
  while (currentException) {
    ExceptionInfo info;
    // Dependent exceptions (thrown via std::rethrow_exception) aren't
    // standard ABI __cxa_exception objects, and are correctly labeled as
    // such in the exception_class field.  We could try to extract the
    // primary exception type in horribly hacky ways, but, for now, nullptr.
    info.type = isAbiCppException(currentException)
        ? currentException->exceptionType
        : nullptr;

    if (traceStack) {
      LOG_IF(DFATAL, !trace)
          << "Invalid trace stack for exception of type: "
          << (info.type ? folly::demangle(*info.type) : "null");

      if (!trace) {
        return {};
      }

      info.frames.assign(
          trace->addresses, trace->addresses + trace->frameCount);
      trace = traceStack->next(trace);
    }
    currentException = currentException->nextException;
    exceptions.push_back(std::move(info));
  }

  LOG_IF(DFATAL, trace) << "Invalid trace stack!";

  return exceptions;
}

namespace {

std::terminate_handler origTerminate = abort;
std::unexpected_handler origUnexpected = abort;

void dumpExceptionStack(const char* prefix) {
  auto exceptions = getCurrentExceptions();
  if (exceptions.empty()) {
    return;
  }
  LOG(ERROR) << prefix << ", exception stack follows";
  for (auto& exc : exceptions) {
    LOG(ERROR) << exc << "\n";
  }
  LOG(ERROR) << "exception stack complete";
}

void terminateHandler() {
  dumpExceptionStack("terminate() called");
  origTerminate();
}

void unexpectedHandler() {
  dumpExceptionStack("Unexpected exception");
  origUnexpected();
}

} // namespace

void installHandlers() {
  struct Once {
    Once() {
      origTerminate = std::set_terminate(terminateHandler);
      origUnexpected = std::set_unexpected(unexpectedHandler);
    }
  };
  static Once once;
}

} // namespace exception_tracer
} // namespace folly
