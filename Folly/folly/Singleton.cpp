/*
 * Copyright 2017 Facebook, Inc.
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

#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <iostream>
#include <string>

#include <folly/ScopeGuard.h>

namespace folly {

namespace detail {

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
}

namespace {

struct FatalHelper {
  ~FatalHelper() {
    if (!leakedSingletons_.empty()) {
      std::string leakedTypes;
      for (const auto& singleton : leakedSingletons_) {
        leakedTypes += "\t" + singleton.name() + "\n";
      }
      LOG(DFATAL) << "Singletons of the following types had living references "
                  << "after destroyInstances was finished:\n" << leakedTypes
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
FatalHelper __attribute__ ((__init_priority__ (101))) fatalHelper;
#endif

}

SingletonVault::~SingletonVault() { destroyInstances(); }

void SingletonVault::registerSingleton(detail::SingletonHolderBase* entry) {
  auto state = state_.rlock();
  stateCheck(SingletonVaultState::Running, *state);

  if (UNLIKELY(state->registrationComplete)) {
    LOG(ERROR) << "Registering singleton after registrationComplete().";
  }

  auto singletons = singletons_.wlock();
  CHECK_THROW(
      singletons->emplace(entry->type(), entry).second, std::logic_error);
}

void SingletonVault::addEagerInitSingleton(detail::SingletonHolderBase* entry) {
  auto state = state_.rlock();
  stateCheck(SingletonVaultState::Running, *state);

  if (UNLIKELY(state->registrationComplete)) {
    LOG(ERROR) << "Registering for eager-load after registrationComplete().";
  }

  CHECK_THROW(singletons_.rlock()->count(entry->type()), std::logic_error);

  auto eagerInitSingletons = eagerInitSingletons_.wlock();
  eagerInitSingletons->insert(entry);
}

void SingletonVault::registrationComplete() {
  std::atexit([](){ SingletonVault::singleton()->destroyInstances(); });

  auto state = state_.wlock();
  stateCheck(SingletonVaultState::Running, *state);

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
    stateCheck(SingletonVaultState::Running, *state);
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
    stateCheck(SingletonVaultState::Running, *state);
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
  if (stateW->state == SingletonVaultState::Quiescing) {
    return;
  }
  stateW->state = SingletonVaultState::Quiescing;

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
      auto singleton = singletons->at(singleton_type);
      if (!singleton->hasLiveInstance()) {
        continue;
      }

      fatalHelper.leakedSingletons_.push_back(singleton->type());
    }
  }

  {
    auto creationOrder = creationOrder_.wlock();
    creationOrder->clear();
  }
}

void SingletonVault::reenableInstances() {
  auto state = state_.wlock();

  stateCheck(SingletonVaultState::Quiescing, *state);

  state->state = SingletonVaultState::Running;
}

void SingletonVault::scheduleDestroyInstances() {
  // Add a dependency on folly::ThreadLocal to make sure all its static
  // singletons are initalized first.
  threadlocal_detail::StaticMeta<void, void>::instance();

  class SingletonVaultDestructor {
   public:
    ~SingletonVaultDestructor() {
      SingletonVault::singleton()->destroyInstances();
    }
  };

  // Here we intialize a singleton, which calls destroyInstances in its
  // destructor. Because of singleton destruction order - it will be destroyed
  // before all the singletons, which were initialized before it and after all
  // the singletons initialized after it.
  static SingletonVaultDestructor singletonVaultDestructor;
}

}
