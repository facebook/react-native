## Current

## Release v1.2.3 (16 Jan 2024)

* See [the GitHub release](https://github.com/ruby-concurrency/concurrent-ruby/releases/tag/v1.2.3) for details.

## Release v1.2.2 (24 Feb 2023)

* (#993) Fix arguments passed to `Concurrent::Map`'s `default_proc`.

## Release v1.2.1 (24 Feb 2023)

* (#990) Add missing `require 'fiber'` for `FiberLocalVar`.
* (#989) Optimize `Concurrent::Map#[]` on CRuby by letting the backing Hash handle the `default_proc`.

## Release v1.2.0 (23 Jan 2023)

* (#962) Fix ReentrantReadWriteLock to use the same granularity for locals as for Mutex it uses.
* (#983) Add FiberLocalVar
* (#934) concurrent-ruby now supports requiring individual classes (public classes listed in the docs), e.g., `require 'concurrent/map'`
* (#976) Let `Promises.any_fulfilled_future` take an `Event`
* Improve documentation of various classes
* (#975) Set the Ruby compatibility version at 2.3
* (#972) Remove Rubinius-related code

## Release v1.1.10 (22 Mar 2022)

concurrent-ruby:

* (#951) Set the Ruby compatibility version at 2.2
* (#939, #933) The `caller_runs` fallback policy no longer blocks reads from the job queue by worker threads
* (#938, #761, #652) You can now explicitly `prune_pool` a thread pool (Sylvain Joyeux)
* (#937, #757, #670) We switched the Yahoo stock API for demos to Alpha Vantage (Gustavo Caso)
* (#932, #931) We changed how `SafeTaskExecutor` handles local jump errors (Aaron Jensen)
* (#927) You can use keyword arguments in your initialize when using `Async` (Matt Larraz)
* (#926, #639) We removed timeout from `TimerTask` because it wasn't sound, and now it's a no-op with a warning (Jacob Atzen)
* (#919) If you double-lock a re-entrant read-write lock, we promote to locked for writing (zp yuan)
* (#915) `monotonic_time` now accepts an optional unit parameter, as Ruby's `clock_gettime` (Jean Boussier)

## Release v1.1.9 (5 Jun 2021)

concurrent-ruby:

* (#866) Child promise state not set to :pending immediately after #execute when parent has completed 
* (#905, #872) Fix RubyNonConcurrentPriorityQueue#delete method
* (2df0337d) Make sure locks are not shared on shared when objects are dup/cloned
* (#900, #906, #796, #847, #911) Fix Concurrent::Set tread-safety issues on CRuby
* (#907) Add new ConcurrentMap backend for TruffleRuby

## Release v1.1.8 (20 January 2021)

concurrent-ruby:

* (#885) Fix race condition in TVar for stale reads 
* (#884) RubyThreadLocalVar: Do not iterate over hash which might conflict with new pair addition

## Release v1.1.7 (6 August 2020)

concurrent-ruby:

* (#879) Consider falsy value on `Concurrent::Map#compute_if_absent` for fast non-blocking path
* (#876) Reset Async queue on forking, makes Async fork-safe
* (#856) Avoid running problematic code in RubyThreadLocalVar on MRI that occasionally results in segfault
* (#853) Introduce ThreadPoolExecutor without a Queue

## Release v1.1.6, edge v0.6.0 (10 Feb 2020)

concurrent-ruby:

* (#841) Concurrent.disable_at_exit_handlers! is no longer needed and was deprecated.
* (#841) AbstractExecutorService#auto_terminate= was deprecated and has no effect. 
  Set :auto_terminate option instead when executor is initialized.

## Release v1.1.6.pre1, edge v0.6.0.pre1 (26 Jan 2020)

concurrent-ruby:

* (#828) Allow to name executors, the name is also used to name their threads 
* (#838) Implement #dup and #clone for structs
* (#821) Safer finalizers for thread local variables
* Documentation fixes
* (#814) Use Ruby's Etc.nprocessors if available
* (#812) Fix directory structure not to mess with packaging tools
* (#840) Fix termination of pools on JRuby

concurrent-ruby-edge:

* Add WrappingExecutor (#830)

## Release v1.1.5, edge v0.5.0 (10 Mar 2019)

concurrent-ruby:

* fix potential leak of context on JRuby and Java 7

concurrent-ruby-edge:

* Add finalized Concurrent::Cancellation
* Add finalized Concurrent::Throttle
* Add finalized Concurrent::Promises::Channel
* Add new Concurrent::ErlangActor

## Release v1.1.4 (14 Dec 2018)

* (#780) Remove java_alias of 'submit' method of Runnable to let executor service work on java 11
* (#776) Fix NameError on defining a struct with a name which is already taken in an ancestor

## Release v1.1.3 (7 Nov 2018)

* (#775) fix partial require of the gem (although not officially supported)

## Release v1.1.2 (6 Nov 2018)

* (#773) more defensive 1.9.3 support

## Release v1.1.1, edge v0.4.1 (1 Nov 2018)

* (#768) add support for 1.9.3 back 

## Release v1.1.0, edge v0.4.0 (31 OCt 2018) (yanked)

* (#768) yanked because of issues with removed 1.9.3 support 

## Release v1.1.0.pre2, edge v0.4.0.pre2 (18 Sep 2018)

concurrent-ruby:

* fixed documentation and README links
* fix Set for TruffleRuby and Rubinius
* use properly supported TruffleRuby APIs

concurrent-ruby-edge:

* add Promises.zip_futures_over_on

## Release v1.1.0.pre1, edge v0.4.0.pre1 (15 Aug 2018)

concurrent-ruby:

* requires at least Ruby 2.0
* [Promises](http://ruby-concurrency.github.io/concurrent-ruby/1.1.0/Concurrent/Promises.html)
  are moved from `concurrent-ruby-edge` to `concurrent-ruby`
* Add support for TruffleRuby
  * (#734) Fix Array/Hash/Set construction broken on TruffleRuby
  * AtomicReference fixed    
* CI stabilization
* remove sharp dependency edge -> core
* remove warnings
* documentation updates
* Exchanger is no longer documented as edge since it was already available in 
  `concurrent-ruby`
* (#644) Fix Map#each and #each_pair not returning enumerator outside of MRI
* (#659) Edge promises fail during error handling
* (#741) Raise on recursive Delay#value call
* (#727) #717 fix global IO executor on JRuby
* (#740) Drop support for CRuby 1.9, JRuby 1.7, Rubinius.
* (#737) Move AtomicMarkableReference out of Edge
* (#708) Prefer platform specific memory barriers 
* (#735) Fix wrong expected exception in channel spec assertion
* (#729) Allow executor option in `Promise#then`
* (#725) fix timeout check to use timeout_interval
* (#719) update engine detection
* (#660) Add specs for Promise#zip/Promise.zip ordering
* (#654) Promise.zip execution changes
* (#666) Add thread safe set implementation
* (#651) #699 #to_s, #inspect should not output negative object IDs.
* (#685) Avoid RSpec warnings about raise_error
* (#680) Avoid RSpec monkey patching, persist spec results locally, use RSpec
  v3.7.0
* (#665) Initialize the monitor for new subarrays on Rubinius
* (#661) Fix error handling in edge promises
  
concurrent-ruby-edge:

* (#659) Edge promises fail during error handling
* Edge files clearly separated in `lib-edge`
* added ReInclude

## Release v1.0.5, edge v0.3.1 (26 Feb 2017)

concurrent-ruby:

* Documentation for Event and Semaphore
* Use Unsafe#fullFence and #loadFence directly since the shortcuts were removed in JRuby
* Do not depend on org.jruby.util.unsafe.UnsafeHolder

concurrent-ruby-edge:

* (#620) Actors on Pool raise an error
* (#624) Delayed promises did not interact correctly with flatting
  * Fix arguments yielded by callback methods
* Overridable default executor in promises factory methods
* Asking actor to terminate will always resolve to `true`

## Release v1.0.4, edge v0.3.0 (27 Dec 2016)

concurrent-ruby:

* Nothing

concurrent-ruby-edge:

* New promises' API renamed, lots of improvements, edge bumped to 0.3.0
  * **Incompatible** with previous 0.2.3 version
  * see https://github.com/ruby-concurrency/concurrent-ruby/pull/522

## Release v1.0.3 (17 Dec 2016)

* Trigger execution of flattened delayed futures
* Avoid forking for processor_count if possible
* Semaphore Mutex and JRuby parity
* Adds Map#each as alias to Map#each_pair
* Fix uninitialized instance variables
* Make Fixnum, Bignum merger ready
* Allows Promise#then to receive an executor
* TimerSet now survives a fork
* Reject promise on any exception
* Allow ThreadLocalVar to be initialized with a block
* Support Alpha with `Concurrent::processor_count`
* Fixes format-security error when compiling ruby_193_compatible.h
* Concurrent::Atom#swap fixed: reraise the exceptions from block

## Release v1.0.2 (2 May 2016)

* Fix bug with `Concurrent::Map` MRI backend `#inspect` method
* Fix bug with `Concurrent::Map` MRI backend using `Hash#value?`
* Improved documentation and examples
* Minor updates to Edge

## Release v1.0.1 (27 February 2016)

* Fix "uninitialized constant Concurrent::ReentrantReadWriteLock" error.
* Better handling of `autoload` vs. `require`.
* Improved API for Edge `Future` zipping.
* Fix reference leak in Edge `Future` constructor .
* Fix bug which prevented thread pools from surviving a `fork`.
* Fix bug in which `TimerTask` did not correctly specify all its dependencies.
* Improved support for JRuby+Truffle
* Improved error messages.
* Improved documentation.
* Updated README and CONTRIBUTING.

## Release v1.0.0 (13 November 2015)

* Rename `attr_volatile_with_cas` to `attr_atomic`
* Add `clear_each` to `LockFreeStack`
* Update `AtomicReference` documentation
* Further updates and improvements to the synchronization layer.
* Performance and memory usage performance with `Actor` logging.
* Fixed `ThreadPoolExecutor` task count methods.
* Improved `Async` performance for both short and long-lived objects.
* Fixed bug in `LockFreeLinkedSet`.
* Fixed bug in which `Agent#await` triggered a validation failure.
* Further `Channel` updates.
* Adopted a project Code of Conduct
* Cleared interpreter warnings
* Fixed bug in `ThreadPoolExecutor` task count methods
* Fixed bug in 'LockFreeLinkedSet'
* Improved Java extension loading
* Handle Exception children in Edge::Future
* Continued improvements to channel
* Removed interpreter warnings.
* Shared constants now in `lib/concurrent/constants.rb`
* Refactored many tests.
* Improved synchronization layer/memory model documentation.
* Bug fix in Edge `Future#flat`
* Brand new `Channel` implementation in Edge gem.
* Simplification of `RubySingleThreadExecutor`
* `Async` improvements
  - Each object uses its own `SingleThreadExecutor` instead of the global thread pool.
  - No longers supports executor injection
  - Much better documentation
* `Atom` updates
  - No longer `Dereferenceable`
  - Now `Observable`
  - Added a `#reset` method
* Brand new `Agent` API and implementation. Now functionally equivalent to Clojure.
* Continued improvements to the synchronization layer
* Merged in the `thread_safe` gem
  - `Concurrent::Array`
  - `Concurrent::Hash`
  - `Concurrent::Map` (formerly ThreadSafe::Cache)
  - `Concurrent::Tuple`
* Minor improvements to Concurrent::Map
* Complete rewrite of `Exchanger`
* Removed all deprecated code (classes, methods, constants, etc.)
* Updated Agent, MutexAtomic, and BufferedChannel to inherit from Synchronization::Object.
* Many improved tests
* Some internal reorganization

## Release v0.9.1 (09 August 2015)

* Fixed a Rubiniux bug in synchronization object
* Fixed all interpreter warnings (except circular references)
* Fixed require statements when requiring `Atom` alone
* Significantly improved `ThreadLocalVar` on non-JRuby platforms
* Fixed error handling in Edge `Concurrent.zip`
* `AtomicFixnum` methods `#increment` and `#decrement` now support optional delta
* New `AtomicFixnum#update` method
* Minor optimizations in `ReadWriteLock`
* New `ReentrantReadWriteLock` class
* `ThreadLocalVar#bind` method is now public
* Refactored many tests

## Release v0.9.0 (10 July 2015)

* Updated `AtomicReference`
  - `AtomicReference#try_update` now simply returns instead of raising exception
  - `AtomicReference#try_update!` was added to raise exceptions if an update
    fails. Note: this is the same behavior as the old `try_update`
* Pure Java implementations of
  - `AtomicBoolean`
  - `AtomicFixnum`
  - `Semaphore`
* Fixed bug when pruning Ruby thread pools
* Fixed bug in time calculations within `ScheduledTask`
* Default `count` in `CountDownLatch` to 1
* Use monotonic clock for all timers via `Concurrent.monotonic_time`
  - Use `Process.clock_gettime(Process::CLOCK_MONOTONIC)` when available
  - Fallback to `java.lang.System.nanoTime()` on unsupported JRuby versions
  - Pure Ruby implementation for everything else
  - Effects `Concurrent.timer`, `Concurrent.timeout`, `TimerSet`, `TimerTask`, and `ScheduledTask`
* Deprecated all clock-time based timer scheduling
  - Only support scheduling by delay
  - Effects `Concurrent.timer`, `TimerSet`, and `ScheduledTask`
* Added new `ReadWriteLock` class
* Consistent `at_exit` behavior for Java and Ruby thread pools.
* Added `at_exit` handler to Ruby thread pools (already in Java thread pools)
  - Ruby handler stores the object id and retrieves from `ObjectSpace`
  - JRuby disables `ObjectSpace` by default so that handler stores the object reference
* Added a `:stop_on_exit` option to thread pools to enable/disable `at_exit` handler
* Updated thread pool docs to better explain shutting down thread pools
* Simpler `:executor` option syntax for all abstractions which support this option
* Added `Executor#auto_terminate?` predicate method (for thread pools)
* Added `at_exit` handler to `TimerSet`
* Simplified auto-termination of the global executors
  - Can now disable auto-termination of global executors
  - Added shutdown/kill/wait_for_termination variants for global executors
* Can now disable auto-termination for *all* executors (the nuclear option)
* Simplified auto-termination of the global executors
* Deprecated terms "task pool" and "operation pool"
  - New terms are "io executor" and "fast executor"
  - New functions added with new names
  - Deprecation warnings added to functions referencing old names
* Moved all thread pool related functions from `Concurrent::Configuration` to `Concurrent`
  - Old functions still exist with deprecation warnings
  - New functions have updated names as appropriate
* All high-level abstractions default to the "io executor"
* Fixed bug in `Actor` causing it to prematurely warm global thread pools on gem load
  - This also fixed a `RejectedExecutionError` bug when running with minitest/autorun via JRuby
* Moved global logger up to the `Concurrent` namespace and refactored the code
* Optimized the performance of `Delay`
  - Fixed a bug in which no executor option on construction caused block execution on a global thread pool
* Numerous improvements and bug fixes to `TimerSet`
* Fixed deadlock of `Future` when the handler raises Exception
* Added shared specs for more classes
* New concurrency abstractions including:
  - `Atom`
  - `Maybe`
  - `ImmutableStruct`
  - `MutableStruct`
  - `SettableStruct`
* Created an Edge gem for unstable abstractions including
  - `Actor`
  - `Agent`
  - `Channel`
  - `Exchanger`
  - `LazyRegister`
  - **new Future Framework** <http://ruby-concurrency.github.io/concurrent-ruby/Concurrent/Edge.html> - unified
    implementation of Futures and Promises which combines Features of previous `Future`,
    `Promise`, `IVar`, `Event`, `Probe`, `dataflow`, `Delay`, `TimerTask` into single framework. It uses extensively
    new synchronization layer to make all the paths **lock-free** with exception of blocking threads on `#wait`.
    It offers better performance and does not block threads when not required.
* Actor framework changes:
  - fixed reset loop in Pool
  - Pool can use any actor as a worker, abstract worker class is no longer needed.
  - Actor events not have format `[:event_name, *payload]` instead of just the Symbol.
  - Actor now uses new Future/Promise Framework instead of `IVar` for better interoperability
  - Behaviour definition array was simplified to `[BehaviourClass1, [BehaviourClass2, *initialization_args]]`
  - Linking behavior responds to :linked message by returning array of linked actors
  - Supervised behavior is removed in favour of just Linking
  - RestartingContext is supervised by default now, `supervise: true` is not required any more
  - Events can be private and public, so far only difference is that Linking will
    pass to linked actors only public messages. Adding private :restarting and
    :resetting events which are send before the actor restarts or resets allowing
    to add callbacks to cleanup current child actors.
  - Print also object_id in Reference to_s
  - Add AbstractContext#default_executor to be able to override executor class wide
  - Add basic IO example
  - Documentation somewhat improved
  - All messages should have same priority. It's now possible to send `actor << job1 << job2 << :terminate!` and
    be sure that both jobs are processed first.
* Refactored `Channel` to use newer synchronization objects
* Added `#reset` and `#cancel` methods to `TimerSet`
* Added `#cancel` method to `Future` and `ScheduledTask`
* Refactored `TimerSet` to use `ScheduledTask`
* Updated `Async` with a factory that initializes the object
* Deprecated `Concurrent.timer` and `Concurrent.timeout`
* Reduced max threads on pure-Ruby thread pools (abends around 14751 threads)
* Moved many private/internal classes/modules into "namespace" modules
* Removed brute-force killing of threads in tests
* Fixed a thread pool bug when the operating system cannot allocate more threads

## Release v0.8.0 (25 January 2015)

* C extension for MRI have been extracted into the `concurrent-ruby-ext` companion gem.
  Please see the README for more detail.
* Better variable isolation in `Promise` and `Future` via an `:args` option
* Continued to update intermittently failing tests

## Release v0.7.2 (24 January 2015)

* New `Semaphore` class based on [java.util.concurrent.Semaphore](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Semaphore.html)
* New `Promise.all?` and `Promise.any?` class methods
* Renamed `:overflow_policy` on thread pools to `:fallback_policy`
* Thread pools still accept the `:overflow_policy` option but display a warning
* Thread pools now implement `fallback_policy` behavior when not running (rather than universally rejecting tasks)
* Fixed minor `set_deref_options` constructor bug in `Promise` class
* Fixed minor `require` bug in `ThreadLocalVar` class
* Fixed race condition bug in `TimerSet` class
* Fixed race condition bug in `TimerSet` class
* Fixed signal bug in `TimerSet#post` method
* Numerous non-functional updates to clear warning when running in debug mode
* Fixed more intermittently failing tests
* Tests now run on new Travis build environment
* Multiple documentation updates

## Release v0.7.1 (4 December 2014)

Please see the [roadmap](https://github.com/ruby-concurrency/concurrent-ruby/issues/142) for more information on the next planned release.

* Added `flat_map` method to `Promise`
* Added `zip` method to `Promise`
* Fixed bug with logging in `Actor`
* Improvements to `Promise` tests
* Removed actor-experimental warning
* Added an `IndirectImmediateExecutor` class
* Allow disabling auto termination of global executors
* Fix thread leaking in `ThreadLocalVar` (uses `Ref` gem on non-JRuby systems)
* Fix thread leaking when pruning pure-Ruby thread pools
* Prevent `Actor` from using an `ImmediateExecutor` (causes deadlock)
* Added missing synchronizations to `TimerSet`
* Fixed bug with return value of `Concurrent::Actor::Utils::Pool#ask`
* Fixed timing bug in `TimerTask`
* Fixed bug when creating a `JavaThreadPoolExecutor` with minimum pool size of zero
* Removed confusing warning when not using native extenstions
* Improved documentation

## Release v0.7.0 (13 August 2014)

* Merge the [atomic](https://github.com/ruby-concurrency/atomic) gem
  - Pure Ruby `MutexAtomic` atomic reference class
  - Platform native atomic reference classes `CAtomic`, `JavaAtomic`, and `RbxAtomic`
  - Automated [build process](https://github.com/ruby-concurrency/rake-compiler-dev-box)
  - Fat binary releases for [multiple platforms](https://rubygems.org/gems/concurrent-ruby/versions) including Windows (32/64), Linux (32/64), OS X (64-bit), Solaris (64-bit), and JRuby
* C native `CAtomicBoolean`
* C native `CAtomicFixnum`
* Refactored intermittently failing tests
* Added `dataflow!` and `dataflow_with!` methods to match `Future#value!` method
* Better handling of timeout in `Agent`
* Actor Improvements
  - Fine-grained implementation using chain of behaviors. Each behavior is responsible for single aspect like: `Termination`, `Pausing`, `Linking`, `Supervising`, etc. Users can create custom Actors easily based on their needs.
  - Supervision was added. `RestartingContext` will pause on error waiting on its supervisor to decide what to do next ( options are `:terminate!`, `:resume!`, `:reset!`, `:restart!`). Supervising behavior also supports strategies `:one_for_one` and `:one_for_all`.
  - Linking was added to be able to monitor actor's events like: `:terminated`, `:paused`, `:restarted`, etc.
  - Dead letter routing added. Rejected envelopes are collected in a configurable actor (default: `Concurrent::Actor.root.ask!(:dead_letter_routing)`)
  - Old `Actor` class removed and replaced by new implementation previously called `Actress`. `Actress` was kept as an alias for `Actor` to keep compatibility.
  - `Utils::Broadcast` actor which allows Publish–subscribe pattern.
* More executors for managing serialized operations
  - `SerializedExecution` mixin module
  - `SerializedExecutionDelegator` for serializing *any* executor
* Updated `Async` with serialized execution
* Updated `ImmediateExecutor` and `PerThreadExecutor` with full executor service lifecycle
* Added a `Delay` to root `Actress` initialization
* Minor bug fixes to thread pools
* Refactored many intermittently failing specs
* Removed Java interop warning `executor.rb:148 warning: ambiguous Java methods found, using submit(java.lang.Runnable)`
* Fixed minor bug in `RubyCachedThreadPool` overflow policy
* Updated tests to use [RSpec 3.0](http://myronmars.to/n/dev-blog/2014/05/notable-changes-in-rspec-3)
* Removed deprecated `Actor` class
* Better support for Rubinius

## Release v0.6.1 (14 June 2014)

* Many improvements to `Concurrent::Actress`
* Bug fixes to `Concurrent::RubyThreadPoolExecutor`
* Fixed several brittle tests
* Moved documentation to http://ruby-concurrency.github.io/concurrent-ruby/frames.html

## Release v0.6.0 (25 May 2014)

* Added `Concurrent::Observable` to encapsulate our thread safe observer sets
* Improvements to new `Channel`
* Major improvements to `CachedThreadPool` and `FixedThreadPool`
* Added `SingleThreadExecutor`
* Added `Current::timer` function
* Added `TimerSet` executor
* Added `AtomicBoolean`
* `ScheduledTask` refactoring
* Pure Ruby and JRuby-optimized `PriorityQueue` classes
* Updated `Agent` behavior to more closely match Clojure
* Observer sets support block callbacks to the `add_observer` method
* New algorithm for thread creation in `RubyThreadPoolExecutor`
* Minor API updates to `Event`
* Rewritten `TimerTask` now an `Executor` instead of a `Runnable`
* Fixed many brittle specs
* Renamed `FixedThreadPool` and `CachedThreadPool` to `RubyFixedThreadPool` and `RubyCachedThreadPool`
* Created JRuby optimized `JavaFixedThreadPool` and `JavaCachedThreadPool`
* Consolidated fixed thread pool tests into `spec/concurrent/fixed_thread_pool_shared.rb` and  `spec/concurrent/cached_thread_pool_shared.rb`
* `FixedThreadPool` now subclasses `RubyFixedThreadPool` or `JavaFixedThreadPool` as appropriate
* `CachedThreadPool` now subclasses `RubyCachedThreadPool` or `JavaCachedThreadPool` as appropriate
* New `Delay` class
* `Concurrent::processor_count` helper function
* New `Async` module
* Renamed `NullThreadPool` to `PerThreadExecutor`
* Deprecated `Channel` (we are planning a new implementation based on [Go](http://golangtutorials.blogspot.com/2011/06/channels-in-go.html))
* Added gem-level [configuration](http://robots.thoughtbot.com/mygem-configure-block)
* Deprecated `$GLOBAL_THREAD_POOL` in lieu of gem-level configuration
* Removed support for Ruby [1.9.2](https://www.ruby-lang.org/en/news/2013/12/17/maintenance-of-1-8-7-and-1-9-2/)
* New `RubyThreadPoolExecutor` and `JavaThreadPoolExecutor` classes
* All thread pools now extend the appropriate thread pool executor classes
* All thread pools now support `:overflow_policy` (based on Java's [reject policies](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ThreadPoolExecutor.html))
* Deprecated `UsesGlobalThreadPool` in lieu of explicit `:executor` option (dependency injection) on `Future`, `Promise`, and `Agent`
* Added `Concurrent::dataflow_with(executor, *inputs)` method to support executor dependency injection for dataflow
* Software transactional memory with `TVar` and `Concurrent::atomically`
* First implementation of [new, high-performance](https://github.com/ruby-concurrency/concurrent-ruby/pull/49) `Channel`
* `Actor` is deprecated in favor of new experimental actor implementation [#73](https://github.com/ruby-concurrency/concurrent-ruby/pull/73). To avoid namespace collision it is living in `Actress` namespace until `Actor` is removed in next release.

## Release v0.5.0

This is the most significant release of this gem since its inception. This release includes many improvements and optimizations. It also includes several bug fixes. The major areas of focus for this release were:

* Stability improvements on Ruby versions with thread-level parallelism ([JRuby](http://jruby.org/) and [Rubinius](http://rubini.us/))
* Creation of new low-level concurrency abstractions
* Internal refactoring to use the new low-level abstractions

Most of these updates had no effect on the gem API. There are a few notable exceptions which were unavoidable. Please read the [release notes](API-Updates-in-v0.5.0) for more information.

Specific changes include:

* New class `IVar`
* New class `MVar`
* New class `ThreadLocalVar`
* New class `AtomicFixnum`
* New class method `dataflow`
* New class `Condition`
* New class `CountDownLatch`
* New class `DependencyCounter`
* New class `SafeTaskExecutor`
* New class `CopyOnNotifyObserverSet`
* New class `CopyOnWriteObserverSet`
* `Future` updated with `execute` API
* `ScheduledTask` updated with `execute` API
* New `Promise` API
* `Future` now extends `IVar`
* `Postable#post?` now returns an `IVar`
* Thread safety fixes to `Dereferenceable`
* Thread safety fixes to `Obligation`
* Thread safety fixes to `Supervisor`
* Thread safety fixes to `Event`
* Various other thread safety (race condition) fixes
* Refactored brittle tests
* Implemented pending tests
* Added JRuby and Rubinius as Travis CI build targets
* Added [CodeClimate](https://codeclimate.com/) code review
* Improved YARD documentation
