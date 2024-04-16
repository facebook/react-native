require 'concurrent/utility/native_extension_loader' # load native parts first

require 'concurrent/atomic/mutex_atomic_fixnum'

module Concurrent

  ###################################################################

  # @!macro atomic_fixnum_method_initialize
  #
  #   Creates a new `AtomicFixnum` with the given initial value.
  #
  #   @param [Fixnum] initial the initial value
  #   @raise [ArgumentError] if the initial value is not a `Fixnum`

  # @!macro atomic_fixnum_method_value_get
  #
  #   Retrieves the current `Fixnum` value.
  #
  #   @return [Fixnum] the current value

  # @!macro atomic_fixnum_method_value_set
  #
  #   Explicitly sets the value.
  #
  #   @param [Fixnum] value the new value to be set
  #
  #   @return [Fixnum] the current value
  #
  #   @raise [ArgumentError] if the new value is not a `Fixnum`

  # @!macro atomic_fixnum_method_increment
  #
  #   Increases the current value by the given amount (defaults to 1).
  #
  #   @param [Fixnum] delta the amount by which to increase the current value
  #
  #   @return [Fixnum] the current value after incrementation

  # @!macro atomic_fixnum_method_decrement
  #
  #   Decreases the current value by the given amount (defaults to 1).
  #
  #   @param [Fixnum] delta the amount by which to decrease the current value
  #
  #   @return [Fixnum] the current value after decrementation

  # @!macro atomic_fixnum_method_compare_and_set
  #
  #   Atomically sets the value to the given updated value if the current
  #   value == the expected value.
  #
  #   @param [Fixnum] expect the expected value
  #   @param [Fixnum] update the new value
  #
  #   @return [Boolean] true if the value was updated else false

  # @!macro atomic_fixnum_method_update
  #
  #   Pass the current value to the given block, replacing it
  #   with the block's result. May retry if the value changes
  #   during the block's execution.
  #
  #   @yield [Object] Calculate a new value for the atomic reference using
  #     given (old) value
  #   @yieldparam [Object] old_value the starting value of the atomic reference
  #
  #   @return [Object] the new value

  ###################################################################

  # @!macro atomic_fixnum_public_api
  #
  #   @!method initialize(initial = 0)
  #     @!macro atomic_fixnum_method_initialize
  #
  #   @!method value
  #     @!macro atomic_fixnum_method_value_get
  #
  #   @!method value=(value)
  #     @!macro atomic_fixnum_method_value_set
  #
  #   @!method increment(delta = 1)
  #     @!macro atomic_fixnum_method_increment
  #
  #   @!method decrement(delta = 1)
  #     @!macro atomic_fixnum_method_decrement
  #
  #   @!method compare_and_set(expect, update)
  #     @!macro atomic_fixnum_method_compare_and_set
  #
  #   @!method update
  #     @!macro atomic_fixnum_method_update

  ###################################################################

  # @!visibility private
  # @!macro internal_implementation_note
  AtomicFixnumImplementation = case
                               when Concurrent.on_cruby? && Concurrent.c_extensions_loaded?
                                 CAtomicFixnum
                               when Concurrent.on_jruby?
                                 JavaAtomicFixnum
                               else
                                 MutexAtomicFixnum
                               end
  private_constant :AtomicFixnumImplementation

  # @!macro atomic_fixnum
  #
  #   A numeric value that can be updated atomically. Reads and writes to an atomic
  #   fixnum and thread-safe and guaranteed to succeed. Reads and writes may block
  #   briefly but no explicit locking is required.
  #
  #   @!macro thread_safe_variable_comparison
  #
  #   Performance:
  #
  #   ```
  #   Testing with ruby 2.1.2
  #   Testing with Concurrent::MutexAtomicFixnum...
  #     3.130000   0.000000   3.130000 (  3.136505)
  #   Testing with Concurrent::CAtomicFixnum...
  #     0.790000   0.000000   0.790000 (  0.785550)
  #
  #   Testing with jruby 1.9.3
  #   Testing with Concurrent::MutexAtomicFixnum...
  #     5.460000   2.460000   7.920000 (  3.715000)
  #   Testing with Concurrent::JavaAtomicFixnum...
  #     4.520000   0.030000   4.550000 (  1.187000)
  #   ```
  #
  #   @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/atomic/AtomicLong.html java.util.concurrent.atomic.AtomicLong
  #
  # @!macro atomic_fixnum_public_api
  class AtomicFixnum < AtomicFixnumImplementation
    # @return [String] Short string representation.
    def to_s
      format '%s value:%s>', super[0..-2], value
    end

    alias_method :inspect, :to_s
  end
end
