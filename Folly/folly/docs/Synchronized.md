`folly/Synchronized.h`
----------------------

`folly/Synchronized.h` introduces a simple abstraction for mutex-
based concurrency. It replaces convoluted, unwieldy, and just
plain wrong code with simple constructs that are easy to get
right and difficult to get wrong.

### Motivation

Many of our multithreaded C++ programs use shared data structures
associated with locks. This follows the time-honored adage of
mutex-based concurrency control "associate mutexes with data, not code".
Consider the following example:

``` Cpp

    class RequestHandler {
      ...
      RequestQueue requestQueue_;
      SharedMutex requestQueueMutex_;

      std::map<std::string, Endpoint> requestEndpoints_;
      SharedMutex requestEndpointsMutex_;

      HandlerState workState_;
      SharedMutex workStateMutex_;
      ...
    };
```

Whenever the code needs to read or write some of the protected
data, it acquires the mutex for reading or for reading and
writing. For example:

``` Cpp
    void RequestHandler::processRequest(const Request& request) {
      stop_watch<> watch;
      checkRequestValidity(request);
      SharedMutex::WriteHolder lock(requestQueueMutex_);
      requestQueue_.push_back(request);
      stats_->addStatValue("requestEnqueueLatency", watch.elapsed());
      LOG(INFO) << "enqueued request ID " << request.getID();
    }
```

However, the correctness of the technique is entirely predicated on
convention.  Developers manipulating these data members must take care
to explicitly acquire the correct lock for the data they wish to access.
There is no ostensible error for code that:

* manipulates a piece of data without acquiring its lock first
* acquires a different lock instead of the intended one
* acquires a lock in read mode but modifies the guarded data structure
* acquires a lock in read-write mode although it only has `const` access
  to the guarded data

### Introduction to `folly/Synchronized.h`

The same code sample could be rewritten with `Synchronized`
as follows:

``` Cpp
    class RequestHandler {
      ...
      Synchronized<RequestQueue> requestQueue_;
      Synchronized<std::map<std::string, Endpoint>> requestEndpoints_;
      Synchronized<HandlerState> workState_;
      ...
    };

    void RequestHandler::processRequest(const Request& request) {
      stop_watch<> watch;
      checkRequestValidity(request);
      requestQueue_.wlock()->push_back(request);
      stats_->addStatValue("requestEnqueueLatency", watch.elapsed());
      LOG(INFO) << "enqueued request ID " << request.getID();
    }
```

The rewrite does at maximum efficiency what needs to be done:
acquires the lock associated with the `RequestQueue` object, writes to
the queue, and releases the lock immediately thereafter.

On the face of it, that's not much to write home about, and not
an obvious improvement over the previous state of affairs. But
the features at work invisible in the code above are as important
as those that are visible:

* Unlike before, the data and the mutex protecting it are
  inextricably encapsulated together.
* If you tried to use `requestQueue_` without acquiring the lock you
  wouldn't be able to; it is virtually impossible to access the queue
  without acquiring the correct lock.
* The lock is released immediately after the insert operation is
  performed, and is not held for operations that do not need it.

If you need to perform several operations while holding the lock,
`Synchronized` provides several options for doing this.

The `wlock()` method (or `lock()` if you have a non-shared mutex type)
returns a `LockedPtr` object that can be stored in a variable.  The lock
will be held for as long as this object exists, similar to a
`std::unique_lock`.  This object can be used as if it were a pointer to
the underlying locked object:

``` Cpp
    {
      auto lockedQueue = requestQueue_.wlock();
      lockedQueue->push_back(request1);
      lockedQueue->push_back(request2);
    }
```

The `rlock()` function is similar to `wlock()`, but acquires a shared lock
rather than an exclusive lock.

We recommend explicitly opening a new nested scope whenever you store a
`LockedPtr` object, to help visibly delineate the critical section, and
to ensure that the `LockedPtr` is destroyed as soon as it is no longer
needed.

Alternatively, `Synchronized` also provides mechanisms to run a function while
holding the lock.  This makes it possible to use lambdas to define brief
critical sections:

``` Cpp
    void RequestHandler::processRequest(const Request& request) {
      stop_watch<> watch;
      checkRequestValidity(request);
      requestQueue_.withWLock([&](auto& queue) {
        // withWLock() automatically holds the lock for the
        // duration of this lambda function
        queue.push_back(request);
      });
      stats_->addStatValue("requestEnqueueLatency", watch.elapsed());
      LOG(INFO) << "enqueued request ID " << request.getID();
    }
```

