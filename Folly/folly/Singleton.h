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
// SingletonVault - a library to manage the creation and destruction
// of interdependent singletons.
//
// Recommended usage of this class: suppose you have a class
// called MyExpensiveService, and you only want to construct one (ie,
// it's a singleton), but you only want to construct it if it is used.
//
// In your .h file:
// class MyExpensiveService {
//   // Caution - may return a null ptr during startup and shutdown.
//   static std::shared_ptr<MyExpensiveService> getInstance();
//   ....
// };
//
// In your .cpp file:
// namespace { struct PrivateTag {}; }
// static folly::Singleton<MyExpensiveService, PrivateTag> the_singleton;
// std::shared_ptr<MyExpensiveService> MyExpensiveService::getInstance() {
//   return the_singleton.try_get();
// }
//
// Code in other modules can access it via:
//
// auto instance = MyExpensiveService::getInstance();
//
// Advanced usage and notes:
//
// You can also access a singleton instance with
// `Singleton<ObjectType, TagType>::try_get()`. We recommend
// that you prefer the form `the_singleton.try_get()` because it ensures that
// `the_singleton` is used and cannot be garbage-collected during linking: this
// is necessary because the constructor of `the_singleton` is what registers it
// to the SingletonVault.
//
// The singleton will be created on demand.  If the constructor for
// MyExpensiveService actually makes use of *another* Singleton, then
// the right thing will happen -- that other singleton will complete
// construction before get() returns.  However, in the event of a
// circular dependency, a runtime error will occur.
//
// You can have multiple singletons of the same underlying type, but
// each must be given a unique tag. If no tag is specified a default tag is
// used. We recommend that you use a tag from an anonymous namespace private to
// your implementation file, as this ensures that the singleton is only
// available via your interface and not also through Singleton<T>::try_get()
//
// namespace {
// struct Tag1 {};
// struct Tag2 {};
// folly::Singleton<MyExpensiveService> s_default;
// folly::Singleton<MyExpensiveService, Tag1> s1;
// folly::Singleton<MyExpensiveService, Tag2> s2;
// }
// ...
// MyExpensiveService* svc_default = s_default.get();
// MyExpensiveService* svc1 = s1.get();
// MyExpensiveService* svc2 = s2.get();
//
// By default, the singleton instance is constructed via new and
// deleted via delete, but this is configurable:
//
// namespace { folly::Singleton<MyExpensiveService> the_singleton(create,
//                                                                destroy); }
//
// Where create and destroy are functions, Singleton<T>::CreateFunc
// Singleton<T>::TeardownFunc.
//
// For example, if you need to pass arguments to your class's constructor:
//   class X {
//    public:
//      X(int a1, std::string a2);
//    // ...
//   }
// Make your singleton like this:
//   folly::Singleton<X> singleton_x([]() { return new X(42, "foo"); });
//
// The above examples detail a situation where an expensive singleton is loaded
// on-demand (thus only if needed).  However if there is an expensive singleton
// that will likely be needed, and initialization takes a potentially long time,
// e.g. while initializing, parsing some files, talking to remote services,
// making uses of other singletons, and so on, the initialization of those can
// be scheduled up front, or "eagerly".
//
// In that case the singleton can be declared this way:
//
// namespace {
// auto the_singleton =
//     folly::Singleton<MyExpensiveService>(/* optional create, destroy args */)
//     .shouldEagerInit();
// }
//
// This way the singleton's instance is built at program initialization,
// if the program opted-in to that feature by calling "doEagerInit" or
// "doEagerInitVia" during its startup.
//
// What if you need to destroy all of your singletons?  Say, some of
// your singletons manage threads, but you need to fork?  Or your unit
// test wants to clean up all global state?  Then you can call
// SingletonVault::singleton()->destroyInstances(), which invokes the
// TeardownFunc for each singleton, in the reverse order they were
// created.  It is your responsibility to ensure your singletons can
// handle cases where the singletons they depend on go away, however.
// Singletons won't be recreated after destroyInstances call. If you
// want to re-enable singleton creation (say after fork was called) you
// should call reenableInstances.

#pragma once

