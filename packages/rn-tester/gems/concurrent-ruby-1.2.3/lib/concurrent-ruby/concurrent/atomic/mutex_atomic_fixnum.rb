require 'concurrent/synchronization/safe_initialization'
require 'concurrent/utility/native_integer'

module Concurrent

  # @!macro atomic_fixnum
  # @!visibility private
  # @!macro internal_implementation_note
  class MutexAtomicFixnum
    extend Concurrent::Synchronization::SafeInitialization

    # @!macro atomic_fixnum_method_initialize
    def initialize(initial = 0)
      super()
      @Lock = ::Mutex.new
      ns_set(initial)
    end

    # @!macro atomic_fixnum_method_value_get
    def value
      synchronize { @value }
    end

    # @!macro atomic_fixnum_method_value_set
    def value=(value)
      synchronize { ns_set(value) }
    end

    # @!macro atomic_fixnum_method_increment
    def increment(delta = 1)
      synchronize { ns_set(@value + delta.to_i) }
    end

    alias_method :up, :increment

    # @!macro atomic_fixnum_method_decrement
    def decrement(delta = 1)
      synchronize { ns_set(@value - delta.to_i) }
    end

    alias_method :down, :decrement

    # @!macro atomic_fixnum_method_compare_and_set
    def compare_and_set(expect, update)
      synchronize do
        if @value == expect.to_i
          @value = update.to_i
          true
        else
          false
        end
      end
    end

    # @!macro atomic_fixnum_method_update
    def update
      synchronize do
        @value = yield @value
      end
    end

    protected

    # @!visibility private
    def synchronize
      if @Lock.owned?
        yield
      else
        @Lock.synchronize { yield }
      end
    end

    private

    # @!visibility private
    def ns_set(value)
      Utility::NativeInteger.ensure_integer_and_bounds value
      @value = value
    end
  end
end