One advantage of the `withWLock()` approach is that it forces a new
scope to be used for the critical section, making the critical section
more obvious in the code, and helping to encourage code that releases
the lock as soon as possible.

### Template class `Synchronized<T>`

#### Template Parameters

`Synchronized` is a template with two parameters, the data type and a
mutex type: `Synchronized<T, Mutex>`.

If not specified, the mutex type defaults to `folly::SharedMutex`.  However, any
mutex type supported by `folly::LockTraits` can be used instead.
`folly::LockTraits` can be specialized to support other custom mutex
types that it does not know about out of the box.  See
`folly/LockTraitsBoost.h` for an example of how to support additional mutex
types.

`Synchronized` provides slightly different APIs when instantiated with a
shared mutex type or an upgrade mutex type then with a plain exclusive mutex.
If instantiated with either of the two mutex types above (either through
having a member called lock_shared() or specializing `LockTraits` as in
`folly/LockTraitsBoost.h`) the `Synchronized` object has corresponding
`wlock`, `rlock` or `ulock` methods to acquire different lock types.  When
using a shared or upgrade mutex type, these APIs ensure that callers make an
explicit choice to acquire a shared, exclusive or upgrade lock and that
callers do not unintentionally lock the mutex in the incorrect mode.  The
`rlock()` APIs only provide `const` access to the underlying data type,
ensuring that it cannot be modified when only holding a shared lock.

#### Constructors

The default constructor default-initializes the data and its
associated mutex.


The copy constructor locks the source for reading and copies its
data into the target. (The target is not locked as an object
under construction is only accessed by one thread.)

Finally, `Synchronized<T>` defines an explicit constructor that
takes an object of type `T` and copies it. For example:

``` Cpp
    // Default constructed
    Synchronized<map<string, int>> syncMap1;

    // Copy constructed
    Synchronized<map<string, int>> syncMap2(syncMap1);

    // Initializing from an existing map
    map<string, int> init;
    init["world"] = 42;
    Synchronized<map<string, int>> syncMap3(init);
    EXPECT_EQ(syncMap3->size(), 1);
```

#### Assignment, swap, and copying

The copy assignment operator copies the underlying source data
into a temporary with the source mutex locked, and then move the
temporary into the destination data with the destination mutex
locked. This technique avoids the need to lock both mutexes at
the same time. Mutexes are not copied or moved.

The move assignment operator assumes the source object is a true
rvalue and does lock lock the source mutex. It moves the source
data into the destination data with the destination mutex locked.

`swap` acquires locks on both mutexes in increasing order of
object address, and then swaps the underlying data. This avoids
potential deadlock, which may otherwise happen should one thread
do `a = b` while another thread does `b = a`.

The data copy assignment operator copies the parameter into the
destination data while the destination mutex is locked.

The data move assignment operator moves the parameter into the
destination data while the destination mutex is locked.

To get a copy of the guarded data, there are two methods
available: `void copy(T*)` and `T copy()`. The first copies data
to a provided target and the second returns a copy by value. Both
operations are done under a read lock. Example:

``` Cpp
    Synchronized<vector<string>> syncVec1, syncVec2;
    vector<string> vec;

    // Assign
    syncVec1 = syncVec2;
    // Assign straight from vector
    syncVec1 = vec;

    // Swap
    syncVec1.swap(syncVec2);
    // Swap with vector
    syncVec1.swap(vec);

    // Copy to given target
    syncVec1.copy(&vec);
    // Get a copy by value
    auto copy = syncVec1.copy();
```

#### `lock()`

If the mutex type used with `Synchronized` is a simple exclusive mutex
type (as opposed to a shared mutex), `Synchronized<T>` provides a
`lock()` method that returns a `LockedPtr<T>` to access the data while
holding the lock.

The `LockedPtr` object returned by `lock()` holds the lock for as long
as it exists.  Whenever possible, prefer declaring a separate inner
scope for storing this variable, to make sure the `LockedPtr` is
destroyed as soon as the lock is no longer needed:

``` Cpp
    void fun(Synchronized<vector<string>, std::mutex>& vec) {
      {
        auto locked = vec.lock();
        locked->push_back("hello");
        locked->push_back("world");
      }
      LOG(INFO) << "successfully added greeting";
    }
```

