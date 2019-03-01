// Copyright 2006-2008 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
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

#ifndef V8_CHECKS_H_
#define V8_CHECKS_H_

#include <string.h>

#include "flags.h"

extern "C" void V8_Fatal(const char* file, int line, const char* format, ...);
void API_Fatal(const char* location, const char* format, ...);

// The FATAL, UNREACHABLE and UNIMPLEMENTED macros are useful during
// development, but they should not be relied on in the final product.
#ifdef DEBUG
#define FATAL(msg)                              \
  V8_Fatal(__FILE__, __LINE__, "%s", (msg))
#define UNIMPLEMENTED()                         \
  V8_Fatal(__FILE__, __LINE__, "unimplemented code")
#define UNREACHABLE()                           \
  V8_Fatal(__FILE__, __LINE__, "unreachable code")
#else
#define FATAL(msg)                              \
  V8_Fatal("", 0, "%s", (msg))
#define UNIMPLEMENTED()                         \
  V8_Fatal("", 0, "unimplemented code")
#define UNREACHABLE() ((void) 0)
#endif


// Used by the CHECK macro -- should not be called directly.
static inline void CheckHelper(const char* file,
                               int line,
                               const char* source,
                               bool condition) {
  if (!condition)
    V8_Fatal(file, line, "CHECK(%s) failed", source);
}


// The CHECK macro checks that the given condition is true; if not, it
// prints a message to stderr and aborts.
#define CHECK(condition) CheckHelper(__FILE__, __LINE__, #condition, condition)


// Helper function used by the CHECK_EQ function when given int
// arguments.  Should not be called directly.
static inline void CheckEqualsHelper(const char* file, int line,
                                     const char* expected_source, int expected,
                                     const char* value_source, int value) {
  if (expected != value) {
    V8_Fatal(file, line,
             "CHECK_EQ(%s, %s) failed\n#   Expected: %i\n#   Found: %i",
             expected_source, value_source, expected, value);
  }
}


// Helper function used by the CHECK_EQ function when given int64_t
// arguments.  Should not be called directly.
static inline void CheckEqualsHelper(const char* file, int line,
                                     const char* expected_source,
                                     int64_t expected,
                                     const char* value_source,
                                     int64_t value) {
  if (expected != value) {
    // Print int64_t values in hex, as two int32s,
    // to avoid platform-dependencies.
    V8_Fatal(file, line,
             "CHECK_EQ(%s, %s) failed\n#"
             "   Expected: 0x%08x%08x\n#   Found: 0x%08x%08x",
             expected_source, value_source,
             static_cast<uint32_t>(expected >> 32),
             static_cast<uint32_t>(expected),
             static_cast<uint32_t>(value >> 32),
             static_cast<uint32_t>(value));
  }
}


// Helper function used by the CHECK_NE function when given int
// arguments.  Should not be called directly.
static inline void CheckNonEqualsHelper(const char* file,
                                        int line,
                                        const char* unexpected_source,
                                        int unexpected,
                                        const char* value_source,
                                        int value) {
  if (unexpected == value) {
    V8_Fatal(file, line, "CHECK_NE(%s, %s) failed\n#   Value: %i",
             unexpected_source, value_source, value);
  }
}


// Helper function used by the CHECK function when given string
// arguments.  Should not be called directly.
static inline void CheckEqualsHelper(const char* file,
                                     int line,
                                     const char* expected_source,
                                     const char* expected,
                                     const char* value_source,
                                     const char* value) {
  if ((expected == NULL && value != NULL) ||
      (expected != NULL && value == NULL) ||
      (expected != NULL && value != NULL && strcmp(expected, value) != 0)) {
    V8_Fatal(file, line,
             "CHECK_EQ(%s, %s) failed\n#   Expected: %s\n#   Found: %s",
             expected_source, value_source, expected, value);
  }
}


static inline void CheckNonEqualsHelper(const char* file,
                                        int line,
                                        const char* expected_source,
                                        const char* expected,
                                        const char* value_source,
                                        const char* value) {
  if (expected == value ||
      (expected != NULL && value != NULL && strcmp(expected, value) == 0)) {
    V8_Fatal(file, line, "CHECK_NE(%s, %s) failed\n#   Value: %s",
             expected_source, value_source, value);
  }
}


// Helper function used by the CHECK function when given pointer
// arguments.  Should not be called directly.
static inline void CheckEqualsHelper(const char* file,
                                     int line,
                                     const char* expected_source,
                                     const void* expected,
                                     const char* value_source,
                                     const void* value) {
  if (expected != value) {
    V8_Fatal(file, line,
             "CHECK_EQ(%s, %s) failed\n#   Expected: %p\n#   Found: %p",
             expected_source, value_source,
             expected, value);
  }
}


static inline void CheckNonEqualsHelper(const char* file,
                                        int line,
                                        const char* expected_source,
                                        const void* expected,
                                        const char* value_source,
                                        const void* value) {
  if (expected == value) {
    V8_Fatal(file, line, "CHECK_NE(%s, %s) failed\n#   Value: %p",
             expected_source, value_source, value);
  }
}