#include <folly/Exception.h>
#include <folly/Executor.h>
#include <folly/Memory.h>
#include <folly/Synchronized.h>
#include <folly/detail/Singleton.h>
#include <folly/detail/StaticSingletonManager.h>
#include <folly/experimental/ReadMostlySharedPtr.h>
#include <folly/hash/Hash.h>
#include <folly/lang/Exception.h>
#include <folly/synchronization/Baton.h>
#include <folly/synchronization/RWSpinLock.h>

#include <algorithm>
#include <atomic>
#include <condition_variable>
#include <functional>
#include <list>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <typeindex>
#include <typeinfo>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include <glog/logging.h>

// use this guard to handleSingleton breaking change in 3rd party code
#ifndef FOLLY_SINGLETON_TRY_GET
#define FOLLY_SINGLETON_TRY_GET
#endif

namespace folly {

// For actual usage, please see the Singleton<T> class at the bottom
// of this file; that is what you will actually interact with.

// SingletonVault is the class that manages singleton instances.  It
// is unaware of the underlying types of singletons, and simply
// manages lifecycles and invokes CreateFunc and TeardownFunc when
// appropriate.  In general, you won't need to interact with the
// SingletonVault itself.
//
// A vault goes through a few stages of life:
//
//   1. Registration phase; singletons can be registered:
//      a) Strict: no singleton can be created in this stage.
//      b) Relaxed: singleton can be created (the default vault is Relaxed).
//   2. registrationComplete() has been called; singletons can no
//      longer be registered, but they can be created.
//   3. A vault can return to stage 1 when destroyInstances is called.
//
// In general, you don't need to worry about any of the above; just
// ensure registrationComplete() is called near the top of your main()
// function, otherwise no singletons can be instantiated.

class SingletonVault;

namespace detail {

// A TypeDescriptor is the unique handle for a given singleton.  It is
// a combinaiton of the type and of the optional name, and is used as
// a key in unordered_maps.
class TypeDescriptor {
 public:
  TypeDescriptor(const std::type_info& ti, const std::type_info& tag_ti)
      : ti_(ti), tag_ti_(tag_ti) {}

  TypeDescriptor(const TypeDescriptor& other)
      : ti_(other.ti_), tag_ti_(other.tag_ti_) {}

  TypeDescriptor& operator=(const TypeDescriptor& other) {
    if (this != &other) {
      ti_ = other.ti_;
      tag_ti_ = other.tag_ti_;
    }

    return *this;
  }

  std::string name() const;

  friend class TypeDescriptorHasher;

  bool operator==(const TypeDescriptor& other) const {
    return ti_ == other.ti_ && tag_ti_ == other.tag_ti_;
  }

 private:
  std::type_index ti_;
  std::type_index tag_ti_;
};

class TypeDescriptorHasher {
 public:
  size_t operator()(const TypeDescriptor& ti) const {
    return folly::hash::hash_combine(ti.ti_, ti.tag_ti_);
  }
};

[[noreturn]] void singletonWarnLeakyDoubleRegistrationAndAbort(
    const TypeDescriptor& type);

[[noreturn]] void singletonWarnLeakyInstantiatingNotRegisteredAndAbort(
    const TypeDescriptor& type);

[[noreturn]] void singletonWarnRegisterMockEarlyAndAbort(
    const TypeDescriptor& type);

void singletonWarnDestroyInstanceLeak(
    const TypeDescriptor& type,
    const void* ptr);

[[noreturn]] void singletonWarnCreateCircularDependencyAndAbort(
    const TypeDescriptor& type);

[[noreturn]] void singletonWarnCreateUnregisteredAndAbort(
    const TypeDescriptor& type);

[[noreturn]] void singletonWarnCreateBeforeRegistrationCompleteAndAbort(
    const TypeDescriptor& type);

void singletonPrintDestructionStackTrace(const TypeDescriptor& type);

[[noreturn]] void singletonThrowNullCreator(const std::type_info& type);

[[noreturn]] void singletonThrowGetInvokedAfterDestruction(
    const TypeDescriptor& type);

struct SingletonVaultState {
  // The two stages of life for a vault, as mentioned in the class comment.
  enum class Type {
    Running,
    Quiescing,
  };

  Type state{Type::Running};
  bool registrationComplete{false};

  // Each singleton in the vault can be in two states: dead
  // (registered but never created), living (CreateFunc returned an instance).

