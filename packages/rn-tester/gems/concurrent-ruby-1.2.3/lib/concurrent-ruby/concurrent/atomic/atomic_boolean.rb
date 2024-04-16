require 'concurrent/utility/native_extension_loader' # load native parts first

require 'concurrent/atomic/mutex_atomic_boolean'

module Concurrent

  ###################################################################

  # @!macro atomic_boolean_method_initialize
  #
  #   Creates a new `AtomicBoolean` with the given initial value.
  #
  #   @param [Boolean] initial the initial value

  # @!macro atomic_boolean_method_value_get
  #
  #   Retrieves the current `Boolean` value.
  #
  #   @return [Boolean] the current value

  # @!macro atomic_boolean_method_value_set
  #
  #   Explicitly sets the value.
  #
  #   @param [Boolean] value the new value to be set
  #
  #   @return [Boolean] the current value

  # @!macro atomic_boolean_method_true_question
  #
  #   Is the current value `true`
  #
  #   @return [Boolean] true if the current value is `true`, else false

  # @!macro atomic_boolean_method_false_question
  #
  #   Is the current value `false`
  #
  #   @return [Boolean] true if the current value is `false`, else false

  # @!macro atomic_boolean_method_make_true
  #
  #   Explicitly sets the value to true.
  #
  #   @return [Boolean] true if value has changed, otherwise false

  # @!macro atomic_boolean_method_make_false
  #
  #   Explicitly sets the value to false.
  #
  #   @return [Boolean] true if value has changed, otherwise false

  ###################################################################

  # @!macro atomic_boolean_public_api
  #
  #   @!method initialize(initial = false)
  #     @!macro  atomic_boolean_method_initialize
  #
  #   @!method value
  #     @!macro  atomic_boolean_method_value_get
  #
  #   @!method value=(value)
  #     @!macro  atomic_boolean_method_value_set
  #
  #   @!method true?
  #     @!macro  atomic_boolean_method_true_question
  #
  #   @!method false?
  #     @!macro  atomic_boolean_method_false_question
  #
  #   @!method make_true
  #     @!macro  atomic_boolean_method_make_true
  #
  #   @!method make_false
  #     @!macro  atomic_boolean_method_make_false

  ###################################################################

  # @!visibility private
  # @!macro internal_implementation_note
  AtomicBooleanImplementation = case
                                when Concurrent.on_cruby? && Concurrent.c_extensions_loaded?
                                  CAtomicBoolean
                                when Concurrent.on_jruby?
                                  JavaAtomicBoolean
                                else
                                  MutexAtomicBoolean
                                end
  private_constant :AtomicBooleanImplementation

  # @!macro atomic_boolean
  #
  #   A boolean value that can be updated atomically. Reads and writes to an atomic
  #   boolean and thread-safe and guaranteed to succeed. Reads and writes may block
  #   briefly but no explicit locking is required.
  #
  #   @!macro thread_safe_variable_comparison
  #
  #   Performance:
  #
  #   ```
  #   Testing with ruby 2.1.2
  #   Testing with Concurrent::MutexAtomicBoolean...
  #     2.790000   0.000000   2.790000 (  2.791454)
  #   Testing with Concurrent::CAtomicBoolean...
  #     0.740000   0.000000   0.740000 (  0.740206)
  #
  #   Testing with jruby 1.9.3
  #   Testing with Concurrent::MutexAtomicBoolean...
  #     5.240000   2.520000   7.760000 (  3.683000)
  #   Testing with Concurrent::JavaAtomicBoolean...
  #     3.340000   0.010000   3.350000 (  0.855000)
  #   ```
  #
  #   @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/atomic/AtomicBoolean.html java.util.concurrent.atomic.AtomicBoolean
  #
  # @!macro atomic_boolean_public_api
  class AtomicBoolean < AtomicBooleanImplementation
    # @return [String] Short string representation.
    def to_s
      format '%s value:%s>', super[0..-2], value
    end

    alias_method :inspect, :to_s
  end
end
