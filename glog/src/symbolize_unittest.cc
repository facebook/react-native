// Copyright (c) 2006, Google Inc.
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
// Unit tests for functions in symbolize.cc.

#include "utilities.h"

#include <signal.h>
#include <iostream>

#include "glog/logging.h"
#include "symbolize.h"
#include "googletest.h"
#include "config.h"

#ifdef HAVE_LIB_GFLAGS
#include <gflags/gflags.h>
using namespace GFLAGS_NAMESPACE;
#endif

using namespace std;
using namespace GOOGLE_NAMESPACE;

#if defined(HAVE_STACKTRACE) && defined(__ELF__)

#define always_inline

// This unit tests make sense only with GCC.
// Uses lots of GCC specific features.
#if defined(__GNUC__) && !defined(__OPENCC__)
#  if __GNUC__ >= 4
#    define TEST_WITH_MODERN_GCC
#    if __i386__  // always_inline isn't supported for x86_64 with GCC 4.1.0.
#      undef always_inline
#      define always_inline __attribute__((always_inline))
#      define HAVE_ALWAYS_INLINE
#    endif  // __i386__
#  else
#  endif  // __GNUC__ >= 4
#  if defined(__i386__) || defined(__x86_64__)
#    define TEST_X86_32_AND_64 1
#  endif  // defined(__i386__) || defined(__x86_64__)
#endif

// A wrapper function for Symbolize() to make the unit test simple.
static const char *TrySymbolize(void *pc) {
  static char symbol[4096];
  if (Symbolize(pc, symbol, sizeof(symbol))) {
    return symbol;
  } else {
    return NULL;
  }
}

// Make them C linkage to avoid mangled names.
extern "C" {
void nonstatic_func() {
  volatile int a = 0;
  ++a;
}

static void static_func() {
  volatile int a = 0;
  ++a;
}
}

TEST(Symbolize, Symbolize) {
  // We do C-style cast since GCC 2.95.3 doesn't allow
  // reinterpret_cast<void *>(&func).

  // Compilers should give us pointers to them.
  EXPECT_STREQ("nonstatic_func", TrySymbolize((void *)(&nonstatic_func)));
  EXPECT_STREQ("static_func", TrySymbolize((void *)(&static_func)));

  EXPECT_TRUE(NULL == TrySymbolize(NULL));
}

struct Foo {
  static void func(int x);
};

void ATTRIBUTE_NOINLINE Foo::func(int x) {
  volatile int a = x;
  ++a;
}

// With a modern GCC, Symbolize() should return demangled symbol
// names.  Function parameters should be omitted.
#ifdef TEST_WITH_MODERN_GCC
TEST(Symbolize, SymbolizeWithDemangling) {
  Foo::func(100);
  EXPECT_STREQ("Foo::func()", TrySymbolize((void *)(&Foo::func)));
}
#endif

// Tests that verify that Symbolize footprint is within some limit.

// To measure the stack footprint of the Symbolize function, we create
// a signal handler (for SIGUSR1 say) that calls the Symbolize function
// on an alternate stack. This alternate stack is initialized to some
// known pattern (0x55, 0x55, 0x55, ...). We then self-send this signal,
// and after the signal handler returns, look at the alternate stack
// buffer to see what portion has been touched.
//
// This trick gives us the the stack footprint of the signal handler.
// But the signal handler, even before the call to Symbolize, consumes
// some stack already. We however only want the stack usage of the
// Symbolize function. To measure this accurately, we install two signal
// handlers: one that does nothing and just returns, and another that
// calls Symbolize. The difference between the stack consumption of these
// two signals handlers should give us the Symbolize stack foorprint.

static void *g_pc_to_symbolize;
static char g_symbolize_buffer[4096];
static char *g_symbolize_result;

static void EmptySignalHandler(int signo) {}

static void SymbolizeSignalHandler(int signo) {
  if (Symbolize(g_pc_to_symbolize, g_symbolize_buffer,
                sizeof(g_symbolize_buffer))) {
    g_symbolize_result = g_symbolize_buffer;
  } else {
    g_symbolize_result = NULL;
  }
}