  void check(
      Type expected,
      const char* msg = "Unexpected singleton state change") const {
    if (expected != state) {
      throw_exception<std::logic_error>(msg);
    }
  }
};

// This interface is used by SingletonVault to interact with SingletonHolders.
// Having a non-template interface allows SingletonVault to keep a list of all
// SingletonHolders.
class SingletonHolderBase {
 public:
  explicit SingletonHolderBase(TypeDescriptor typeDesc) : type_(typeDesc) {}
  virtual ~SingletonHolderBase() = default;

  TypeDescriptor type() const {
    return type_;
  }
  virtual bool hasLiveInstance() = 0;
  virtual void createInstance() = 0;
  virtual bool creationStarted() = 0;
  virtual void preDestroyInstance(ReadMostlyMainPtrDeleter<>&) = 0;
  virtual void destroyInstance() = 0;

 private:
  TypeDescriptor type_;
};

// An actual instance of a singleton, tracking the instance itself,
// its state as described above, and the create and teardown
// functions.
template <typename T>
struct SingletonHolder : public SingletonHolderBase {
 public:
  typedef std::function<void(T*)> TeardownFunc;
  typedef std::function<T*(void)> CreateFunc;

  template <typename Tag, typename VaultTag>
  inline static SingletonHolder<T>& singleton();

  inline T* get();
  inline std::weak_ptr<T> get_weak();
  inline std::shared_ptr<T> try_get();
  inline folly::ReadMostlySharedPtr<T> try_get_fast();
  inline void vivify();

  void registerSingleton(CreateFunc c, TeardownFunc t);
  void registerSingletonMock(CreateFunc c, TeardownFunc t);
  bool hasLiveInstance() override;
  void createInstance() override;
  bool creationStarted() override;
  void preDestroyInstance(ReadMostlyMainPtrDeleter<>&) override;
  void destroyInstance() override;

 private:
  SingletonHolder(TypeDescriptor type, SingletonVault& vault);

  enum class SingletonHolderState {
    NotRegistered,
    Dead,
    Living,
  };

  SingletonVault& vault_;

  // mutex protects the entire entry during construction/destruction
  std::mutex mutex_;

  // State of the singleton entry. If state is Living, instance_ptr and
  // instance_weak can be safely accessed w/o synchronization.
  std::atomic<SingletonHolderState> state_{SingletonHolderState::NotRegistered};

  // the thread creating the singleton (only valid while creating an object)
  std::atomic<std::thread::id> creating_thread_{};

  // The singleton itself and related functions.

  // holds a ReadMostlyMainPtr to singleton instance, set when state is changed
  // from Dead to Living. Reset when state is changed from Living to Dead.
  folly::ReadMostlyMainPtr<T> instance_;
  // used to release all ReadMostlyMainPtrs at once
  folly::ReadMostlySharedPtr<T> instance_copy_;
  // weak_ptr to the singleton instance, set when state is changed from Dead
  // to Living. We never write to this object after initialization, so it is
  // safe to read it from different threads w/o synchronization if we know
  // that state is set to Living
  std::weak_ptr<T> instance_weak_;
  // Fast equivalent of instance_weak_
  folly::ReadMostlyWeakPtr<T> instance_weak_fast_;
  // Time we wait on destroy_baton after releasing Singleton shared_ptr.
  std::shared_ptr<folly::Baton<>> destroy_baton_;
  T* instance_ptr_ = nullptr;
  CreateFunc create_ = nullptr;
  TeardownFunc teardown_ = nullptr;

  std::shared_ptr<std::atomic<bool>> print_destructor_stack_trace_;

  SingletonHolder(const SingletonHolder&) = delete;
  SingletonHolder& operator=(const SingletonHolder&) = delete;
  SingletonHolder& operator=(SingletonHolder&&) = delete;
  SingletonHolder(SingletonHolder&&) = delete;
};

} // namespace detail

class SingletonVault {
 public:
  enum class Type {
    Strict, // Singletons can't be created before registrationComplete()
    Relaxed, // Singletons can be created before registrationComplete()
  };