// Helper function used by the CHECK function when given floating
// point arguments.  Should not be called directly.
static inline void CheckEqualsHelper(const char* file,
                                     int line,
                                     const char* expected_source,
                                     double expected,
                                     const char* value_source,
                                     double value) {
  // Force values to 64 bit memory to truncate 80 bit precision on IA32.
  volatile double* exp = new double[1];
  *exp = expected;
  volatile double* val = new double[1];
  *val = value;
  if (*exp != *val) {
    V8_Fatal(file, line,
             "CHECK_EQ(%s, %s) failed\n#   Expected: %f\n#   Found: %f",
             expected_source, value_source, *exp, *val);
  }
  delete[] exp;
  delete[] val;
}


static inline void CheckNonEqualsHelper(const char* file,
                                     int line,
                                     const char* expected_source,
                                     double expected,
                                     const char* value_source,
                                     double value) {
  // Force values to 64 bit memory to truncate 80 bit precision on IA32.
  volatile double* exp = new double[1];
  *exp = expected;
  volatile double* val = new double[1];
  *val = value;
  if (*exp == *val) {
    V8_Fatal(file, line,
             "CHECK_NE(%s, %s) failed\n#   Value: %f",
             expected_source, value_source, *val);
  }
  delete[] exp;
  delete[] val;
}


namespace v8 {
  class Value;
  template <class T> class Handle;
}


void CheckNonEqualsHelper(const char* file,
                          int line,
                          const char* unexpected_source,
                          v8::Handle<v8::Value> unexpected,
                          const char* value_source,
                          v8::Handle<v8::Value> value);


void CheckEqualsHelper(const char* file,
                       int line,
                       const char* expected_source,
                       v8::Handle<v8::Value> expected,
                       const char* value_source,
                       v8::Handle<v8::Value> value);


#define CHECK_EQ(expected, value) CheckEqualsHelper(__FILE__, __LINE__, \
  #expected, expected, #value, value)


#define CHECK_NE(unexpected, value) CheckNonEqualsHelper(__FILE__, __LINE__, \
  #unexpected, unexpected, #value, value)


#define CHECK_GT(a, b) CHECK((a) > (b))
#define CHECK_GE(a, b) CHECK((a) >= (b))


// This is inspired by the static assertion facility in boost.  This
// is pretty magical.  If it causes you trouble on a platform you may
// find a fix in the boost code.
template <bool> class StaticAssertion;
template <> class StaticAssertion<true> { };
// This macro joins two tokens.  If one of the tokens is a macro the
// helper call causes it to be resolved before joining.
#define SEMI_STATIC_JOIN(a, b) SEMI_STATIC_JOIN_HELPER(a, b)
#define SEMI_STATIC_JOIN_HELPER(a, b) a##b
// Causes an error during compilation of the condition is not
// statically known to be true.  It is formulated as a typedef so that
// it can be used wherever a typedef can be used.  Beware that this
// actually causes each use to introduce a new defined type with a
// name depending on the source line.
template <int> class StaticAssertionHelper { };
#define STATIC_CHECK(test)                                                  \
  typedef                                                                   \
    StaticAssertionHelper<sizeof(StaticAssertion<static_cast<bool>(test)>)> \
    SEMI_STATIC_JOIN(__StaticAssertTypedef__, __LINE__)


// The ASSERT macro is equivalent to CHECK except that it only
// generates code in debug builds.
#ifdef DEBUG
#define ASSERT_RESULT(expr)  CHECK(expr)
#define ASSERT(condition)    CHECK(condition)
#define ASSERT_EQ(v1, v2)    CHECK_EQ(v1, v2)
#define ASSERT_NE(v1, v2)    CHECK_NE(v1, v2)
#define ASSERT_GE(v1, v2)    CHECK_GE(v1, v2)
#define SLOW_ASSERT(condition) if (FLAG_enable_slow_asserts) CHECK(condition)
#else
#define ASSERT_RESULT(expr)     (expr)
#define ASSERT(condition)      ((void) 0)
#define ASSERT_EQ(v1, v2)      ((void) 0)
#define ASSERT_NE(v1, v2)      ((void) 0)
#define ASSERT_GE(v1, v2)      ((void) 0)
#define SLOW_ASSERT(condition) ((void) 0)
#endif
// Static asserts has no impact on runtime performance, so they can be
// safely enabled in release mode. Moreover, the ((void) 0) expression
// obeys different syntax rules than typedef's, e.g. it can't appear
// inside class declaration, this leads to inconsistency between debug
// and release compilation modes behaviour.
#define STATIC_ASSERT(test)  STATIC_CHECK(test)


#define ASSERT_TAG_ALIGNED(address) \
  ASSERT((reinterpret_cast<intptr_t>(address) & kHeapObjectTagMask) == 0)

#define ASSERT_SIZE_TAG_ALIGNED(size) ASSERT((size & kHeapObjectTagMask) == 0)

#define ASSERT_NOT_NULL(p)  ASSERT_NE(NULL, p)

#endif  // V8_CHECKS_H_
