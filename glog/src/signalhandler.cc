// Copyright (c) 2008, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Author: Satoru Takabayashi
//
// Implementation of InstallFailureSignalHandler().

#include "utilities.h"
#include "stacktrace.h"
#include "symbolize.h"
#include "glog/logging.h"

#include <signal.h>
#include <time.h>
#ifdef HAVE_UCONTEXT_H
# include <ucontext.h>
#endif
#ifdef HAVE_SYS_UCONTEXT_H
# include <sys/ucontext.h>
#endif
#include <algorithm>

_START_GOOGLE_NAMESPACE_

// TOOD(hamaji): Use signal instead of sigaction?
#ifdef HAVE_SIGACTION

namespace {

// We'll install the failure signal handler for these signals.  We could
// use strsignal() to get signal names, but we don't use it to avoid
// introducing yet another #ifdef complication.
//
// The list should be synced with the comment in signalhandler.h.
const struct {
  int number;
  const char *name;
} kFailureSignals[] = {
  { SIGSEGV, "SIGSEGV" },
  { SIGILL, "SIGILL" },
  { SIGFPE, "SIGFPE" },
  { SIGABRT, "SIGABRT" },
  { SIGBUS, "SIGBUS" },
  { SIGTERM, "SIGTERM" },
};

// Returns the program counter from signal context, NULL if unknown.
void* GetPC(void* ucontext_in_void) {
#if (defined(HAVE_UCONTEXT_H) || defined(HAVE_SYS_UCONTEXT_H)) && defined(PC_FROM_UCONTEXT)
  if (ucontext_in_void != NULL) {
    ucontext_t *context = reinterpret_cast<ucontext_t *>(ucontext_in_void);
    return (void*)context->PC_FROM_UCONTEXT;
  }
#endif
  return NULL;
}

// The class is used for formatting error messages.  We don't use printf()
// as it's not async signal safe.
class MinimalFormatter {
 public:
  MinimalFormatter(char *buffer, int size)
      : buffer_(buffer),
        cursor_(buffer),
        end_(buffer + size) {
  }

  // Returns the number of bytes written in the buffer.
  int num_bytes_written() const { return cursor_ - buffer_; }

  // Appends string from "str" and updates the internal cursor.
  void AppendString(const char* str) {
    int i = 0;
    while (str[i] != '\0' && cursor_ + i < end_) {
      cursor_[i] = str[i];
      ++i;
    }
    cursor_ += i;
  }

  // Formats "number" in "radix" and updates the internal cursor.
  // Lowercase letters are used for 'a' - 'z'.
  void AppendUint64(uint64 number, int radix) {
    int i = 0;
    while (cursor_ + i < end_) {
      const int tmp = number % radix;
      number /= radix;
      cursor_[i] = (tmp < 10 ? '0' + tmp : 'a' + tmp - 10);
      ++i;
      if (number == 0) {
        break;
      }
    }
    // Reverse the bytes written.
    std::reverse(cursor_, cursor_ + i);
    cursor_ += i;
  }

  // Formats "number" as hexadecimal number, and updates the internal
  // cursor.  Padding will be added in front if needed.
  void AppendHexWithPadding(uint64 number, int width) {
    char* start = cursor_;
    AppendString("0x");
    AppendUint64(number, 16);
    // Move to right and add padding in front if needed.
    if (cursor_ < start + width) {
      const int64 delta = start + width - cursor_;
      std::copy(start, cursor_, start + delta);
      std::fill(start, start + delta, ' ');
      cursor_ = start + width;
    }
  }

