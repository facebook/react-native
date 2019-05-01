/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/Random.h>

#include <array>
#include <atomic>
#include <mutex>
#include <random>

#include <folly/File.h>
#include <folly/FileUtil.h>
#include <folly/SingletonThreadLocal.h>
#include <folly/ThreadLocal.h>
#include <folly/portability/SysTime.h>
#include <folly/portability/Unistd.h>
#include <folly/synchronization/CallOnce.h>
#include <glog/logging.h>

#ifdef _MSC_VER
#include <wincrypt.h> // @manual
#endif

namespace folly {

namespace {

void readRandomDevice(void* data, size_t size) {
#ifdef _MSC_VER
  static folly::once_flag flag;
  static HCRYPTPROV cryptoProv;
  folly::call_once(flag, [&] {
    if (!CryptAcquireContext(
            &cryptoProv,
            nullptr,
            nullptr,
            PROV_RSA_FULL,
            CRYPT_VERIFYCONTEXT)) {
      if (GetLastError() == NTE_BAD_KEYSET) {
        // Mostly likely cause of this is that no key container
        // exists yet, so try to create one.
        PCHECK(CryptAcquireContext(
            &cryptoProv, nullptr, nullptr, PROV_RSA_FULL, CRYPT_NEWKEYSET));
      } else {
        LOG(FATAL) << "Failed to acquire the default crypto context.";
      }
    }
  });
  CHECK(size <= std::numeric_limits<DWORD>::max());
  PCHECK(CryptGenRandom(cryptoProv, (DWORD)size, (BYTE*)data));
#else
  // Keep the random device open for the duration of the program.
  static int randomFd = ::open("/dev/urandom", O_RDONLY | O_CLOEXEC);
  PCHECK(randomFd >= 0);
  auto bytesRead = readFull(randomFd, data, size);
  PCHECK(bytesRead >= 0 && size_t(bytesRead) == size);
#endif
}

class BufferedRandomDevice {
 public:
  static once_flag flag;
  static constexpr size_t kDefaultBufferSize = 128;

  static void notifyNewGlobalEpoch() {
    globalEpoch_.fetch_add(1, std::memory_order_relaxed);
  }

  explicit BufferedRandomDevice(size_t bufferSize = kDefaultBufferSize);

  void get(void* data, size_t size) {
    auto const globalEpoch = globalEpoch_.load(std::memory_order_relaxed);
    if (LIKELY(globalEpoch == epoch_ && size <= remaining())) {
      memcpy(data, ptr_, size);
      ptr_ += size;
    } else {
      getSlow(static_cast<unsigned char*>(data), size);
    }
  }

 private:
  void getSlow(unsigned char* data, size_t size);

  inline size_t remaining() const {
    return size_t(buffer_.get() + bufferSize_ - ptr_);
  }

  static std::atomic<size_t> globalEpoch_;

  size_t epoch_{size_t(-1)}; // refill on first use
  const size_t bufferSize_;
  std::unique_ptr<unsigned char[]> buffer_;
  unsigned char* ptr_;
};

once_flag BufferedRandomDevice::flag;
std::atomic<size_t> BufferedRandomDevice::globalEpoch_{0};
struct RandomTag {};

BufferedRandomDevice::BufferedRandomDevice(size_t bufferSize)
    : bufferSize_(bufferSize),
      buffer_(new unsigned char[bufferSize]),
      ptr_(buffer_.get() + bufferSize) { // refill on first use
  call_once(flag, [this]() {
    detail::AtFork::registerHandler(
        this,
        /*prepare*/ []() { return true; },
        /*parent*/ []() {},
        /*child*/
        []() {
          // Ensure child and parent do not share same entropy pool.
          BufferedRandomDevice::notifyNewGlobalEpoch();
        });
  });
}

void BufferedRandomDevice::getSlow(unsigned char* data, size_t size) {
  auto const globalEpoch = globalEpoch_.load(std::memory_order_relaxed);
  if (globalEpoch != epoch_) {
    epoch_ = globalEpoch_;
    ptr_ = buffer_.get() + bufferSize_;
  }

  DCHECK_GT(size, remaining());
  if (size >= bufferSize_) {
    // Just read directly.
    readRandomDevice(data, size);
    return;
  }

  size_t copied = remaining();
  memcpy(data, ptr_, copied);
  data += copied;
  size -= copied;

  // refill
  readRandomDevice(buffer_.get(), bufferSize_);
  ptr_ = buffer_.get();

  memcpy(data, ptr_, size);
  ptr_ += size;
}

} // namespace

void Random::secureRandom(void* data, size_t size) {
  using Single = SingletonThreadLocal<BufferedRandomDevice, RandomTag>;
  Single::get().get(data, size);
}

ThreadLocalPRNG::result_type ThreadLocalPRNG::operator()() {
  struct Wrapper {
    Random::DefaultGenerator object{Random::create()};
  };
  using Single = SingletonThreadLocal<Wrapper, RandomTag>;
  return Single::get().object();
}
} // namespace folly
