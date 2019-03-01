`folly/ThreadCachedInt.h`
----------------------

High-performance atomic increment using thread caching.

`folly/ThreadCachedInt.h` introduces a integer class designed for high
performance increments from multiple threads simultaneously without
loss of precision.  It has two read modes, `readFast` gives a potentially stale
value with one load, and `readFull` gives the exact value, but is much slower,
as discussed below.


### Performance
***

Increment performance is up to 10x greater than `std::atomic_fetch_add` in high
contention environments.  See `folly/test/ThreadCachedIntTest.h` for more
comprehensive benchmarks.

`readFast` is as fast as a single load.

`readFull`, on the other hand, requires acquiring a mutex and iterating through
a list to accumulate the values of all the thread local counters, so is
significantly slower than `readFast`.


### Usage
***

Create an instance and increment it with `increment` or the operator overloads.
Read the value with `readFast` for quick, potentially stale data, or `readFull`
for a more expensive but precise result. There are additional convenience
functions as well, such as `set`.

``` Cpp
    ThreadCachedInt<int64_t> val;
    EXPECT_EQ(0, val.readFast());
    ++val;                        // increment in thread local counter only
    EXPECT_EQ(0, val.readFast()); // increment has not been flushed
    EXPECT_EQ(1, val.readFull()); // accumulates all thread local counters
    val.set(2);
    EXPECT_EQ(2, val.readFast());
    EXPECT_EQ(2, val.readFull());
```

### Implementation
***

`folly::ThreadCachedInt` uses `folly::ThreadLocal` to store thread specific
objects that each have a local counter.  When incrementing, the thread local
instance is incremented.  If the local counter passes the cache size, the value
is flushed to the global counter with an atomic increment.  It is this global
counter that is read with `readFast` via a simple load, but will not count any
of the updates that haven't been flushed.

In order to read the exact value, `ThreadCachedInt` uses the extended
`readAllThreads()` API of `folly::ThreadLocal` to iterate through all the
references to all the associated thread local object instances.  This currently
requires acquiring a global mutex and iterating through the references,
accumulating the counters along with the global counter.  This also means that
the first use of the object from a new thread will acquire the mutex in order to
insert the thread local reference into the list.  By default, there is one
global mutex per integer type used in `ThreadCachedInt`.  If you plan on using a
lot of `ThreadCachedInt`s in your application, considering breaking up the
global mutex by introducing additional `Tag` template parameters.

`set` simply sets the global counter value, and marks all the thread local
instances as needing to be reset.  When iterating with `readFull`, thread local
counters that have been marked as reset are skipped.  When incrementing, thread
local counters marked for reset are set to zero and unmarked for reset.

Upon destruction, thread local counters are flushed to the parent so that counts
are not lost after increments in temporary threads.  This requires grabbing the
global mutex to make sure the parent itself wasn't destroyed in another thread
already.

### Alternate Implementations
***

There are of course many ways to skin a cat, and you may notice there is a
partial alternate implementation in `folly/test/ThreadCachedIntTest.cpp` that
provides similar performance.  `ShardedAtomicInt` simply uses an array of
`std::atomic<int64_t>`'s and hashes threads across them to do low-contention
atomic increments, and `readFull` just sums up all the ints.

This sounds great, but in order to get the contention low enough to get similar
performance as ThreadCachedInt with 24 threads, `ShardedAtomicInt` needs about
2000 ints to hash across.  This uses about 20x more memory, and the lock-free
`readFull` has to sum up all 2048 ints, which ends up being a about 50x slower
than `ThreadCachedInt` in low contention situations, which is hopefully the
common case since it's designed for high-write, low read access patterns.
Performance of `readFull` is about the same speed as `ThreadCachedInt` in high
contention environments.

Depending on the operating conditions, it may make more sense to use one
implementation over the other.  For example, a lower contention environment will
probably be able to use a `ShardedAtomicInt` with a much smaller array without
hurting performance, while improving memory consumption and perf of `readFull`.