const int kAlternateStackSize = 8096;
const char kAlternateStackFillValue = 0x55;

// These helper functions look at the alternate stack buffer, and figure
// out what portion of this buffer has been touched - this is the stack
// consumption of the signal handler running on this alternate stack.
static ATTRIBUTE_NOINLINE bool StackGrowsDown(int *x) {
  int y;
  return &y < x;
}
static int GetStackConsumption(const char* alt_stack) {
  int x;
  if (StackGrowsDown(&x)) {
    for (int i = 0; i < kAlternateStackSize; i++) {
      if (alt_stack[i] != kAlternateStackFillValue) {
        return (kAlternateStackSize - i);
      }
    }
  } else {
    for (int i = (kAlternateStackSize - 1); i >= 0; i--) {
      if (alt_stack[i] != kAlternateStackFillValue) {
        return i;
      }
    }
  }
  return -1;
}

#ifdef HAVE_SIGALTSTACK

// Call Symbolize and figure out the stack footprint of this call.
static const char *SymbolizeStackConsumption(void *pc, int *stack_consumed) {

  g_pc_to_symbolize = pc;

  // The alt-signal-stack cannot be heap allocated because there is a
  // bug in glibc-2.2 where some signal handler setup code looks at the
  // current stack pointer to figure out what thread is currently running.
  // Therefore, the alternate stack must be allocated from the main stack
  // itself.
  char altstack[kAlternateStackSize];
  memset(altstack, kAlternateStackFillValue, kAlternateStackSize);

  // Set up the alt-signal-stack (and save the older one).
  stack_t sigstk;
  memset(&sigstk, 0, sizeof(stack_t));
  stack_t old_sigstk;
  sigstk.ss_sp = altstack;
  sigstk.ss_size = kAlternateStackSize;
  sigstk.ss_flags = 0;
  CHECK_ERR(sigaltstack(&sigstk, &old_sigstk));

  // Set up SIGUSR1 and SIGUSR2 signal handlers (and save the older ones).
  struct sigaction sa;
  memset(&sa, 0, sizeof(struct sigaction));
  struct sigaction old_sa1, old_sa2;
  sigemptyset(&sa.sa_mask);
  sa.sa_flags = SA_ONSTACK;

  // SIGUSR1 maps to EmptySignalHandler.
  sa.sa_handler = EmptySignalHandler;
  CHECK_ERR(sigaction(SIGUSR1, &sa, &old_sa1));

  // SIGUSR2 maps to SymbolizeSignalHanlder.
  sa.sa_handler = SymbolizeSignalHandler;
  CHECK_ERR(sigaction(SIGUSR2, &sa, &old_sa2));

  // Send SIGUSR1 signal and measure the stack consumption of the empty
  // signal handler.
  CHECK_ERR(kill(getpid(), SIGUSR1));
  int stack_consumption1 = GetStackConsumption(altstack);

  // Send SIGUSR2 signal and measure the stack consumption of the symbolize
  // signal handler.
  CHECK_ERR(kill(getpid(), SIGUSR2));
  int stack_consumption2 = GetStackConsumption(altstack);

  // The difference between the two stack consumption values is the
  // stack footprint of the Symbolize function.
  if (stack_consumption1 != -1 && stack_consumption2 != -1) {
    *stack_consumed = stack_consumption2 - stack_consumption1;
  } else {
    *stack_consumed = -1;
  }

  // Log the stack consumption values.
  LOG(INFO) << "Stack consumption of empty signal handler: "
            << stack_consumption1;
  LOG(INFO) << "Stack consumption of symbolize signal handler: "
            << stack_consumption2;
  LOG(INFO) << "Stack consumption of Symbolize: " << *stack_consumed;

  // Now restore the old alt-signal-stack and signal handlers.
  CHECK_ERR(sigaltstack(&old_sigstk, NULL));
  CHECK_ERR(sigaction(SIGUSR1, &old_sa1, NULL));
  CHECK_ERR(sigaction(SIGUSR2, &old_sa2, NULL));

  return g_symbolize_result;
}

// Symbolize stack consumption should be within 2kB.
const int kStackConsumptionUpperLimit = 2048;

