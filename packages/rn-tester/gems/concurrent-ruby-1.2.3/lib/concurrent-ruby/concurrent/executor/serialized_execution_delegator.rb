require 'delegate'
require 'concurrent/executor/serial_executor_service'
require 'concurrent/executor/serialized_execution'

module Concurrent

  # A wrapper/delegator for any `ExecutorService` that
  # guarantees serialized execution of tasks.
  #
  # @see [SimpleDelegator](http://www.ruby-doc.org/stdlib-2.1.2/libdoc/delegate/rdoc/SimpleDelegator.html)
  # @see Concurrent::SerializedExecution
  class SerializedExecutionDelegator < SimpleDelegator
    include SerialExecutorService

    def initialize(executor)
      @executor   = executor
      @serializer = SerializedExecution.new
      super(executor)
    end

    # @!macro executor_service_method_post
    def post(*args, &task)
      raise ArgumentError.new('no block given') unless block_given?
      return false unless running?
      @serializer.post(@executor, *args, &task)
    end
  end
end