  /**
   * Clears all singletons in the given vault at ctor and dtor times.
   * Useful for unit-tests that need to clear the world.
   *
   * This need can arise when a unit-test needs to swap out an object used by a
   * singleton for a test-double, but the singleton needing its dependency to be
   * swapped has a type or a tag local to some other translation unit and
   * unavailable in the current translation unit.
   *
   * Other, better approaches to this need are "plz 2 refactor" ....
   */
  struct ScopedExpunger {
    SingletonVault* vault;
    explicit ScopedExpunger(SingletonVault* v) : vault(v) {
      expunge();
    }
    ~ScopedExpunger() {
      expunge();
    }
    void expunge() {
      vault->destroyInstances();
      vault->reenableInstances();
    }
  };

  static Type defaultVaultType();

  explicit SingletonVault(Type type = defaultVaultType()) : type_(type) {}

  // Destructor is only called by unit tests to check destroyInstances.
  ~SingletonVault();

  typedef std::function<void(void*)> TeardownFunc;
  typedef std::function<void*(void)> CreateFunc;

  // Ensure that Singleton has not been registered previously and that
  // registration is not complete. If validations succeeds,
  // register a singleton of a given type with the create and teardown
  // functions.
  void registerSingleton(detail::SingletonHolderBase* entry);

  /**
   * Called by `Singleton<T>.shouldEagerInit()` to ensure the instance
   * is built when `doEagerInit[Via]` is called; see those methods
   * for more info.
   */
  void addEagerInitSingleton(detail::SingletonHolderBase* entry);

  // Mark registration is complete; no more singletons can be
  // registered at this point.
  void registrationComplete();

  /**
   * Initialize all singletons which were marked as eager-initialized
   * (using `shouldEagerInit()`).  No return value.  Propagates exceptions
   * from constructors / create functions, as is the usual case when calling
   * for example `Singleton<Foo>::get_weak()`.
   */
  void doEagerInit();

  /**
   * Schedule eager singletons' initializations through the given executor.
   * If baton ptr is not null, its `post` method is called after all
   * early initialization has completed.
   *
   * If exceptions are thrown during initialization, this method will still
   * `post` the baton to indicate completion.  The exception will not propagate
   * and future attempts to `try_get` or `get_weak` the failed singleton will
   * retry initialization.
   *
   * Sample usage:
   *
   *   folly::IOThreadPoolExecutor executor(max_concurrency_level);
   *   folly::Baton<> done;
   *   doEagerInitVia(executor, &done);
   *   done.wait();  // or 'try_wait_for', etc.
   *
   */
  void doEagerInitVia(Executor& exe, folly::Baton<>* done = nullptr);

  // Destroy all singletons; when complete, the vault can't create
  // singletons once again until reenableInstances() is called.
  void destroyInstances();

  // Enable re-creating singletons after destroyInstances() was called.
  void reenableInstances();

  // For testing; how many registered and living singletons we have.
  size_t registeredSingletonCount() const {
    return singletons_.rlock()->size();
  }

  /**
   * Flips to true if eager initialization was used, and has completed.
   * Never set to true if "doEagerInit()" or "doEagerInitVia" never called.
   */
  bool eagerInitComplete() const;

  size_t livingSingletonCount() const {
    auto singletons = singletons_.rlock();

    size_t ret = 0;
    for (const auto& p : *singletons) {
      if (p.second->hasLiveInstance()) {
        ++ret;
      }
    }

    return ret;
  }

  // A well-known vault; you can actually have others, but this is the
  // default.
  static SingletonVault* singleton() {
    return singleton<>();
  }

  // Gets singleton vault for any Tag. Non-default tag should be used in unit
  // tests only.
  template <typename VaultTag = detail::DefaultTag>
  static SingletonVault* singleton() {
    /* library-local */ static auto vault =
        detail::createGlobal<SingletonVault, VaultTag>();
    return vault;
  }

  typedef std::string (*StackTraceGetterPtr)();

  static std::atomic<StackTraceGetterPtr>& stackTraceGetter() {
    /* library-local */ static auto stackTraceGetterPtr = detail::
        createGlobal<std::atomic<StackTraceGetterPtr>, SingletonVault>();
    return *stackTraceGetterPtr;
  }

  void setType(Type type) {
    type_ = type;
  }

 private:
  template <typename T>
  friend struct detail::SingletonHolder;

