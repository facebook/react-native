`folly/ThreadLocal.h`
----------------------

Improved thread local storage for non-trivial types.

 * ~4x faster than `boost::thread_specific_ptr`.
 * Similar speed as using `pthread_getspecific` directly, but only consumes a
   single `pthread_key_t` per `Tag` template param.
 * Expands on the `thread_specific_ptr` API with `accessAllThreads` and extended
   custom deleter support.


### Usage
***

The API of `ThreadLocalPtr` is very close to `boost::thread_specific_ptr` with
the notable addition of the `accessAllThreads` method.  There is also a
`ThreadLocal` class which is a thin wrapper around `ThreadLocalPtr` that manages
allocation automatically (creates a new object the first time it is dereferenced
from each thread).

`ThreadLocalPtr` simply gives you a place to put and access a pointer local to
each thread such that it will be destroyed appropriately.

```Cpp
{
  folly::ThreadLocalPtr<Widget> w;
  w.reset(new Widget(0), Widget::customDeleterA);
  std::thread([&w]() {
    w.reset(new Widget(1), Widget::customDeleterB);
    w.get()->mangleWidget();
  } // Widget(1) is destroyed with customDeleterB
} // Widget(0) is destroyed with customDeleterA
```

Note that `customDeleterB` will get called with
`TLPDestructionMode::THIS_THREAD` and `customerDeleterA` will get called with
`TLPDestructionMode::ALL_THREADS`.  This is to distinguish between thread exit
vs. the entire `ThreadLocalPtr` getting destroyed, in which case there is
cleanup work that may be avoided.

The `accessAllThreads` interface is provided to walk all the thread local child
objects of a parent.  `accessAllThreads` initializes an accessor
which holds a global lock that blocks all creation and destruction of
`ThreadLocal` objects with the same `Tag` and can be used as an iterable
container. Typical use is for frequent write, infrequent read data access
patterns such as counters.  Note that you must specify a unique Tag type so you
don't block other ThreadLocal object usage, and you should try to minimize the
lifetime of the accessor so the lock is held for as short as possible).

The following example is a simplification of `folly/ThreadCachedInt.h`.  It
keeps track of a counter value and allows multiple threads to add to the count
without synchronization.  In order to get the total count, `read()` iterates
through all the thread local values via `accessAllThreads()` and sums them up.
`class NewTag` is used to break the global mutex so that this class won't block
other `ThreadLocal` usage when `read()` is called.

Note that `read()` holds the global mutex which blocks construction,
destruction, and `read()` for other `SimpleThreadCachedInt`'s, but does not
block `add()`.  Also, since it uses the unique `NewTag`, `SimpleThreadCachedInt`
does not affect other `ThreadLocal` usage.

```Cpp
class SimpleThreadCachedInt {

  class NewTag;  // Segments the global mutex
  ThreadLocal<int,NewTag> val_;

 public:
  void add(int val) {
    *val_ += val;  // operator*() gives a reference to the thread local instance
  }

  int read() {
    int ret = 0;
    // accessAllThreads acquires the global lock
    for (const auto& i : val_.accessAllThreads()) {
      ret += i;
    }  // Global lock is released on scope exit
    return ret;
  }
};
```


### Implementation
***

We keep a `__thread` array of pointers to objects (`ThreadEntry::elements`)
where each array has an index for each unique instance of the `ThreadLocalPtr`
object.  Each `ThreadLocalPtr` object has a unique id that is an index into
these arrays so we can fetch the correct object from thread local storage
very efficiently.

In order to prevent unbounded growth of the id space and thus huge
`ThreadEntry::elements` arrays, for example due to continuous creation and
destruction of `ThreadLocalPtr` objects, we keep track of all active instances
by linking them together into a list.  When an instance is destroyed we remove
it from the chain and insert the id into `freeIds_` for reuse.  These operations
require a global mutex, but only happen at construction and destruction time.
`accessAllThreads` also acquires this global mutex.

We use a single global `pthread_key_t` per `Tag` to manage object destruction
and memory cleanup upon thread exit because there is a finite number of
`pthread_key_t`'s available per machine.