#### `wlock()` and `rlock()`

If the mutex type used with `Synchronized` is a shared mutex type,
`Synchronized<T>` provides a `wlock()` method that acquires an exclusive
lock, and an `rlock()` method that acquires a shared lock.

The `LockedPtr` returned by `rlock()` only provides const access to the
internal data, to ensure that it cannot be modified while only holding a
shared lock.

``` Cpp
    int computeSum(const Synchronized<vector<int>>& vec) {
      int sum = 0;
      auto locked = vec.rlock();
      for (int n : *locked) {
        sum += n;
      }
      return sum;
    }

    void doubleValues(Synchronized<vector<int>>& vec) {
      auto locked = vec.wlock();
      for (int& n : *locked) {
        n *= 2;
      }
    }
```

This example brings us to a cautionary discussion.  The `LockedPtr`
object returned by `lock()`, `wlock()`, or `rlock()` only holds the lock
as long as it exists.  This object makes it difficult to access the data
without holding the lock, but not impossible.  In particular you should
never store a raw pointer or reference to the internal data for longer
than the lifetime of the `LockedPtr` object.

For instance, if we had written the following code in the examples
above, this would have continued accessing the vector after the lock had
been released:

``` Cpp
    // No. NO. NO!
    for (int& n : *vec.wlock()) {
      n *= 2;
    }
```

The `vec.wlock()` return value is destroyed in this case as soon as the
internal range iterators are created.  The range iterators point into
the vector's data, but lock is released immediately, before executing
the loop body.

Needless to say, this is a crime punishable by long debugging nights.

Range-based for loops are slightly subtle about the lifetime of objects
used in the initializer statement.  Most other problematic use cases are
a bit easier to spot than this, since the lifetime of the `LockedPtr` is
more explicitly visible.

#### `withLock()`

As an alternative to the `lock()` API, `Synchronized` also provides a
`withLock()` method that executes a function or lambda expression while
holding the lock.  The function receives a reference to the data as its
only argument.

This has a few benefits compared to `lock()`:

* The lambda expression requires its own nested scope, making critical
  sections more visible in the code.  Callers are recommended to define
  a new scope when using `lock()` if they choose to, but this is not
  required.  `withLock()` ensures that a new scope must always be
  defined.
* Because a new scope is required, `withLock()` also helps encourage
  users to release the lock as soon as possible.  Because the critical
  section scope is easily visible in the code, it is harder to
  accidentally put extraneous code inside the critical section without
  realizing it.
* The separate lambda scope makes it more difficult to store raw
  pointers or references to the protected data and continue using those
  pointers outside the critical section.

For example, `withLock()` makes the range-based for loop mistake from
above much harder to accidentally run into:

``` Cpp
    vec.withLock([](auto& locked) {
      for (int& n : locked) {
        n *= 2;
      }
    });
```

This code does not have the same problem as the counter-example with
`wlock()` above, since the lock is held for the duration of the loop.

When using `Synchronized` with a shared mutex type, it provides separate
`withWLock()` and `withRLock()` methods instead of `withLock()`.

#### `ulock()` and `withULockPtr()`

`Synchronized` also supports upgrading and downgrading mutex lock levels as
long as the mutex type used to instantiate the `Synchronized` type has the
same interface as the mutex types in the C++ standard library, or if
`LockTraits` is specialized for the mutex type and the specialization is
visible. See below for an intro to upgrade mutexes.

An upgrade lock can be acquired as usual either with the `ulock()` method or
the `withULockPtr()` method as so

``` Cpp
    {
      // only const access allowed to the underlying object when an upgrade lock
      // is acquired
      auto ulock = vec.ulock();
      auto newSize = ulock->size();
    }

    auto newSize = vec.withULockPtr([](auto ulock) {
      // only const access allowed to the underlying object when an upgrade lock
      // is acquired
      return ulock->size();
    });
```

An upgrade lock acquired via `ulock()` or `withULockPtr()` can be upgraded or
downgraded by calling any of the following methods on the `LockedPtr` proxy

* `moveFromUpgradeToWrite()`
* `moveFromWriteToUpgrade()`
* `moveFromWriteToRead()`
* `moveFromUpgradeToRead()`