  // This method only matters if registrationComplete() is never called.
  // Otherwise destroyInstances is scheduled to be executed atexit.
  //
  // Initializes static object, which calls destroyInstances on destruction.
  // Used to have better deletion ordering with singleton not managed by
  // folly::Singleton. The desruction will happen in the following order:
  // 1. Singletons, not managed by folly::Singleton, which were created after
  //    any of the singletons managed by folly::Singleton was requested.
  // 2. All singletons managed by folly::Singleton
  // 3. Singletons, not managed by folly::Singleton, which were created before
  //    any of the singletons managed by folly::Singleton was requested.
  static void scheduleDestroyInstances();

  typedef std::unordered_map<
      detail::TypeDescriptor,
      detail::SingletonHolderBase*,
      detail::TypeDescriptorHasher>
      SingletonMap;

  // Use SharedMutexSuppressTSAN to suppress noisy lock inversions when building
  // with TSAN. If TSAN is not enabled, SharedMutexSuppressTSAN is equivalent
  // to a normal SharedMutex.
  Synchronized<SingletonMap, SharedMutexSuppressTSAN> singletons_;
  Synchronized<
      std::unordered_set<detail::SingletonHolderBase*>,
      SharedMutexSuppressTSAN>
      eagerInitSingletons_;
  Synchronized<std::vector<detail::TypeDescriptor>, SharedMutexSuppressTSAN>
      creationOrder_;

  // Using SharedMutexReadPriority is important here, because we want to make
  // sure we don't block nested singleton creation happening concurrently with
  // destroyInstances().
  Synchronized<detail::SingletonVaultState, SharedMutexReadPriority> state_;

  Type type_;
};

// This is the wrapper class that most users actually interact with.
// It allows for simple access to registering and instantiating
// singletons.  Create instances of this class in the global scope of
// type Singleton<T> to register your singleton for later access via
// Singleton<T>::try_get().
template <
    typename T,
    typename Tag = detail::DefaultTag,
    typename VaultTag = detail::DefaultTag /* for testing */>
class Singleton {
 public:
  typedef std::function<T*(void)> CreateFunc;
  typedef std::function<void(T*)> TeardownFunc;

  // Generally your program life cycle should be fine with calling
  // get() repeatedly rather than saving the reference, and then not
  // call get() during process shutdown.
  [[deprecated("Replaced by try_get")]] static T* get() {
    return getEntry().get();
  }

  // If, however, you do need to hold a reference to the specific
  // singleton, you can try to do so with a weak_ptr.  Avoid this when
  // possible but the inability to lock the weak pointer can be a
  // signal that the vault has been destroyed.
  [[deprecated("Replaced by try_get")]] static std::weak_ptr<T> get_weak() {
    return getEntry().get_weak();
  }

  // Preferred alternative to get_weak, it returns shared_ptr that can be
  // stored; a singleton won't be destroyed unless shared_ptr is destroyed.
  // Avoid holding these shared_ptrs beyond the scope of a function;
  // don't put them in member variables, always use try_get() instead
  //
  // try_get() can return nullptr if the singleton was destroyed, caller is
  // responsible for handling nullptr return
  static std::shared_ptr<T> try_get() {
    return getEntry().try_get();
  }

  static folly::ReadMostlySharedPtr<T> try_get_fast() {
    return getEntry().try_get_fast();
  }

  // Quickly ensure the instance exists.
  static void vivify() {
    getEntry().vivify();
  }

  explicit Singleton(
      std::nullptr_t /* _ */ = nullptr,
      typename Singleton::TeardownFunc t = nullptr)
      : Singleton([]() { return new T; }, std::move(t)) {}

  explicit Singleton(
      typename Singleton::CreateFunc c,
      typename Singleton::TeardownFunc t = nullptr) {
    if (c == nullptr) {
      detail::singletonThrowNullCreator(typeid(T));
    }

    auto vault = SingletonVault::singleton<VaultTag>();
    getEntry().registerSingleton(std::move(c), getTeardownFunc(std::move(t)));
    vault->registerSingleton(&getEntry());
  }

