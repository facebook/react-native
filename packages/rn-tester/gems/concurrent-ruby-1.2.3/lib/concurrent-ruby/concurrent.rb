require 'concurrent/version'
require 'concurrent/constants'
require 'concurrent/errors'
require 'concurrent/configuration'

require 'concurrent/atomics'
require 'concurrent/executors'
require 'concurrent/synchronization'

require 'concurrent/atomic/atomic_markable_reference'
require 'concurrent/atomic/atomic_reference'
require 'concurrent/agent'
require 'concurrent/atom'
require 'concurrent/array'
require 'concurrent/hash'
require 'concurrent/set'
require 'concurrent/map'
require 'concurrent/tuple'
require 'concurrent/async'
require 'concurrent/dataflow'
require 'concurrent/delay'
require 'concurrent/exchanger'
require 'concurrent/future'
require 'concurrent/immutable_struct'
require 'concurrent/ivar'
require 'concurrent/maybe'
require 'concurrent/mutable_struct'
require 'concurrent/mvar'
require 'concurrent/promise'
require 'concurrent/scheduled_task'
require 'concurrent/settable_struct'
require 'concurrent/timer_task'
require 'concurrent/tvar'
require 'concurrent/promises'

require 'concurrent/thread_safe/synchronized_delegator'
require 'concurrent/thread_safe/util'

require 'concurrent/options'

# @!macro internal_implementation_note
#
#   @note **Private Implementation:** This abstraction is a private, internal
#     implementation detail. It should never be used directly.

# @!macro monotonic_clock_warning
#
#   @note Time calculations on all platforms and languages are sensitive to
#     changes to the system clock. To alleviate the potential problems
#     associated with changing the system clock while an application is running,
#     most modern operating systems provide a monotonic clock that operates
#     independently of the system clock. A monotonic clock cannot be used to
#     determine human-friendly clock times. A monotonic clock is used exclusively
#     for calculating time intervals. Not all Ruby platforms provide access to an
#     operating system monotonic clock. On these platforms a pure-Ruby monotonic
#     clock will be used as a fallback. An operating system monotonic clock is both
#     faster and more reliable than the pure-Ruby implementation. The pure-Ruby
#     implementation should be fast and reliable enough for most non-realtime
#     operations. At this time the common Ruby platforms that provide access to an
#     operating system monotonic clock are MRI 2.1 and above and JRuby (all versions).
#
#   @see http://linux.die.net/man/3/clock_gettime Linux clock_gettime(3)

# @!macro copy_options
#
#   ## Copy Options
#
#   Object references in Ruby are mutable. This can lead to serious
#   problems when the {#value} of an object is a mutable reference. Which
#   is always the case unless the value is a `Fixnum`, `Symbol`, or similar
#   "primitive" data type. Each instance can be configured with a few
#   options that can help protect the program from potentially dangerous
#   operations. Each of these options can be optionally set when the object
#   instance is created:
#
#   * `:dup_on_deref` When true the object will call the `#dup` method on
#     the `value` object every time the `#value` method is called
#     (default: false)
#   * `:freeze_on_deref` When true the object will call the `#freeze`
#     method on the `value` object every time the `#value` method is called
#     (default: false)
#   * `:copy_on_deref` When given a `Proc` object the `Proc` will be run
#     every time   the `#value` method is called. The `Proc` will be given
#     the current `value` as its only argument and the result returned by
#     the block will be the return   value of the `#value` call. When `nil`
#     this option will be ignored (default: nil)
#
#   When multiple deref options are set the order of operations is strictly defined.
#   The order of deref operations is:
#   * `:copy_on_deref`
#   * `:dup_on_deref`
#   * `:freeze_on_deref`
#
#   Because of this ordering there is no need to `#freeze` an object created by a
#   provided `:copy_on_deref` block. Simply set `:freeze_on_deref` to `true`.
#   Setting both `:dup_on_deref` to `true` and `:freeze_on_deref` to `true` is
#   as close to the behavior of a "pure" functional language (like Erlang, Clojure,
#   or Haskell) as we are likely to get in Ruby.

# @!macro deref_options
#
#   @option opts [Boolean] :dup_on_deref (false) Call `#dup` before
#     returning the data from {#value}
#   @option opts [Boolean] :freeze_on_deref (false) Call `#freeze` before
#     returning the data from {#value}
#   @option opts [Proc] :copy_on_deref (nil) When calling the {#value}
#     method, call the given proc passing the internal value as the sole
#     argument then return the new value returned from the proc.

# @!macro executor_and_deref_options
#
#   @param [Hash] opts the options used to define the behavior at update and deref
#     and to specify the executor on which to perform actions
#   @option opts [Executor] :executor when set use the given `Executor` instance.
#     Three special values are also supported: `:io` returns the global pool for
#     long, blocking (IO) tasks, `:fast` returns the global pool for short, fast
#     operations, and `:immediate` returns the global `ImmediateExecutor` object.
#   @!macro deref_options

# @!macro warn.edge
#   @api Edge
#   @note **Edge Features** are under active development and may change frequently.
#
#     -   Deprecations are not added before incompatible changes.
#     -   Edge version: _major_ is always 0, _minor_ bump means incompatible change,
#         _patch_ bump means compatible change.
#     -   Edge features may also lack tests and documentation.
#     -   Features developed in `concurrent-ruby-edge` are expected to move
#         to `concurrent-ruby` when finalised.


# {include:file:README.md}
module Concurrent
end