 private:
  char *buffer_;
  char *cursor_;
  const char * const end_;
};

// Writes the given data with the size to the standard error.
void WriteToStderr(const char* data, int size) {
  if (write(STDERR_FILENO, data, size) < 0) {
    // Ignore errors.
  }
}

// The writer function can be changed by InstallFailureWriter().
void (*g_failure_writer)(const char* data, int size) = WriteToStderr;

// Dumps time information.  We don't dump human-readable time information
// as localtime() is not guaranteed to be async signal safe.
void DumpTimeInfo() {
  time_t time_in_sec = time(NULL);
  char buf[256];  // Big enough for time info.
  MinimalFormatter formatter(buf, sizeof(buf));
  formatter.AppendString("*** Aborted at ");
  formatter.AppendUint64(time_in_sec, 10);
  formatter.AppendString(" (unix time)");
  formatter.AppendString(" try \"date -d @");
  formatter.AppendUint64(time_in_sec, 10);
  formatter.AppendString("\" if you are using GNU date ***\n");
  g_failure_writer(buf, formatter.num_bytes_written());
}

// Dumps information about the signal to STDERR.
void DumpSignalInfo(int signal_number, siginfo_t *siginfo) {
  // Get the signal name.
  const char* signal_name = NULL;
  for (size_t i = 0; i < ARRAYSIZE(kFailureSignals); ++i) {
    if (signal_number == kFailureSignals[i].number) {
      signal_name = kFailureSignals[i].name;
    }
  }

  char buf[256];  // Big enough for signal info.
  MinimalFormatter formatter(buf, sizeof(buf));

  formatter.AppendString("*** ");
  if (signal_name) {
    formatter.AppendString(signal_name);
  } else {
    // Use the signal number if the name is unknown.  The signal name
    // should be known, but just in case.
    formatter.AppendString("Signal ");
    formatter.AppendUint64(signal_number, 10);
  }
  formatter.AppendString(" (@0x");
  formatter.AppendUint64(reinterpret_cast<uintptr_t>(siginfo->si_addr), 16);
  formatter.AppendString(")");
  formatter.AppendString(" received by PID ");
  formatter.AppendUint64(getpid(), 10);
  formatter.AppendString(" (TID 0x");
  // We assume pthread_t is an integral number or a pointer, rather
  // than a complex struct.  In some environments, pthread_self()
  // returns an uint64 but in some other environments pthread_self()
  // returns a pointer.  Hence we use C-style cast here, rather than
  // reinterpret/static_cast, to support both types of environments.
  formatter.AppendUint64((uintptr_t)pthread_self(), 16);
  formatter.AppendString(") ");
  // Only linux has the PID of the signal sender in si_pid.
#ifdef OS_LINUX
  formatter.AppendString("from PID ");
  formatter.AppendUint64(siginfo->si_pid, 10);
  formatter.AppendString("; ");
#endif
  formatter.AppendString("stack trace: ***\n");
  g_failure_writer(buf, formatter.num_bytes_written());
}

// Dumps information about the stack frame to STDERR.
void DumpStackFrameInfo(const char* prefix, void* pc) {
  // Get the symbol name.
  const char *symbol = "(unknown)";
  char symbolized[1024];  // Big enough for a sane symbol.
  // Symbolizes the previous address of pc because pc may be in the
  // next function.
  if (Symbolize(reinterpret_cast<char *>(pc) - 1,
                symbolized, sizeof(symbolized))) {
    symbol = symbolized;
  }

  char buf[1024];  // Big enough for stack frame info.
  MinimalFormatter formatter(buf, sizeof(buf));

  formatter.AppendString(prefix);
  formatter.AppendString("@ ");
  const int width = 2 * sizeof(void*) + 2;  // + 2  for "0x".
  formatter.AppendHexWithPadding(reinterpret_cast<uintptr_t>(pc), width);
  formatter.AppendString(" ");
  formatter.AppendString(symbol);
  formatter.AppendString("\n");
  g_failure_writer(buf, formatter.num_bytes_written());
}

// Invoke the default signal handler.
void InvokeDefaultSignalHandler(int signal_number) {
  struct sigaction sig_action;
  memset(&sig_action, 0, sizeof(sig_action));
  sigemptyset(&sig_action.sa_mask);
  sig_action.sa_handler = SIG_DFL;
  sigaction(signal_number, &sig_action, NULL);
  kill(getpid(), signal_number);
}

// This variable is used for protecting FailureSignalHandler() from
// dumping stuff while another thread is doing it.  Our policy is to let
// the first thread dump stuff and let other threads wait.
// See also comments in FailureSignalHandler().
static pthread_t* g_entered_thread_id_pointer = NULL;

// Dumps signal and stack frame information, and invokes the default
// signal handler once our job is done.
void FailureSignalHandler(int signal_number,
                          siginfo_t *signal_info,
                          void *ucontext) {
  // First check if we've already entered the function.  We use an atomic
  // compare and swap operation for platforms that support it.  For other
  // platforms, we use a naive method that could lead to a subtle race.

  // We assume pthread_self() is async signal safe, though it's not
  // officially guaranteed.
  pthread_t my_thread_id = pthread_self();
  // NOTE: We could simply use pthread_t rather than pthread_t* for this,
  // if pthread_self() is guaranteed to return non-zero value for thread
  // ids, but there is no such guarantee.  We need to distinguish if the
  // old value (value returned from __sync_val_compare_and_swap) is
  // different from the original value (in this case NULL).
  pthread_t* old_thread_id_pointer =
      glog_internal_namespace_::sync_val_compare_and_swap(
          &g_entered_thread_id_pointer,
          static_cast<pthread_t*>(NULL),
          &my_thread_id);
  if (old_thread_id_pointer != NULL) {
    // We've already entered the signal handler.  What should we do?
    if (pthread_equal(my_thread_id, *g_entered_thread_id_pointer)) {
      // It looks the current thread is reentering the signal handler.
      // Something must be going wrong (maybe we are reentering by another
      // type of signal?).  Kill ourself by the default signal handler.
      InvokeDefaultSignalHandler(signal_number);
    }
    // Another thread is dumping stuff.  Let's wait until that thread
    // finishes the job and kills the process.
    while (true) {
      sleep(1);
    }
  }
  // This is the first time we enter the signal handler.  We are going to
  // do some interesting stuff from here.
  // TODO(satorux): We might want to set timeout here using alarm(), but
  // mixing alarm() and sleep() can be a bad idea.

  // First dump time info.
  DumpTimeInfo();

  // Get the program counter from ucontext.
  void *pc = GetPC(ucontext);
  DumpStackFrameInfo("PC: ", pc);

#ifdef HAVE_STACKTRACE
  // Get the stack traces.
  void *stack[32];
  // +1 to exclude this function.
  const int depth = GetStackTrace(stack, ARRAYSIZE(stack), 1);
  DumpSignalInfo(signal_number, signal_info);
  // Dump the stack traces.
  for (int i = 0; i < depth; ++i) {
    DumpStackFrameInfo("    ", stack[i]);
  }
#endif

  // *** TRANSITION ***
  //
  // BEFORE this point, all code must be async-termination-safe!
  // (See WARNING above.)
  //
  // AFTER this point, we do unsafe things, like using LOG()!
  // The process could be terminated or hung at any time.  We try to
  // do more useful things first and riskier things later.

  // Flush the logs before we do anything in case 'anything'
  // causes problems.
  FlushLogFilesUnsafe(0);

  // Kill ourself by the default signal handler.
  InvokeDefaultSignalHandler(signal_number);
}

}  // namespace