Calling these leaves the `LockedPtr` object on which the method was called in
an invalid `null` state and returns another LockedPtr proxy holding the
specified lock.  The upgrade or downgrade is done atomically - the
`Synchronized` object is never in an unlocked state during the lock state
transition.  For example

``` Cpp
    auto ulock = obj.ulock();
    if (ulock->needsUpdate()) {
      auto wlock = ulock.moveFromUpgradeToWrite();

      // ulock is now null

      wlock->updateObj();
    }
```

This "move" can also occur in the context of a `withULockPtr()`
(`withWLockPtr()` or `withRLockPtr()` work as well!) function as so

``` Cpp
    auto newSize = obj.withULockPtr([](auto ulock) {
      if (ulock->needsUpdate()) {

        // release upgrade lock get write lock atomically
        auto wlock = ulock.moveFromUpgradeToWrite();
        // ulock is now null
        wlock->updateObj();

        // release write lock and acquire read lock atomically
        auto rlock = wlock.moveFromWriteToRead();
        // wlock is now null
        return rlock->newSize();

      } else {

        // release upgrade lock and acquire read lock atomically
        auto rlock = ulock.moveFromUpgradeToRead();
        // ulock is now null
        return rlock->newSize();
      }
    });
```

#### Intro to upgrade mutexes:

An upgrade mutex is a shared mutex with an extra state called `upgrade` and an
atomic state transition from `upgrade` to `unique`. The `upgrade` state is more
powerful than the `shared` state but less powerful than the `unique` state.

An upgrade lock permits only const access to shared state for doing reads. It
does not permit mutable access to shared state for doing writes. Only a unique
lock permits mutable access for doing writes.

An upgrade lock may be held concurrently with any number of shared locks on the
same mutex. An upgrade lock is exclusive with other upgrade locks and unique
locks on the same mutex - only one upgrade lock or unique lock may be held at a
time.

The upgrade mutex solves the problem of doing a read of shared state and then
optionally doing a write to shared state efficiently under contention. Consider
this scenario with a shared mutex:

``` Cpp
    struct MyObect {
      bool isUpdateRequired() const;
      void doUpdate();
    };

    struct MyContainingObject {
      folly::Synchronized<MyObject> sync;

      void mightHappenConcurrently() {
        // first check
        if (!sync.rlock()->isUpdateRequired()) {
          return;
        }
        sync.withWLock([&](auto& state) {
          // second check
          if (!state.isUpdateRequired()) {
            return;
          }
          state.doUpdate();
        });
      }
    };
```

Here, the second `isUpdateRequired` check happens under a unique lock. This
means that the second check cannot be done concurrently with other threads doing
first `isUpdateRequired` checks under the shared lock, even though the second
check, like the first check, is read-only and requires only const access to the
shared state.

This may even introduce unnecessary blocking under contention. Since the default
mutex type, `folly::SharedMutex`, has write priority, the unique lock protecting
the second check may introduce unnecessary blocking to all the other threads
that are attempting to acquire a shared lock to protect the first check. This
problem is called reader starvation.

One solution is to use a shared mutex type with read priority, such as
`folly::SharedMutexReadPriority`. That can introduce less blocking under
contention to the other threads attemping to acquire a shared lock to do the
first check. However, that may backfire and cause threads which are attempting
to acquire a unique lock (for the second check) to stall, waiting for a moment
in time when there are no shared locks held on the mutex, a moment in time that
may never even happen. This problem is called writer starvation.

Starvation is a tricky problem to solve in general. But we can partially side-
step it in our case.

An alternative solution is to use an upgrade lock for the second check. Threads
attempting to acquire an upgrade lock for the second check do not introduce
unnecessary blocking to all other threads that are attempting to acquire a
shared lock for the first check. Only after the second check passes, and the
upgrade lock transitions atomically from an upgrade lock to a unique lock, does
the unique lock introduce *necessary* blocking to the other threads attempting
to acquire a shared lock. With this solution, unlike the solution without the
upgrade lock, the second check may be done concurrently with all other first
checks rather than blocking or being blocked by them.

The example would then look like:

``` Cpp
    struct MyObect {
      bool isUpdateRequired() const;
      void doUpdate();
    };

    struct MyContainingObject {
      folly::Synchronized<MyObject> sync;

      void mightHappenConcurrently() {
        // first check
        if (!sync.rlock()->isUpdateRequired()) {
          return;
        }
        sync.withULockPtr([&](auto ulock) {
          // second check
          if (!ulock->isUpdateRequired()) {
            return;
          }
          auto wlock = ulock.moveFromUpgradeToWrite();
          wlock->doUpdate();
        });
      }
    };
```

Note: Some shared mutex implementations offer an atomic state transition from
`shared` to `unique` and some upgrade mutex implementations offer an atomic
state transition from `shared` to `upgrade`. These atomic state transitions are
dangerous, however, and can deadlock when done concurrently on the same mutex.
For example, if threads A and B both hold shared locks on a mutex and are both
attempting to transition atomically from shared to upgrade locks, the threads
are deadlocked. Likewise if they are both attempting to transition atomically
from shared to unique locks, or one is attempting to transition atomically from
shared to upgrade while the other is attempting to transition atomically from
shared to unique. Therefore, `LockTraits` does not expose either of these
dangerous atomic state transitions even when the underlying mutex type supports
them. Likewise, `Synchronized`'s `LockedPtr` proxies do not expose these
dangerous atomic state transitions either.

#### Timed Locking

When `Synchronized` is used with a mutex type that supports timed lock
acquisition, `lock()`, `wlock()`, and `rlock()` can all take an optional
`std::chrono::duration` argument.  This argument specifies a timeout to
use for acquiring the lock.  If the lock is not acquired before the
timeout expires, a null `LockedPtr` object will be returned.  Callers
must explicitly check the return value before using it:

``` Cpp
    void fun(Synchronized<vector<string>>& vec) {
      {
        auto locked = vec.lock(10ms);
        if (!locked) {
          throw std::runtime_error("failed to acquire lock");
        }
        locked->push_back("hello");
        locked->push_back("world");
      }
      LOG(INFO) << "successfully added greeting";
    }
```

#### `unlock()` and `scopedUnlock()`

`Synchronized` is a good mechanism for enforcing scoped
synchronization, but it has the inherent limitation that it
requires the critical section to be, well, scoped. Sometimes the
code structure requires a fleeting "escape" from the iron fist of
synchronization, while still inside the critical section scope.

One common pattern is releasing the lock early on error code paths,
prior to logging an error message.  The `LockedPtr` class provides an
`unlock()` method that makes this possible:

``` Cpp
    Synchronized<map<int, string>> dic;
    ...
    {
      auto locked = dic.rlock();
      auto iter = locked->find(0);
      if (iter == locked.end()) {
        locked.unlock();  // don't hold the lock while logging
        LOG(ERROR) << "key 0 not found";
        return false;
      }
      processValue(*iter);
    }
    LOG(INFO) << "succeeded";
```

For more complex nested control flow scenarios, `scopedUnlock()` returns
an object that will release the lock for as long as it exists, and will
reacquire the lock when it goes out of scope.

``` Cpp

    Synchronized<map<int, string>> dic;
    ...
    {
      auto locked = dic.wlock();
      auto iter = locked->find(0);
      if (iter == locked->end()) {
        {
          auto unlocker = locked.scopedUnlock();
          LOG(INFO) << "Key 0 not found, inserting it."
        }
        locked->emplace(0, "zero");
      } else {
        *iter = "zero";
      }
    }
```

Clearly `scopedUnlock()` comes with specific caveats and
liabilities. You must assume that during the `scopedUnlock()`
section, other threads might have changed the protected structure
in arbitrary ways. In the example above, you cannot use the
iterator `iter` and you cannot assume that the key `0` is not in the
map; another thread might have inserted it while you were
bragging on `LOG(INFO)`.

Whenever a `LockedPtr` object has been unlocked, whether with `unlock()`
or `scopedUnlock()`, it will behave as if it is null.  `isNull()` will
return true.  Dereferencing an unlocked `LockedPtr` is not allowed and
will result in undefined behavior.

#### `Synchronized` and `std::condition_variable`

When used with a `std::mutex`, `Synchronized` supports using a
`std::condition_variable` with its internal mutex.  This allows a
`condition_variable` to be used to wait for a particular change to occur
in the internal data.

The `LockedPtr` returned by `Synchronized<T, std::mutex>::lock()` has a
`getUniqueLock()` method that returns a reference to a
`std::unique_lock<std::mutex>`, which can be given to the
`std::condition_variable`:

``` Cpp
    Synchronized<vector<string>, std::mutex> vec;
    std::condition_variable emptySignal;

    // Assuming some other thread will put data on vec and signal
    // emptySignal, we can then wait on it as follows:
    auto locked = vec.lock();
    emptySignal.wait(locked.getUniqueLock(),
                     [&] { return !locked->empty(); });
```

### `acquireLocked()`

Sometimes locking just one object won't be able to cut the mustard. Consider a
function that needs to lock two `Synchronized` objects at the
same time - for example, to copy some data from one to the other.
At first sight, it looks like sequential `wlock()` calls will work just
fine:

``` Cpp
    void fun(Synchronized<vector<int>>& a, Synchronized<vector<int>>& b) {
      auto lockedA = a.wlock();
      auto lockedB = b.wlock();
      ... use lockedA and lockedB ...
    }
```

This code compiles and may even run most of the time, but embeds
a deadly peril: if one threads call `fun(x, y)` and another
thread calls `fun(y, x)`, then the two threads are liable to
deadlocking as each thread will be waiting for a lock the other
is holding. This issue is a classic that applies regardless of
the fact the objects involved have the same type.

This classic problem has a classic solution: all threads must
acquire locks in the same order. The actual order is not
important, just the fact that the order is the same in all
threads. Many libraries simply acquire mutexes in increasing
order of their address, which is what we'll do, too. The
`acquireLocked()` function takes care of all details of proper
locking of two objects and offering their innards.  It returns a
`std::tuple` of `LockedPtr`s:

``` Cpp
    void fun(Synchronized<vector<int>>& a, Synchronized<vector<int>>& b) {
      auto ret = folly::acquireLocked(a, b);
      auto& lockedA = std::get<0>(ret);
      auto& lockedB = std::get<1>(ret);
      ... use lockedA and lockedB ...
    }
```

Note that C++ 17 introduces
(structured binding syntax)[(http://wg21.link/P0144r2)]
which will make the returned tuple more convenient to use:

``` Cpp
    void fun(Synchronized<vector<int>>& a, Synchronized<vector<int>>& b) {
      auto [lockedA, lockedB] = folly::acquireLocked(a, b);
      ... use lockedA and lockedB ...
    }
```

An `acquireLockedPair()` function is also available, which returns a
`std::pair` instead of a `std::tuple`.  This is more convenient to use
in many situations, until compiler support for structured bindings is
more widely available.

### Synchronizing several data items with one mutex

The library is geared at protecting one object of a given type
with a mutex. However, sometimes we'd like to protect two or more
members with the same mutex. Consider for example a bidirectional
map, i.e. a map that holds an `int` to `string` mapping and also
the converse `string` to `int` mapping. The two maps would need
to be manipulated simultaneously. There are at least two designs
that come to mind.

#### Using a nested `struct`

You can easily pack the needed data items in a little struct.
For example:

``` Cpp
    class Server {
      struct BiMap {
        map<int, string> direct;
        map<string, int> inverse;
      };
      Synchronized<BiMap> bimap_;
      ...
    };
    ...
    bimap_.withLock([](auto& locked) {
      locked.direct[0] = "zero";
      locked.inverse["zero"] = 0;
    });
```

With this code in tow you get to use `bimap_` just like any other
`Synchronized` object, without much effort.

#### Using `std::tuple`

If you won't stop short of using a spaceship-era approach,
`std::tuple` is there for you. The example above could be
rewritten for the same functionality like this:

``` Cpp
    class Server {
      Synchronized<tuple<map<int, string>, map<string, int>>> bimap_;
      ...
    };
    ...
    bimap_.withLock([](auto& locked) {
      get<0>(locked)[0] = "zero";
      get<1>(locked)["zero"] = 0;
    });
```

The code uses `std::get` with compile-time integers to access the
fields in the tuple. The relative advantages and disadvantages of
using a local struct vs. `std::tuple` are quite obvious - in the
first case you need to invest in the definition, in the second
case you need to put up with slightly more verbose and less clear
access syntax.

### Summary

`Synchronized` and its supporting tools offer you a simple,
robust paradigm for mutual exclusion-based concurrency. Instead
of manually pairing data with the mutexes that protect it and
relying on convention to use them appropriately, you can benefit
of encapsulation and typechecking to offload a large part of that
task and to provide good guarantees.
