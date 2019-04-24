/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/Singleton.h>
#include <folly/portability/Config.h>

#ifndef _WIN32
#include <dlfcn.h>
#endif

#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <string>

#include <folly/Demangle.h>
#include <folly/Format.h>
#include <folly/ScopeGuard.h>

#if FOLLY_USE_SYMBOLIZER
#include <folly/experimental/symbolizer/Symbolizer.h> // @manual
#endif

#if !defined(_WIN32) && !defined(__APPLE__) && !defined(__ANDROID__)
#define FOLLY_SINGLETON_HAVE_DLSYM 1
#endif

namespace folly {

#if FOLLY_SINGLETON_HAVE_DLSYM
namespace detail {
static void singleton_hs_init_weak(int* argc, char** argv[])
    __attribute__((__weakref__("hs_init")));
} // namespace detail
#endif

SingletonVault::Type SingletonVault::defaultVaultType() {
#if FOLLY_SINGLETON_HAVE_DLSYM
  bool isPython = dlsym(RTLD_DEFAULT, "Py_Main");
  bool isHaskel =
      detail::singleton_hs_init_weak || dlsym(RTLD_DEFAULT, "hs_init");
  bool isJVM = dlsym(RTLD_DEFAULT, "JNI_GetCreatedJavaVMs");
  bool isD = dlsym(RTLD_DEFAULT, "_d_run_main");

  return isPython || isHaskel || isJVM || isD ? Type::Relaxed : Type::Strict;
#else
  return Type::Relaxed;
#endif
}

namespace detail {

std::string TypeDescriptor::name() const {
  auto ret = demangle(ti_.name());
  if (tag_ti_ != std::type_index(typeid(DefaultTag))) {
    ret += "/";
    ret += demangle(tag_ti_.name());
  }
  return ret.toStdString();
}

// clang-format off
[[noreturn]] void singletonWarnDoubleRegistrationAndAbort(
    const TypeDescriptor& type) {
  // Ensure the availability of std::cerr
  std::ios_base::Init ioInit;
  std::cerr << "Double registration of singletons of the same "
               "underlying type; check for multiple definitions "
               "of type folly::Singleton<"
            << type.name() << ">\n";
  std::abort();
}

[[noreturn]] void singletonWarnLeakyDoubleRegistrationAndAbort(
    const TypeDescriptor& type) {
  // Ensure the availability of std::cerr
  std::ios_base::Init ioInit;
  std::cerr << "Double registration of singletons of the same "
               "underlying type; check for multiple definitions "
               "of type folly::LeakySingleton<"
            << type.name() << ">\n";
  std::abort();
}

[[noreturn]] void singletonWarnLeakyInstantiatingNotRegisteredAndAbort(
    const TypeDescriptor& type) {
  auto ptr = SingletonVault::stackTraceGetter().load();
  LOG(FATAL) << "Creating instance for unregistered singleton: " << type.name()
             << "\n"
             << "Stacktrace:"
             << "\n"
             << (ptr ? (*ptr)() : "(not available)");
}

[[noreturn]] void singletonWarnRegisterMockEarlyAndAbort(
    const TypeDescriptor& type) {
  LOG(FATAL) << "Registering mock before singleton was registered: "
             << type.name();
}

void singletonWarnDestroyInstanceLeak(
    const TypeDescriptor& type,
    const void* ptr) {
  LOG(ERROR) << "Singleton of type " << type.name() << " has a "
             << "living reference at destroyInstances time; beware! Raw "
             << "pointer is " << ptr << ". It is very likely "
             << "that some other singleton is holding a shared_ptr to it. "
             << "This singleton will be leaked (even if a shared_ptr to it "
             << "is eventually released)."
             << "Make sure dependencies between these singletons are "
             << "properly defined.";
}

[[noreturn]] void singletonWarnCreateCircularDependencyAndAbort(
    const TypeDescriptor& type) {
  LOG(FATAL) << "circular singleton dependency: " << type.name();
}

[[noreturn]] void singletonWarnCreateUnregisteredAndAbort(
    const TypeDescriptor& type) {
  auto ptr = SingletonVault::stackTraceGetter().load();
  LOG(FATAL) << "Creating instance for unregistered singleton: " << type.name()
             << "\n"
             << "Stacktrace:"
             << "\n"
             << (ptr ? (*ptr)() : "(not available)");
}

[[noreturn]] void singletonWarnCreateBeforeRegistrationCompleteAndAbort(
    const TypeDescriptor& type) {
  auto stack_trace_getter = SingletonVault::stackTraceGetter().load();
  auto stack_trace = stack_trace_getter ? stack_trace_getter() : "";
  if (!stack_trace.empty()) {
    stack_trace = "Stack trace:\n" + stack_trace;
  }

  LOG(FATAL) << "Singleton " << type.name() << " requested before "
             << "registrationComplete() call.\n"
             << "This usually means that either main() never called "
             << "folly::init, or singleton was requested before main() "
             << "(which is not allowed).\n"
             << stack_trace;
}

void singletonPrintDestructionStackTrace(const TypeDescriptor& type) {
  std::string output = "Singleton " + type.name() + " was released.\n";

  auto stack_trace_getter = SingletonVault::stackTraceGetter().load();
  auto stack_trace = stack_trace_getter ? stack_trace_getter() : "";
  if (stack_trace.empty()) {
    output += "Failed to get release stack trace.";
  } else {
    output += "Release stack trace:\n";
    output += stack_trace;
  }

  LOG(ERROR) << output;
}

[[noreturn]] void singletonThrowNullCreator(const std::type_info& type) {
  auto const msg = sformat(
      "nullptr_t should be passed if you want {} to be default constructed",
      demangle(type));
  throw std::logic_error(msg);
}

[[noreturn]] void singletonThrowGetInvokedAfterDestruction(
    const TypeDescriptor& type) {
  throw std::runtime_error(
      "Raw pointer to a singleton requested after its destruction."
      " Singleton type is: " +
      type.name());
}
// clang-format on

} // namespace detail

namespace {

struct FatalHelper {
  ~FatalHelper() {
    if (!leakedSingletons_.empty()) {
      std::string leakedTypes;
      for (const auto& singleton : leakedSingletons_) {
        leakedTypes += "\t" + singleton.name() + "\n";
      }
      LOG(DFATAL) << "Singletons of the following types had living references "
                  << "after destroyInstances was finished:\n"
                  << leakedTypes
                  << "beware! It is very likely that those singleton instances "
                  << "are leaked.";
    }
  }