  /**
   * Should be instantiated as soon as "doEagerInit[Via]" is called.
   * Singletons are usually lazy-loaded (built on-demand) but for those which
   * are known to be needed, to avoid the potential lag for objects that take
   * long to construct during runtime, there is an option to make sure these
   * are built up-front.
   *
   * Use like:
   *   Singleton<Foo> gFooInstance = Singleton<Foo>(...).shouldEagerInit();
   *
   * Or alternately, define the singleton as usual, and say
   *   gFooInstance.shouldEagerInit();
   *
   * at some point prior to calling registrationComplete().
   * Then doEagerInit() or doEagerInitVia(Executor*) can be called.
   */
  Singleton& shouldEagerInit() {
    auto vault = SingletonVault::singleton<VaultTag>();
    vault->addEagerInitSingleton(&getEntry());
    return *this;
  }

  /**
   * Construct and inject a mock singleton which should be used only from tests.
   * Unlike regular singletons which are initialized once per process lifetime,
   * mock singletons live for the duration of a test. This means that one
   * process running multiple tests can initialize and register the same
   * singleton multiple times. This functionality should be used only from tests
   * since it relaxes validation and performance in order to be able to perform
   * the injection. The returned mock singleton is functionality identical to
   * regular singletons.
   */
  static void make_mock(
      std::nullptr_t /* c */ = nullptr,
      typename Singleton<T>::TeardownFunc t = nullptr) {
    make_mock([]() { return new T; }, t);
  }

  static void make_mock(
      CreateFunc c,
      typename Singleton<T>::TeardownFunc t = nullptr) {
    if (c == nullptr) {
      detail::singletonThrowNullCreator(typeid(T));
    }

    auto& entry = getEntry();

    entry.registerSingletonMock(c, getTeardownFunc(t));
  }

 private:
  inline static detail::SingletonHolder<T>& getEntry() {
    return detail::SingletonHolder<T>::template singleton<Tag, VaultTag>();
  }

  // Construct TeardownFunc.
  static typename detail::SingletonHolder<T>::TeardownFunc getTeardownFunc(
      TeardownFunc t) {
    if (t == nullptr) {
      return [](T* v) { delete v; };
    } else {
      return t;
    }
  }
};

template <typename T, typename Tag = detail::DefaultTag>
class LeakySingleton {
 public:
  using CreateFunc = std::function<T*()>;

  LeakySingleton() : LeakySingleton([] { return new T(); }) {}

  explicit LeakySingleton(CreateFunc createFunc) {
    auto& entry = entryInstance();
    if (entry.state != State::NotRegistered) {
      detail::singletonWarnLeakyDoubleRegistrationAndAbort(entry.type_);
    }
    entry.createFunc = createFunc;
    entry.state = State::Dead;
  }

  static T& get() {
    return instance();
  }

  static void make_mock(std::nullptr_t /* c */ = nullptr) {
    make_mock([]() { return new T; });
  }

  static void make_mock(CreateFunc createFunc) {
    if (createFunc == nullptr) {
      detail::singletonThrowNullCreator(typeid(T));
    }

    auto& entry = entryInstance();
    if (entry.ptr) {
      // Make sure existing pointer doesn't get reported as a leak by LSAN.
      entry.leakedPtrs.push_back(std::exchange(entry.ptr, nullptr));
    }
    entry.createFunc = createFunc;
    entry.state = State::Dead;
  }

 private:
  enum class State { NotRegistered, Dead, Living };

  struct Entry {
    Entry() {}
    Entry(const Entry&) = delete;
    Entry& operator=(const Entry&) = delete;

    std::atomic<State> state{State::NotRegistered};
    T* ptr{nullptr};
    CreateFunc createFunc;
    std::mutex mutex;
    detail::TypeDescriptor type_{typeid(T), typeid(Tag)};
    std::list<T*> leakedPtrs;
  };

  static Entry& entryInstance() {
    /* library-local */ static auto entry = detail::createGlobal<Entry, Tag>();
    return *entry;
  }

  static T& instance() {
    auto& entry = entryInstance();
    if (UNLIKELY(entry.state != State::Living)) {
      createInstance();
    }

    return *entry.ptr;
  }

  static void createInstance() {
    auto& entry = entryInstance();

    std::lock_guard<std::mutex> lg(entry.mutex);
    if (entry.state == State::Living) {
      return;
    }

    if (entry.state == State::NotRegistered) {
      detail::singletonWarnLeakyInstantiatingNotRegisteredAndAbort(entry.type_);
    }

    entry.ptr = entry.createFunc();
    entry.state = State::Living;
  }
};
} // namespace folly

#include <folly/Singleton-inl.h>
