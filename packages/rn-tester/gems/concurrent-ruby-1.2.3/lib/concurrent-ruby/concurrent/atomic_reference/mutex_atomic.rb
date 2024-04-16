require 'concurrent/atomic_reference/atomic_direct_update'
require 'concurrent/atomic_reference/numeric_cas_wrapper'
require 'concurrent/synchronization/safe_initialization'

module Concurrent

  # @!visibility private
  # @!macro internal_implementation_note
  class MutexAtomicReference
    extend Concurrent::Synchronization::SafeInitialization
    include AtomicDirectUpdate
    include AtomicNumericCompareAndSetWrapper
    alias_method :compare_and_swap, :compare_and_set

    # @!macro atomic_reference_method_initialize
    def initialize(value = nil)
      super()
      @Lock = ::Mutex.new
      @value = value
    end

    # @!macro atomic_reference_method_get
    def get
      synchronize { @value }
    end
    alias_method :value, :get

    # @!macro atomic_reference_method_set
    def set(new_value)
      synchronize { @value = new_value }
    end
    alias_method :value=, :set

    # @!macro atomic_reference_method_get_and_set
    def get_and_set(new_value)
      synchronize do
        old_value = @value
        @value = new_value
        old_value
      end
    end
    alias_method :swap, :get_and_set

    # @!macro atomic_reference_method_compare_and_set
    def _compare_and_set(old_value, new_value)
      synchronize do
        if @value.equal? old_value
          @value = new_value
          true
        else
          false
        end
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
  end
end
