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

#include <folly/experimental/exception_tracer/ExceptionTracerLib.h>

#include <dlfcn.h>

#include <vector>

#include <folly/Indestructible.h>
#include <folly/Portability.h>
#include <folly/SharedMutex.h>
#include <folly/Synchronized.h>

namespace __cxxabiv1 {

extern "C" {
void __cxa_throw(
    void* thrownException,
    std::type_info* type,
    void (*destructor)(void*)) __attribute__((__noreturn__));
void* __cxa_begin_catch(void* excObj) throw();
void __cxa_rethrow(void) __attribute__((__noreturn__));
void __cxa_end_catch(void);
}

} // namespace __cxxabiv1

using namespace folly::exception_tracer;

namespace {

template <typename Function>
class CallbackHolder {
 public:
  void registerCallback(Function f) {
    callbacks_.wlock()->push_back(std::move(f));
  }

  // always inline to enforce kInternalFramesNumber
  template <typename... Args>
  FOLLY_ALWAYS_INLINE void invoke(Args... args) {
    auto callbacksLock = callbacks_.rlock();
    for (auto& cb : *callbacksLock) {
      cb(args...);
    }
  }

 private:
  folly::Synchronized<std::vector<Function>> callbacks_;
};

} // namespace

namespace folly {
namespace exception_tracer {

#define DECLARE_CALLBACK(NAME)                                   \
  CallbackHolder<NAME##Type>& get##NAME##Callbacks() {           \
    static Indestructible<CallbackHolder<NAME##Type>> Callbacks; \
    return *Callbacks;                                           \
  }                                                              \
  void register##NAME##Callback(NAME##Type callback) {           \
    get##NAME##Callbacks().registerCallback(callback);           \
  }

DECLARE_CALLBACK(CxaThrow)
DECLARE_CALLBACK(CxaBeginCatch)
DECLARE_CALLBACK(CxaRethrow)
DECLARE_CALLBACK(CxaEndCatch)
DECLARE_CALLBACK(RethrowException)

} // namespace exception_tracer
} // namespace folly

// Clang is smart enough to understand that the symbols we're loading
// are [[noreturn]], but GCC is not. In order to be able to build with
// -Wunreachable-code enable for Clang, these __builtin_unreachable()
// calls need to go away. Everything else is messy though, so just
// #define it to an empty macro under Clang and be done with it.
#ifdef __clang__
#define __builtin_unreachable()
#endif

namespace __cxxabiv1 {

void __cxa_throw(
    void* thrownException,
    std::type_info* type,
    void (*destructor)(void*)) {
  static auto orig_cxa_throw =
      reinterpret_cast<decltype(&__cxa_throw)>(dlsym(RTLD_NEXT, "__cxa_throw"));
  getCxaThrowCallbacks().invoke(thrownException, type, destructor);
  orig_cxa_throw(thrownException, type, destructor);
  __builtin_unreachable(); // orig_cxa_throw never returns
}

void __cxa_rethrow() {
  // __cxa_rethrow leaves the current exception on the caught stack,
  // and __cxa_begin_catch recognizes that case.  We could do the same, but
  // we'll implement something simpler (and slower): we pop the exception from
  // the caught stack, and push it back onto the active stack; this way, our
  // implementation of __cxa_begin_catch doesn't have to do anything special.
  static auto orig_cxa_rethrow = reinterpret_cast<decltype(&__cxa_rethrow)>(
      dlsym(RTLD_NEXT, "__cxa_rethrow"));
  getCxaRethrowCallbacks().invoke();
  orig_cxa_rethrow();
  __builtin_unreachable(); // orig_cxa_rethrow never returns
}

void* __cxa_begin_catch(void* excObj) throw() {
  // excObj is a pointer to the unwindHeader in __cxa_exception
  static auto orig_cxa_begin_catch =
      reinterpret_cast<decltype(&__cxa_begin_catch)>(
          dlsym(RTLD_NEXT, "__cxa_begin_catch"));
  getCxaBeginCatchCallbacks().invoke(excObj);
  return orig_cxa_begin_catch(excObj);
}

void __cxa_end_catch() {
  static auto orig_cxa_end_catch = reinterpret_cast<decltype(&__cxa_end_catch)>(
      dlsym(RTLD_NEXT, "__cxa_end_catch"));
  getCxaEndCatchCallbacks().invoke();
  orig_cxa_end_catch();
}

} // namespace __cxxabiv1

namespace std {

void rethrow_exception(std::exception_ptr ep) {
  // Mangled name for std::rethrow_exception
  // TODO(tudorb): Dicey, as it relies on the fact that std::exception_ptr
  // is typedef'ed to a type in namespace __exception_ptr
  static auto orig_rethrow_exception =
      reinterpret_cast<decltype(&rethrow_exception)>(dlsym(
          RTLD_NEXT,
          "_ZSt17rethrow_exceptionNSt15__exception_ptr13exception_ptrE"));
  getRethrowExceptionCallbacks().invoke(ep);
  orig_rethrow_exception(ep);
  __builtin_unreachable(); // orig_rethrow_exception never returns
}

} // namespace std
