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

#include <folly/system/ThreadName.h>

#include <type_traits>

#include <folly/Portability.h>
#include <folly/Traits.h>
#include <folly/portability/PThread.h>
#include <folly/portability/Windows.h>

namespace folly {

// This looks a bit weird, but it's necessary to avoid
// having an undefined compiler function called.
#if defined(__GLIBC__) && !defined(__APPLE__) && !defined(__ANDROID__)
#if __GLIBC_PREREQ(2, 12)
// has pthread_setname_np(pthread_t, const char*) (2 params)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME 1
#endif
#endif

#if defined(__APPLE__)
#if defined(__MAC_OS_X_VERSION_MIN_REQUIRED) && \
    __MAC_OS_X_VERSION_MIN_REQUIRED >= 1060
// macOS 10.6+ has pthread_setname_np(const char*) (1 param)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 1
#elif defined(__IPHONE_OS_VERSION_MIN_REQUIRED) && \
    __IPHONE_OS_VERSION_MIN_REQUIRED >= 30200
// iOS 3.2+ has pthread_setname_np(const char*) (1 param)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 1
#endif
#endif // defined(__APPLE__)

namespace {

#if FOLLY_HAVE_PTHREAD && !_WIN32
pthread_t stdTidToPthreadId(std::thread::id tid) {
  static_assert(
      std::is_same<pthread_t, std::thread::native_handle_type>::value,
      "This assumes that the native handle type is pthread_t");
  static_assert(
      sizeof(std::thread::native_handle_type) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "std::thread::native_handle_type, but that doesn't appear to be true.");
  // In most implementations, std::thread::id is a thin wrapper around
  // std::thread::native_handle_type, which means we can do unsafe things to
  // extract it.
  pthread_t id;
  std::memcpy(&id, &tid, sizeof(id));
  return id;
}
#endif

} // namespace

bool canSetCurrentThreadName() {
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME || \
    FOLLY_HAS_PTHREAD_SETNAME_NP_NAME || _WIN32
  return true;
#else
  return false;
#endif
}

bool canSetOtherThreadName() {
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME || _WIN32
  return true;
#else
  return false;
#endif
}

static constexpr size_t kMaxThreadNameLength = 16;

Optional<std::string> getThreadName(std::thread::id id) {
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME || \
    FOLLY_HAS_PTHREAD_SETNAME_NP_NAME
  std::array<char, kMaxThreadNameLength> buf;
  if (pthread_getname_np(stdTidToPthreadId(id), buf.data(), buf.size()) != 0) {
    return Optional<std::string>();
  }
  return folly::make_optional(std::string(buf.data()));
#else
  // There's not actually a way to get the thread name on Windows because
  // thread names are a concept managed by the debugger, not the runtime.
  return Optional<std::string>();
#endif
}

Optional<std::string> getCurrentThreadName() {
  return getThreadName(std::this_thread::get_id());
}

bool setThreadName(std::thread::id tid, StringPiece name) {
  auto trimmedName = name.subpiece(0, kMaxThreadNameLength - 1).str();
#if _WIN32
  static_assert(
      sizeof(unsigned int) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "the thread id as an unsigned int, but that doesn't appear to be true.");

// http://msdn.microsoft.com/en-us/library/xcb2z8hs.aspx
#pragma pack(push, 8)
  struct THREADNAME_INFO {
    DWORD dwType; // Must be 0x1000
    LPCSTR szName; // Pointer to name (in user address space)
    DWORD dwThreadID; // Thread ID (-1 for caller thread)
    DWORD dwFlags; // Reserved for future use; must be zero
  };
  union TNIUnion {
    THREADNAME_INFO tni;
    ULONG_PTR upArray[4];
  };
#pragma pack(pop)

  static constexpr DWORD kMSVCException = 0x406D1388;

  // std::thread::id is a thin wrapper around an integral thread id,
  // so just extract the ID.
  unsigned int id;
  std::memcpy(&id, &tid, sizeof(id));

  TNIUnion tniUnion = {0x1000, trimmedName.data(), id, 0};
  // This has to be in a separate stack frame from trimmedName, which requires
  // C++ object destruction semantics.
  return [&]() {
    __try {
      RaiseException(kMSVCException, 0, 4, tniUnion.upArray);
    } __except (
        GetExceptionCode() == kMSVCException ? EXCEPTION_CONTINUE_EXECUTION
                                             : EXCEPTION_EXECUTE_HANDLER) {
      // Swallow the exception when a debugger isn't attached.
    }
    return true;
  }();
#else
  name = name.subpiece(0, kMaxThreadNameLength - 1);
  char buf[kMaxThreadNameLength] = {};
  std::memcpy(buf, name.data(), name.size());
  auto id = stdTidToPthreadId(tid);
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME
  return 0 == pthread_setname_np(id, buf);
#elif FOLLY_HAS_PTHREAD_SETNAME_NP_NAME
  // Since macOS 10.6 and iOS 3.2 it is possible for a thread to set its own
  // name, but not that of some other thread.
  if (pthread_equal(pthread_self(), id)) {
    return 0 == pthread_setname_np(buf);
  }
  return false;
#else
  (void)id;
  return false;
#endif
#endif
}

bool setThreadName(pthread_t pid, StringPiece name) {
#if _WIN32
  static_assert(
      sizeof(unsigned int) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "the thread id as an unsigned int, but that doesn't appear to be true.");

  // std::thread::id is a thin wrapper around an integral thread id,
  // so just stick the ID in.
  unsigned int tid = pthread_getw32threadid_np(pid);
  std::thread::id id;
  std::memcpy(&id, &tid, sizeof(id));
  return setThreadName(id, name);
#else
  static_assert(
      std::is_same<pthread_t, std::thread::native_handle_type>::value,
      "This assumes that the native handle type is pthread_t");
  static_assert(
      sizeof(std::thread::native_handle_type) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "std::thread::native_handle_type, but that doesn't appear to be true.");
  // In most implementations, std::thread::id is a thin wrapper around
  // std::thread::native_handle_type, which means we can do unsafe things to
  // extract it.
  std::thread::id id;
  std::memcpy(static_cast<void*>(&id), &pid, sizeof(id));
  return setThreadName(id, name);
#endif
}

bool setThreadName(StringPiece name) {
  return setThreadName(std::this_thread::get_id(), name);
}
} // namespace folly
