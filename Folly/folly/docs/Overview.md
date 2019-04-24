### `folly/`

### Components

Below is a list of (some) Folly components in alphabetical order, along with
a brief description of each.

#### `Arena.h`, `ThreadCachedArena.h`

Simple arena for memory allocation: multiple allocations get freed all
at once. With threaded version.

#### [`AtomicHashMap.h`, `AtomicHashArray.h`](AtomicHashMap.md), `AtomicHashArray.h`, `AtomicLinkedList.h`, ...

High-performance atomic data-structures. Many of these are built with very specific
tradeoffs and constraints in mind that make them faster than their more general
counterparts. Each header should contain information about what these tradeoffs are.

#### `Baton.h`

A Baton allows a thread to block once and be awoken: it captures a single handoff. It is
essentially a (very small, very fast) semaphore that supports only a single call to `sem_call`
and `sem_wait`.

#### [`Benchmark.h`](Benchmark.md)

A small framework for benchmarking code. Client code registers
benchmarks, optionally with an argument that dictates the scale of the
benchmark (iterations, working set size etc). The framework runs
benchmarks (subject to a command-line flag) and produces formatted
output with timing information.

#### `Bits.h`

Various bit manipulation utilities optimized for speed; includes functions
that wrap the
[ffsl(l)](http://linux.die.net/man/3/ffsll) primitives in a uniform
interface.

#### `ConcurrentSkipList.h`

An implementation of the structure described in [A Provably Correct
Scalable Concurrent Skip
List](http://www.cs.tau.ac.il/~shanir/nir-pubs-web/Papers/OPODIS2006-BA.pdf)
by Herlihy et al.

#### [`Conv.h`](Conv.md)

A variety of data conversion routines (notably to and from string),
optimized for speed and safety.

#### `Demangle.h`

Pretty-printing C++ types.

#### `DiscriminatedPtr.h`

Similar to `boost::variant`, but restricted to pointers only. Uses the
highest-order unused 16 bits in a pointer as discriminator. So
`sizeof(DiscriminatedPtr<int, string, Widget>) == sizeof(void*)`.

#### [`dynamic.h`](Dynamic.md)

Dynamically-typed object, created with JSON objects in mind. `DynamicConverter.h` is
a utility for effeciently converting from a `dynamic` to a more concrete structure when
the scheme is known (e.g. json -> `map<int,int>`).

#### `EvictingCacheMap.h`

A simple LRU hash map.

#### [`FBString.h`](FBString.md)

A drop-in implementation of `std::string` with a variety of optimizations.

#### [`FBVector.h`](FBVector.md)

A mostly drop-in implementation of `std::vector` with a variety of
optimizations.

#### `File.h`

A C++ abstraction around files.

#### `Fingerprint.h`

Rabin fingerprinting.

### [`Function.h`](Function.md)

A polymorphic wrapper for callables similar to `std::function` but not copyable and therefore able to wrap non-copyable callables, such as lambdas that capture move-only types like `std::unique_ptr` or `folly::Promise`.

### [`futures/`](Futures.md)

Futures is a framework for expressing asynchronous code in C++ using the Promise/Future pattern.

#### [`Format.h`](Format.md)

Python-style formatting utilities.

#### `gen/`

This library makes it possible to write declarative comprehensions for
processing sequences of values efficiently in C++ akin to C#'s LINQ.

#### [`GroupVarint.h`](GroupVarint.md)

[Group Varint
encoding](http://www.ir.uwaterloo.ca/book/addenda-06-index-compression.html)
for 32-bit values.

#### `IpAddress.h`

A collection of utilities to deal with IPAddresses, including ipv4 and ipv6.

#### `io/`

A collection of useful of abstractions for high-performance io. This is heavily relied upon
in Facebook's internally networking code.

#### `Hash.h`

Various popular hash function implementations.

#### [`Histogram.h`](Histogram.md)

A simple class for collecting histogram data.

#### `IntrusiveList.h`

Convenience type definitions for using `boost::intrusive_list`.

#### `json.h`

JSON serializer and deserializer. Uses `dynamic.h`.

#### `Likely.h`

Wrappers around [`__builtin_expect`](http://gcc.gnu.org/onlinedocs/gcc/Other-Builtins.html).

#### `Malloc.h`, `Memory.h`

Memory allocation helpers, particularly when using jemalloc.

#### `MicroSpinLock.h`

A really, *really* small spinlock for fine-grained locking of lots of teeny-tiny data.

#### `MPMCQueue.h`

MPMCQueue<typename> is a high-performance bounded concurrent queue that
supports multiple producers, multiple consumers, and optional blocking.
The queue has a fixed capacity, for which all memory will be allocated
 up front.

The additional utility `MPMCPipeline.h` is an extension that lets you
chain several queues together with processing steps in between.

#### [`PackedSyncPtr.h`](PackedSyncPtr.md)

A highly specialized data structure consisting of a pointer, a 1-bit
spin lock, and a 15-bit integral, all inside one 64-bit word.

#### [`Poly.h`](Poly.md)

A class template that makes it relatively easy to define a type-erasing
polymorphic object wrapper.

#### `Preprocessor.h`

Necessarily evil stuff.

#### [`ProducerConsumerQueue.h`](ProducerConsumerQueue.md)

Lock free single-reader, single-writer queue.

#### `Random.h`

Defines only one function---`randomNumberSeed()`.

#### `Range.h`

Boost-style range facility and the `StringPiece` specialization.

#### `RWSpinLock.h`

Fast and compact reader-writer spin lock.

#### `ScopeGuard.h`

C++11 incarnation of the old [ScopeGuard](http://drdobbs.com/184403758) idiom.

#### `Singleton.h`

A singleton to rule the singletons. This is an attempt to insert a layer between
C++ statics and the fiasco that ensues, so that things can be created, and destroyed,
correctly upon program creation, program end and sometimes `dlopen` and `fork`.

Singletons are bad for you, but this may help.

#### [`SmallLocks.h`](SmallLocks.md)

Very small spin locks (1 byte and 1 bit).

#### `small_vector.h`

Vector with the small buffer optimization and an optional embedded
`PicoSpinLock`.

#### `sorted_vector_types.h`

Collections similar to `std::map` but implemented as sorted vectors.

#### `stats/`

A collection of efficient utilities for collecting statistics (often of
time series data).

#### `StlAllocator.h`

STL allocator wrapping a simple allocate/deallocate interface.

#### `String.h`

String utilities that connect `folly::fbstring` with `std::string`.

#### `Subprocess.h`

Subprocess library, modeled after Python's subprocess module.

#### [`Synchronized.h`](Synchronized.md)

High-level synchronization library.

#### `System.h`

Demangling and errno utilities.

#### [`ThreadCachedInt.h`](ThreadCachedInt.md)

High-performance atomic increment using thread caching.

#### [`ThreadLocal.h`](ThreadLocal.md)

Improved thread local storage for non-trivial types.

#### `TimeoutQueue.h`

Queue with per-item timeout.

#### `Traits.h`

Type traits that complement those defined in the standard C++11 header
`<traits>`.

#### `Unicode.h`

Defines the `codePointToUtf8` function.

#### `Uri.h`

A collection of utilities to deal with URIs.
