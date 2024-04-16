require 'concurrent/executor/executor_service'

module Concurrent

  # Indicates that the including `ExecutorService` guarantees
  # that all operations will occur in the order they are post and that no
  # two operations may occur simultaneously. This module provides no
  # functionality and provides no guarantees. That is the responsibility
  # of the including class. This module exists solely to allow the including
  # object to be interrogated for its serialization status.
  #
  # @example
  #   class Foo
  #     include Concurrent::SerialExecutor
  #   end
  #
  #   foo = Foo.new
  #
  #   foo.is_a? Concurrent::ExecutorService #=> true
  #   foo.is_a? Concurrent::SerialExecutor  #=> true
  #   foo.serialized?                       #=> true
  #
  # @!visibility private
  module SerialExecutorService
    include ExecutorService

    # @!macro executor_service_method_serialized_question
    #
    # @note Always returns `true`
    def serialized?
      true
    end
  end
end
