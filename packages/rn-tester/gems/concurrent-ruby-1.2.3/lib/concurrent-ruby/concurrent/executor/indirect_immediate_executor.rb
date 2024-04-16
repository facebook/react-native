require 'concurrent/executor/immediate_executor'
require 'concurrent/executor/simple_executor_service'

module Concurrent
  # An executor service which runs all operations on a new thread, blocking
  # until it completes. Operations are performed in the order they are received
  # and no two operations can be performed simultaneously.
  #
  # This executor service exists mainly for testing an debugging. When used it
  # immediately runs every `#post` operation on a new thread, blocking the
  # current thread until the operation is complete. This is similar to how the
  # ImmediateExecutor works, but the operation has the full stack of the new
  # thread at its disposal. This can be helpful when the operations will spawn
  # more operations on the same executor and so on - such a situation might
  # overflow the single stack in case of an ImmediateExecutor, which is
  # inconsistent with how it would behave for a threaded executor.
  #
  # @note Intended for use primarily in testing and debugging.
  class IndirectImmediateExecutor < ImmediateExecutor
    # Creates a new executor
    def initialize
      super
      @internal_executor = SimpleExecutorService.new
    end

    # @!macro executor_service_method_post
    def post(*args, &task)
      raise ArgumentError.new("no block given") unless block_given?
      return false unless running?

      event = Concurrent::Event.new
      @internal_executor.post do
        begin
          task.call(*args)
        ensure
          event.set
        end
      end
      event.wait

      true
    end
  end
end