  std::vector<detail::TypeDescriptor> leakedSingletons_;
};

#if defined(__APPLE__) || defined(_MSC_VER)
// OS X doesn't support constructor priorities.
FatalHelper fatalHelper;
#else
FatalHelper __attribute__((__init_priority__(101))) fatalHelper;
#endif

} // namespace

SingletonVault::~SingletonVault() {
  destroyInstances();
}

void SingletonVault::registerSingleton(detail::SingletonHolderBase* entry) {
  auto state = state_.rlock();
  state->check(detail::SingletonVaultState::Type::Running);

  if (UNLIKELY(state->registrationComplete)) {
    LOG(ERROR) << "Registering singleton after registrationComplete().";
  }

  auto singletons = singletons_.wlock();
  CHECK_THROW(
      singletons->emplace(entry->type(), entry).second, std::logic_error);
}

void SingletonVault::addEagerInitSingleton(detail::SingletonHolderBase* entry) {
  auto state = state_.rlock();
  state->check(detail::SingletonVaultState::Type::Running);

  if (UNLIKELY(state->registrationComplete)) {
    LOG(ERROR) << "Registering for eager-load after registrationComplete().";
  }

  CHECK_THROW(singletons_.rlock()->count(entry->type()), std::logic_error);

  auto eagerInitSingletons = eagerInitSingletons_.wlock();
  eagerInitSingletons->insert(entry);
}

void SingletonVault::registrationComplete() {
  std::atexit([]() { SingletonVault::singleton()->destroyInstances(); });

  auto state = state_.wlock();
  state->check(detail::SingletonVaultState::Type::Running);

  if (state->registrationComplete) {
    return;
  }

  auto singletons = singletons_.rlock();
  if (type_ == Type::Strict) {
    for (const auto& p : *singletons) {
      if (p.second->hasLiveInstance()) {
        throw std::runtime_error(
            "Singleton " + p.first.name() +
            " created before registration was complete.");
      }
    }
  }

  state->registrationComplete = true;
}

void SingletonVault::doEagerInit() {
  {
    auto state = state_.rlock();
    state->check(detail::SingletonVaultState::Type::Running);
    if (UNLIKELY(!state->registrationComplete)) {
      throw std::logic_error("registrationComplete() not yet called");
    }
  }

  auto eagerInitSingletons = eagerInitSingletons_.rlock();
  for (auto* single : *eagerInitSingletons) {
    single->createInstance();
  }
}

void SingletonVault::doEagerInitVia(Executor& exe, folly::Baton<>* done) {
  {
    auto state = state_.rlock();
    state->check(detail::SingletonVaultState::Type::Running);
    if (UNLIKELY(!state->registrationComplete)) {
      throw std::logic_error("registrationComplete() not yet called");
    }
  }

  auto eagerInitSingletons = eagerInitSingletons_.rlock();
  auto countdown =
      std::make_shared<std::atomic<size_t>>(eagerInitSingletons->size());
  for (auto* single : *eagerInitSingletons) {
    // countdown is retained by shared_ptr, and will be alive until last lambda
    // is done.  notifyBaton is provided by the caller, and expected to remain
    // present (if it's non-nullptr).  singletonSet can go out of scope but
    // its values, which are SingletonHolderBase pointers, are alive as long as
    // SingletonVault is not being destroyed.
    exe.add([=] {
      // decrement counter and notify if requested, whether initialization
      // was successful, was skipped (already initialized), or exception thrown.
      SCOPE_EXIT {
        if (--(*countdown) == 0) {
          if (done != nullptr) {
            done->post();
          }
        }
      };
      // if initialization is in progress in another thread, don't try to init
      // here.  Otherwise the current thread will block on 'createInstance'.
      if (!single->creationStarted()) {
        single->createInstance();
      }
    });
  }
}

void SingletonVault::destroyInstances() {
  auto stateW = state_.wlock();
  if (stateW->state == detail::SingletonVaultState::Type::Quiescing) {
    return;
  }
  stateW->state = detail::SingletonVaultState::Type::Quiescing;

  auto stateR = stateW.moveFromWriteToRead();
  {
    auto singletons = singletons_.rlock();
    auto creationOrder = creationOrder_.rlock();

    CHECK_GE(singletons->size(), creationOrder->size());

    // Release all ReadMostlyMainPtrs at once
    {
      ReadMostlyMainPtrDeleter<> deleter;
      for (auto& singleton_type : *creationOrder) {
        singletons->at(singleton_type)->preDestroyInstance(deleter);
      }
    }

    for (auto type_iter = creationOrder->rbegin();
         type_iter != creationOrder->rend();
         ++type_iter) {
      singletons->at(*type_iter)->destroyInstance();
    }

    for (auto& singleton_type : *creationOrder) {
      auto instance = singletons->at(singleton_type);
      if (!instance->hasLiveInstance()) {
        continue;
      }

      fatalHelper.leakedSingletons_.push_back(instance->type());
    }
  }

  {
    auto creationOrder = creationOrder_.wlock();
    creationOrder->clear();
  }
}

void SingletonVault::reenableInstances() {
  auto state = state_.wlock();

  state->check(detail::SingletonVaultState::Type::Quiescing);

  state->state = detail::SingletonVaultState::Type::Running;
}

void SingletonVault::scheduleDestroyInstances() {
  // Add a dependency on folly::ThreadLocal to make sure all its static
  // singletons are initalized first.
  threadlocal_detail::StaticMeta<void, void>::instance();
  std::atexit([] { SingletonVault::singleton()->destroyInstances(); });
}

// If we're using folly's Symbolizer, create a static initializer to setup
// Singltone's to use it to print stack traces. It's important that we keep
// this in the same compilation unit as the `SingletonVault` so that it's
// setup/used iff singleton's are used.
#if FOLLY_USE_SYMBOLIZER
namespace {

std::string stackTraceGetter() {
  // Get and symbolize stack trace
  constexpr size_t kMaxStackTraceDepth = 100;
  symbolizer::FrameArray<kMaxStackTraceDepth> addresses;

  if (!getStackTraceSafe(addresses)) {
    return "";
  } else {
    constexpr size_t kDefaultCapacity = 500;
    symbolizer::ElfCache elfCache(kDefaultCapacity);

    symbolizer::Symbolizer symbolizer(&elfCache);
    symbolizer.symbolize(addresses);

    symbolizer::StringSymbolizePrinter printer;
    printer.println(addresses);
    return printer.str();
  }
}

struct SetStackTraceGetter {
  SetStackTraceGetter() {
    SingletonVault::stackTraceGetter().store(stackTraceGetter);
  }
};

#ifdef __APPLE__
// OS X doesn't support constructor priorities.
SetStackTraceGetter setStackTraceGetter;
#else
SetStackTraceGetter __attribute__((__init_priority__(101))) setStackTraceGetter;
#endif
} // namespace
#endif

} // namespace folly
