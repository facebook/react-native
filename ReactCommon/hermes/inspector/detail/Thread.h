// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>

#ifndef __ANDROID__
#include <pthread.h>
#include <thread>
#endif

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

#ifdef __ANDROID__

/// Android version of Thread that uses JThread, which is a java.lang.Thread.
/// This is desirable because real Java threads have access to the app's
/// classloader, which allows us to call in to Java from C++.
///
/// The implementation is private to the .cpp file to avoid leaking
/// the fbjni dependencies into code which creates Threads.

class Thread {
 public:
  Thread(std::string name, std::function<void()> runnable);
  ~Thread();

  void detach() {
    // Java threads don't need to be explicitly detached
  }

  void join();

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

#else

class Thread {
 public:
  Thread(std::string name, std::function<void()> runnable)
      : thread_(run, name, runnable) {}

  void detach() {
    thread_.detach();
  }

  void join() {
    thread_.join();
  }

 private:
  static void run(std::string name, std::function<void()> runnable) {
#if defined(_GNU_SOURCE)
    pthread_setname_np(pthread_self(), name.c_str());
#elif defined(__APPLE__)
    pthread_setname_np(name.c_str());
#endif

    runnable();
  }

  std::thread thread_;
};

#endif

}; // namespace detail

} // namespace inspector
} // namespace hermes
} // namespace facebook
