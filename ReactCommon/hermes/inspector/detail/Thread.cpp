// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef __ANDROID__
#include "Thread.h"

#include <fb/fbjni/JThread.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

struct Thread::Impl {
  facebook::jni::global_ref<facebook::jni::JThread> thread_;
};

Thread::Thread(std::string, std::function<void()> runnable)
    : impl_(std::make_unique<Impl>(Impl{facebook::jni::make_global(
          facebook::jni::JThread::create(std::move(runnable)))})) {
  impl_->thread_->start();
}

Thread::~Thread() {}

void Thread::join() {
  impl_->thread_->join();
}

} // namespace detail
} // namespace inspector
} // namespace hermes
} // namespace facebook

#endif
