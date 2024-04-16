module Concurrent

  Error = Class.new(StandardError)

  # Raised when errors occur during configuration.
  ConfigurationError = Class.new(Error)

  # Raised when an asynchronous operation is cancelled before execution.
  CancelledOperationError = Class.new(Error)

  # Raised when a lifecycle method (such as `stop`) is called in an improper
  # sequence or when the object is in an inappropriate state.
  LifecycleError = Class.new(Error)

  # Raised when an attempt is made to violate an immutability guarantee.
  ImmutabilityError = Class.new(Error)

  # Raised when an operation is attempted which is not legal given the
  # receiver's current state
  IllegalOperationError = Class.new(Error)

  # Raised when an object's methods are called when it has not been
  # properly initialized.
  InitializationError = Class.new(Error)

  # Raised when an object with a start/stop lifecycle has been started an
  # excessive number of times. Often used in conjunction with a restart
  # policy or strategy.
  MaxRestartFrequencyError = Class.new(Error)

  # Raised when an attempt is made to modify an immutable object
  # (such as an `IVar`) after its final state has been set.
  class MultipleAssignmentError < Error
    attr_reader :inspection_data

    def initialize(message = nil, inspection_data = nil)
      @inspection_data = inspection_data
      super message
    end

    def inspect
      format '%s %s>', super[0..-2], @inspection_data.inspect
    end
  end

  # Raised by an `Executor` when it is unable to process a given task,
  # possibly because of a reject policy or other internal error.
  RejectedExecutionError = Class.new(Error)

  # Raised when any finite resource, such as a lock counter, exceeds its
  # maximum limit/threshold.
  ResourceLimitError = Class.new(Error)

  # Raised when an operation times out.
  TimeoutError = Class.new(Error)

  # Aggregates multiple exceptions.
  class MultipleErrors < Error
    attr_reader :errors

    def initialize(errors, message = "#{errors.size} errors")
      @errors = errors
      super [*message,
             *errors.map { |e| [format('%s (%s)', e.message, e.class), *e.backtrace] }.flatten(1)
            ].join("\n")
    end
  end

  # @!macro internal_implementation_note
  class ConcurrentUpdateError < ThreadError
    # frozen pre-allocated backtrace to speed ConcurrentUpdateError
    CONC_UP_ERR_BACKTRACE = ['backtrace elided; set verbose to enable'].freeze
  end
end
