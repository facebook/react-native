require 'concurrent/synchronization/safe_initialization'

module Concurrent

  # @!macro atomic_boolean
  # @!visibility private
  # @!macro internal_implementation_note
  class MutexAtomicBoolean
    extend Concurrent::Synchronization::SafeInitialization

    # @!macro atomic_boolean_method_initialize
    def initialize(initial = false)
      super()
      @Lock = ::Mutex.new
      @value = !!initial
    end

    # @!macro atomic_boolean_method_value_get
    def value
      synchronize { @value }
    end

    # @!macro atomic_boolean_method_value_set
    def value=(value)
      synchronize { @value = !!value }
    end

    # @!macro atomic_boolean_method_true_question
    def true?
      synchronize { @value }
    end

    # @!macro atomic_boolean_method_false_question
    def false?
      synchronize { !@value }
    end

    # @!macro atomic_boolean_method_make_true
    def make_true
      synchronize { ns_make_value(true) }
    end

    # @!macro atomic_boolean_method_make_false
    def make_false
      synchronize { ns_make_value(false) }
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
    def ns_make_value(value)
      old = @value
      @value = value
      old != @value
    end
  end
end