#endif  // HAVE_SIGACTION

namespace glog_internal_namespace_ {

bool IsFailureSignalHandlerInstalled() {
#ifdef HAVE_SIGACTION
  struct sigaction sig_action;
  memset(&sig_action, 0, sizeof(sig_action));
  sigemptyset(&sig_action.sa_mask);
  sigaction(SIGABRT, NULL, &sig_action);
  if (sig_action.sa_sigaction == &FailureSignalHandler)
    return true;
#endif  // HAVE_SIGACTION
  return false;
}

}  // namespace glog_internal_namespace_

void InstallFailureSignalHandler() {
#ifdef HAVE_SIGACTION
  // Build the sigaction struct.
  struct sigaction sig_action;
  memset(&sig_action, 0, sizeof(sig_action));
  sigemptyset(&sig_action.sa_mask);
  sig_action.sa_flags |= SA_SIGINFO;
  sig_action.sa_sigaction = &FailureSignalHandler;

  for (size_t i = 0; i < ARRAYSIZE(kFailureSignals); ++i) {
    CHECK_ERR(sigaction(kFailureSignals[i].number, &sig_action, NULL));
  }
#endif  // HAVE_SIGACTION
}

void InstallFailureWriter(void (*writer)(const char* data, int size)) {
#ifdef HAVE_SIGACTION
  g_failure_writer = writer;
#endif  // HAVE_SIGACTION
}

_END_GOOGLE_NAMESPACE_
