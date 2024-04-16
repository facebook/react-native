# Concurrent Ruby

[![Gem Version](https://badge.fury.io/rb/concurrent-ruby.svg)](http://badge.fury.io/rb/concurrent-ruby)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](http://opensource.org/licenses/MIT)
[![Gitter chat](https://img.shields.io/badge/IRC%20(gitter)-devs%20%26%20users-brightgreen.svg)](https://gitter.im/ruby-concurrency/concurrent-ruby)

Modern concurrency tools for Ruby. Inspired by
[Erlang](http://www.erlang.org/doc/reference_manual/processes.html),
[Clojure](http://clojure.org/concurrent_programming),
[Scala](http://akka.io/),
[Haskell](http://www.haskell.org/haskellwiki/Applications_and_libraries/Concurrency_and_parallelism#Concurrent_Haskell),
[F#](http://blogs.msdn.com/b/dsyme/archive/2010/02/15/async-and-parallel-design-patterns-in-f-part-3-agents.aspx),
[C#](http://msdn.microsoft.com/en-us/library/vstudio/hh191443.aspx),
[Java](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/package-summary.html),
and classic concurrency patterns.

<img src="https://raw.githubusercontent.com/ruby-concurrency/concurrent-ruby/master/docs-source/logo/concurrent-ruby-logo-300x300.png" align="right" style="margin-left: 20px;" />

The design goals of this gem are:

*   Be an 'unopinionated' toolbox that provides useful utilities without debating which is better 
    or why
*   Remain free of external gem dependencies
*   Stay true to the spirit of the languages providing inspiration
*   But implement in a way that makes sense for Ruby
*   Keep the semantics as idiomatic Ruby as possible
*   Support features that make sense in Ruby
*   Exclude features that don't make sense in Ruby
*   Be small, lean, and loosely coupled
*   Thread-safety
*   Backward compatibility

## Contributing

**This gem depends on 
[contributions](https://github.com/ruby-concurrency/concurrent-ruby/graphs/contributors) and we 
appreciate your help. Would you like to contribute? Great! Have a look at 
[issues with `looking-for-contributor` label](https://github.com/ruby-concurrency/concurrent-ruby/issues?q=is%3Aissue+is%3Aopen+label%3Alooking-for-contributor).** And if you pick something up let us know on the issue.

You can also get started by triaging issues which may include reproducing bug reports or asking for vital information, such as version numbers or reproduction instructions. If you would like to start triaging issues, one easy way to get started is to [subscribe to concurrent-ruby on CodeTriage](https://www.codetriage.com/ruby-concurrency/concurrent-ruby). [![Open Source Helpers](https://www.codetriage.com/ruby-concurrency/concurrent-ruby/badges/users.svg)](https://www.codetriage.com/ruby-concurrency/concurrent-ruby)

## Thread Safety

*Concurrent Ruby makes one of the strongest thread safety guarantees of any Ruby concurrency 
library, providing consistent behavior and guarantees on all three main Ruby interpreters
(MRI/CRuby, JRuby, TruffleRuby).*

Every abstraction in this library is thread safe. Specific thread safety guarantees are documented 
with each abstraction.

It is critical to remember, however, that Ruby is a language of mutable references. *No*
concurrency library for Ruby can ever prevent the user from making thread safety mistakes (such as
sharing a mutable object between threads and modifying it on both threads) or from creating
deadlocks through incorrect use of locks. All the library can do is provide safe abstractions which
encourage safe practices. Concurrent Ruby provides more safe concurrency abstractions than any
other Ruby library, many of which support the mantra of 
["Do not communicate by sharing memory; instead, share memory by communicating"](https://blog.golang.org/share-memory-by-communicating).
Concurrent Ruby is also the only Ruby library which provides a full suite of thread safe and
immutable variable types and data structures.

We've also initiated discussion to document the [memory model](docs-source/synchronization.md) of Ruby which 
would provide consistent behaviour and guarantees on all three main Ruby interpreters 
(MRI/CRuby, JRuby, TruffleRuby).

## Features & Documentation

**The primary site for documentation is the automatically generated 
[API documentation](http://ruby-concurrency.github.io/concurrent-ruby/index.html) which is up to 
date with latest release.** This readme matches the master so may contain new stuff not yet 
released.

We also have a [IRC (gitter)](https://gitter.im/ruby-concurrency/concurrent-ruby).

### Versioning

*   `concurrent-ruby` uses [Semantic Versioning](http://semver.org/)
*   `concurrent-ruby-ext` has always same version as `concurrent-ruby`
*   `concurrent-ruby-edge` will always be 0.y.z therefore following 
    [point 4](http://semver.org/#spec-item-4) applies *"Major version zero 
    (0.y.z) is for initial development. Anything may change at any time. The 
    public API should not be considered stable."* However we additionally use 
    following rules:
    *   Minor version increment means incompatible changes were made
    *   Patch version increment means only compatible changes were made


#### General-purpose Concurrency Abstractions

*   [Async](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Async.html):
    A mixin module that provides simple asynchronous behavior to a class. Loosely based on Erlang's 
    [gen_server](http://www.erlang.org/doc/man/gen_server.html).
*   [ScheduledTask](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/ScheduledTask.html):
    Like a Future scheduled for a specific future time.
*   [TimerTask](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/TimerTask.html):
    A Thread that periodically wakes up to perform work at regular intervals.
*   [Promises](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises.html):
    Unified implementation of futures and promises which combines features of previous `Future`,
    `Promise`, `IVar`, `Event`, `dataflow`, `Delay`, and (partially) `TimerTask` into a single 
    framework. It extensively uses the new synchronization layer to make all the features 
    **non-blocking** and **lock-free**, with the exception of obviously blocking operations like 
    `#wait`, `#value`. It also offers better performance.    

#### Thread-safe Value Objects, Structures, and Collections

Collection classes that were originally part of the (deprecated) `thread_safe` gem:

*   [Array](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Array.html) A thread-safe
    subclass of Ruby's standard [Array](http://ruby-doc.org/core/Array.html).
*   [Hash](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Hash.html) A thread-safe
    subclass of Ruby's standard [Hash](http://ruby-doc.org/core/Hash.html).
*   [Set](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Set.html) A thread-safe
    subclass of Ruby's standard [Set](http://ruby-doc.org/stdlib-2.4.0/libdoc/set/rdoc/Set.html).
*   [Map](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Map.html) A hash-like object
    that should have much better performance characteristics, especially under high concurrency, 
    than `Concurrent::Hash`.
*   [Tuple](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Tuple.html) A fixed size
    array with volatile (synchronized, thread safe) getters/setters.

Value objects inspired by other languages:

*   [Maybe](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Maybe.html) A thread-safe,
    immutable object representing an optional value, based on 
    [Haskell Data.Maybe](https://hackage.haskell.org/package/base-4.2.0.1/docs/Data-Maybe.html).

Structure classes derived from Ruby's [Struct](http://ruby-doc.org/core/Struct.html):

*   [ImmutableStruct](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/ImmutableStruct.html)
    Immutable struct where values are set at construction and cannot be changed later.
*   [MutableStruct](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/MutableStruct.html)
    Synchronized, mutable struct where values can be safely changed at any time.
*   [SettableStruct](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/SettableStruct.html)
    Synchronized, write-once struct where values can be set at most once, either at construction 
    or any time thereafter.

Thread-safe variables:

*   [Agent](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Agent.html): A way to
    manage shared, mutable, *asynchronous*, independent state. Based on Clojure's 
    [Agent](http://clojure.org/agents).
*   [Atom](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Atom.html): A way to manage
    shared, mutable, *synchronous*, independent state. Based on Clojure's 
    [Atom](http://clojure.org/atoms).
*   [AtomicBoolean](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/AtomicBoolean.html)
    A boolean value that can be updated atomically.
*   [AtomicFixnum](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/AtomicFixnum.html)
    A numeric value that can be updated atomically.
*   [AtomicReference](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/AtomicReference.html)
    An object reference that may be updated atomically.
*   [Exchanger](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Exchanger.html)
    A synchronization point at which threads can pair and swap elements within pairs. Based on 
    Java's [Exchanger](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Exchanger.html).
*   [MVar](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/MVar.html) A synchronized
    single element container. Based on Haskell's 
    [MVar](https://hackage.haskell.org/package/base-4.8.1.0/docs/Control-Concurrent-MVar.html) and 
    Scala's [MVar](http://docs.typelevel.org/api/scalaz/nightly/index.html#scalaz.concurrent.MVar$).
*   [ThreadLocalVar](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/ThreadLocalVar.html)
    A variable where the value is different for each thread.
*   [TVar](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/TVar.html) A transactional
    variable implementing software transactional memory (STM). Based on Clojure's 
    [Ref](http://clojure.org/refs).

#### Java-inspired ThreadPools and Other Executors

*   See the [thread pool](http://ruby-concurrency.github.io/concurrent-ruby/master/file.thread_pools.html)
    overview, which also contains a list of other Executors available.

#### Thread Synchronization Classes and Algorithms

*   [CountDownLatch](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/CountDownLatch.html)
    A synchronization object that allows one thread to wait on multiple other threads.
*   [CyclicBarrier](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/CyclicBarrier.html)
    A synchronization aid that allows a set of threads to all wait for each other to reach a common barrier point.
*   [Event](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Event.html) Old school
    kernel-style event.
*   [ReadWriteLock](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/ReadWriteLock.html)
    A lock that supports multiple readers but only one writer.
*   [ReentrantReadWriteLock](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/ReentrantReadWriteLock.html)
    A read/write lock with reentrant and upgrade features.
*   [Semaphore](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Semaphore.html)
    A counting-based locking mechanism that uses permits.
*   [AtomicMarkableReference](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/AtomicMarkableReference.html)

#### Deprecated

Deprecated features are still available and bugs are being fixed, but new features will not be added.
  
*   ~~[Future](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Future.html):
    An asynchronous operation that produces a value.~~ Replaced by 
    [Promises](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises.html).
    *   ~~[.dataflow](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent.html#dataflow-class_method):
        Built on Futures, Dataflow allows you to create a task that will be scheduled when all of 
        its data dependencies are available.~~ Replaced by 
        [Promises](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises.html).
*   ~~[Promise](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promise.html): Similar
    to Futures, with more features.~~ Replaced by 
    [Promises](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises.html).
*   ~~[Delay](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Delay.html) Lazy evaluation
    of a block yielding an immutable result. Based on Clojure's 
    [delay](https://clojuredocs.org/clojure.core/delay).~~ Replaced by 
    [Promises](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises.html).
*   ~~[IVar](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/IVar.html) Similar to a
    "future" but can be manually assigned once, after which it becomes immutable.~~ Replaced by 
    [Promises](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises.html).
    
### Edge Features

These are available in the `concurrent-ruby-edge` companion gem.

These features are under active development and may change frequently. They are expected not to
keep backward compatibility (there may also lack tests and documentation). Semantic versions will
be obeyed though. Features developed in `concurrent-ruby-edge` are expected to move to
`concurrent-ruby` when final.

*   [Actor](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Actor.html): Implements
    the Actor Model, where concurrent actors exchange messages.
    *Status: Partial documentation and tests; depends on new future/promise framework; stability is good.*
*   [Channel](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Channel.html):
    Communicating Sequential Processes ([CSP](https://en.wikipedia.org/wiki/Communicating_sequential_processes)).
    Functionally equivalent to Go [channels](https://tour.golang.org/concurrency/2) with additional
    inspiration from Clojure [core.async](https://clojure.github.io/core.async/).
    *Status: Partial documentation and tests.*
*   [LazyRegister](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/LazyRegister.html)
*   [LockFreeLinkedSet](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Edge/LockFreeLinkedSet.html)
    *Status: will be moved to core soon.*
*   [LockFreeStack](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/LockFreeStack.html)
    *Status: missing documentation and tests.*
*   [Promises::Channel](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Promises/Channel.html)
    A first in first out channel that accepts messages with push family of methods and returns
    messages with pop family of methods.
    Pop and push operations can be represented as futures, see `#pop_op` and `#push_op`.
    The capacity of the channel can be limited to support back pressure, use capacity option in `#initialize`.
    `#pop` method blocks ans `#pop_op` returns pending future if there is no message in the channel.
    If the capacity is limited the `#push` method blocks and `#push_op` returns pending future.
*   [Cancellation](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Cancellation.html)
    The Cancellation abstraction provides cooperative cancellation.

    The standard methods `Thread#raise` of `Thread#kill` available in Ruby
    are very dangerous (see linked the blog posts bellow).
    Therefore concurrent-ruby provides an alternative.
    
    *   <https://jvns.ca/blog/2015/11/27/why-rubys-timeout-is-dangerous-and-thread-dot-raise-is-terrifying/>
    *   <http://www.mikeperham.com/2015/05/08/timeout-rubys-most-dangerous-api/>
    *   <http://blog.headius.com/2008/02/rubys-threadraise-threadkill-timeoutrb.html>

    It provides an object which represents a task which can be executed,
    the task has to get the reference to the object and periodically cooperatively check that it is not cancelled.
    Good practices to make tasks cancellable:
    *   check cancellation every cycle of a loop which does significant work,
    *   do all blocking actions in a loop with a timeout then on timeout check cancellation
        and if ok block again with the timeout 
*   [Throttle](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/Throttle.html)
    A tool managing concurrency level of tasks.
*   [ErlangActor](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/ErlangActor.html)
    Actor implementation which precisely matches Erlang actor behaviour. 
    Requires at least Ruby 2.1 otherwise it's not loaded.
*   [WrappingExecutor](http://ruby-concurrency.github.io/concurrent-ruby/master/Concurrent/WrappingExecutor.html) 
    A delegating executor which modifies each task before the task is given to 
    the target executor it delegates to.

## Supported Ruby versions

* MRI 2.3 and above
* Latest JRuby 9000
* Latest TruffleRuby

## Usage

Everything within this gem can be loaded simply by requiring it:

```ruby
require 'concurrent'
```

You can also require a specific abstraction [part of the public documentation](https://ruby-concurrency.github.io/concurrent-ruby/master/index.html) since concurrent-ruby 1.2.0, for example:
```ruby
require 'concurrent/map'
require 'concurrent/atomic/atomic_reference'
require 'concurrent/executor/fixed_thread_pool'
```

To use the tools in the Edge gem it must be required separately:

```ruby
require 'concurrent-edge'
```

If the library does not behave as expected, `Concurrent.use_stdlib_logger(Logger::DEBUG)` could 
help to reveal the problem.

## Installation

```shell
gem install concurrent-ruby
```

or add the following line to Gemfile:

```ruby
gem 'concurrent-ruby', require: 'concurrent'
```

and run `bundle install` from your shell.

### Edge Gem Installation

The Edge gem must be installed separately from the core gem:

```shell
gem install concurrent-ruby-edge
```

or add the following line to Gemfile:

```ruby
gem 'concurrent-ruby-edge', require: 'concurrent-edge'
```

and run `bundle install` from your shell.


### C Extensions for MRI

Potential performance improvements may be achieved under MRI by installing optional C extensions.
To minimise installation errors the C extensions are available in the `concurrent-ruby-ext`
extension gem. `concurrent-ruby` and `concurrent-ruby-ext` are always released together with same
version. Simply install the extension gem too:

```ruby
gem install concurrent-ruby-ext
```

or add the following line to Gemfile:

```ruby
gem 'concurrent-ruby-ext'
```

and run `bundle install` from your shell.

In code it is only necessary to

```ruby
require 'concurrent'
```

The `concurrent-ruby` gem will automatically detect the presence of the `concurrent-ruby-ext` gem
and load the appropriate C extensions.

#### Note For gem developers

No gems should depend on `concurrent-ruby-ext`. Doing so will force C extensions on your users. The
best practice is to depend on `concurrent-ruby` and let users to decide if they want C extensions.

## Building the gem

### Requirements

* Recent CRuby
* JRuby, `rbenv install jruby-9.2.17.0`
* Set env variable `CONCURRENT_JRUBY_HOME` to point to it, e.g. `/usr/local/opt/rbenv/versions/jruby-9.2.17.0`
* Install Docker, required for Windows builds

### Publishing the Gem

* Update `version.rb`
* Update the CHANGELOG
* Add the new version to `docs-source/signpost.md`. Needs to be done only if there are visible changes in the documentation.
* Commit (and push) the changes.
* Use `bundle exec rake release` to release the gem.
  It consists of `['release:checks', 'release:build', 'release:test', 'release:publish']` steps.
  It will ask at the end before publishing anything. Steps can also be executed individually.

## Maintainers

* [Benoit Daloze](https://github.com/eregon)
* [Matthew Draper](https://github.com/matthewd)
* [Rafael França](https://github.com/rafaelfranca)
* [Charles Oliver Nutter](https://github.com/headius)
* [Ben Sheldon](https://github.com/bensheldon)
* [Samuel Williams](https://github.com/ioquatix)

### Special Thanks to

* [Jerry D'Antonio](https://github.com/jdantonio) for creating the gem
* [Brian Durand](https://github.com/bdurand) for the `ref` gem
* [Charles Oliver Nutter](https://github.com/headius) for the `atomic` and `thread_safe` gems
* [thedarkone](https://github.com/thedarkone) for the `thread_safe` gem

to the past maintainers

* [Chris Seaton](https://github.com/chrisseaton)
* [Petr Chalupa](https://github.com/pitr-ch)
* [Michele Della Torre](https://github.com/mighe)
* [Paweł Obrok](https://github.com/obrok)
* [Lucas Allan](https://github.com/lucasallan)

and to [Ruby Association](https://www.ruby.or.jp/en/) for sponsoring a project 
["Enhancing Ruby’s concurrency tooling"](https://www.ruby.or.jp/en/news/20181106) in 2018. 

## License and Copyright

*Concurrent Ruby* is free software released under the 
[MIT License](http://www.opensource.org/licenses/MIT).

The *Concurrent Ruby* [logo](https://raw.githubusercontent.com/ruby-concurrency/concurrent-ruby/master/docs-source/logo/concurrent-ruby-logo-300x300.png) was
designed by [David Jones](https://twitter.com/zombyboy). It is Copyright &copy; 2014 
[Jerry D'Antonio](https://twitter.com/jerrydantonio). All Rights Reserved.