TEST(Symbolize, SymbolizeStackConsumption) {
  int stack_consumed;
  const char* symbol;

  symbol = SymbolizeStackConsumption((void *)(&nonstatic_func),
                                     &stack_consumed);
  EXPECT_STREQ("nonstatic_func", symbol);
  EXPECT_GT(stack_consumed, 0);
  EXPECT_LT(stack_consumed, kStackConsumptionUpperLimit);

  symbol = SymbolizeStackConsumption((void *)(&static_func),
                                     &stack_consumed);
  EXPECT_STREQ("static_func", symbol);
  EXPECT_GT(stack_consumed, 0);
  EXPECT_LT(stack_consumed, kStackConsumptionUpperLimit);
}

#ifdef TEST_WITH_MODERN_GCC
TEST(Symbolize, SymbolizeWithDemanglingStackConsumption) {
  Foo::func(100);
  int stack_consumed;
  const char* symbol;

  symbol = SymbolizeStackConsumption((void *)(&Foo::func), &stack_consumed);

  EXPECT_STREQ("Foo::func()", symbol);
  EXPECT_GT(stack_consumed, 0);
  EXPECT_LT(stack_consumed, kStackConsumptionUpperLimit);
}
#endif

#endif  // HAVE_SIGALTSTACK

// x86 specific tests.  Uses some inline assembler.
extern "C" {
inline void* always_inline inline_func() {
  register void *pc = NULL;
#ifdef TEST_X86_32_AND_64
  __asm__ __volatile__("call 1f; 1: pop %0" : "=r"(pc));
#endif
  return pc;
}

void* ATTRIBUTE_NOINLINE non_inline_func() {
  register void *pc = NULL;
#ifdef TEST_X86_32_AND_64
  __asm__ __volatile__("call 1f; 1: pop %0" : "=r"(pc));
#endif
  return pc;
}

void ATTRIBUTE_NOINLINE TestWithPCInsideNonInlineFunction() {
#if defined(TEST_X86_32_AND_64) && defined(HAVE_ATTRIBUTE_NOINLINE)
  void *pc = non_inline_func();
  const char *symbol = TrySymbolize(pc);
  CHECK(symbol != NULL);
  CHECK_STREQ(symbol, "non_inline_func");
  cout << "Test case TestWithPCInsideNonInlineFunction passed." << endl;
#endif
}

void ATTRIBUTE_NOINLINE TestWithPCInsideInlineFunction() {
#if defined(TEST_X86_32_AND_64) && defined(HAVE_ALWAYS_INLINE)
  void *pc = inline_func();  // Must be inlined.
  const char *symbol = TrySymbolize(pc);
  CHECK(symbol != NULL);
  CHECK_STREQ(symbol, __FUNCTION__);
  cout << "Test case TestWithPCInsideInlineFunction passed." << endl;
#endif
}
}

// Test with a return address.
void ATTRIBUTE_NOINLINE TestWithReturnAddress() {
#if defined(HAVE_ATTRIBUTE_NOINLINE)
  void *return_address = __builtin_return_address(0);
  const char *symbol = TrySymbolize(return_address);
  CHECK(symbol != NULL);
  CHECK_STREQ(symbol, "main");
  cout << "Test case TestWithReturnAddress passed." << endl;
#endif
}

int main(int argc, char **argv) {
  FLAGS_logtostderr = true;
  InitGoogleLogging(argv[0]);
  InitGoogleTest(&argc, argv);
#ifdef HAVE_SYMBOLIZE
  // We don't want to get affected by the callback interface, that may be
  // used to install some callback function at InitGoogle() time.
  InstallSymbolizeCallback(NULL);

  TestWithPCInsideInlineFunction();
  TestWithPCInsideNonInlineFunction();
  TestWithReturnAddress();
  return RUN_ALL_TESTS();
#else
  return 0;
#endif
}

#else
int main() {
#ifdef HAVE_SYMBOLIZE
  printf("PASS (no symbolize_unittest support)\n");
#else
  printf("PASS (no symbolize support)\n");
#endif
  return 0;
}
#endif  // HAVE_STACKTRACE
