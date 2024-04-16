require 'concurrent/concern/logging'

module Concurrent

  ###################################################################

  # @!macro executor_service_method_post
  #
  #   Submit a task to the executor for asynchronous processing.
  #
  #   @param [Array] args zero or more arguments to be passed to the task
  #
  #   @yield the asynchronous task to perform
  #
  #   @return [Boolean] `true` if the task is queued, `false` if the executor
  #     is not running
  #
  #   @raise [ArgumentError] if no task is given

  # @!macro executor_service_method_left_shift
  #
  #   Submit a task to the executor for asynchronous processing.
  #
  #   @param [Proc] task the asynchronous task to perform
  #
  #   @return [self] returns itself

  # @!macro executor_service_method_can_overflow_question
  #
  #   Does the task queue have a maximum size?
  #
  #   @return [Boolean] True if the task queue has a maximum size else false.

  # @!macro executor_service_method_serialized_question
  #
  #   Does this executor guarantee serialization of its operations?
  #
  #   @return [Boolean] True if the executor guarantees that all operations
  #     will be post in the order they are received and no two operations may
  #     occur simultaneously. Else false.

  ###################################################################

  # @!macro executor_service_public_api
  #
  #   @!method post(*args, &task)
  #     @!macro executor_service_method_post
  #
  #   @!method <<(task)
  #     @!macro executor_service_method_left_shift
  #
  #   @!method can_overflow?
  #     @!macro executor_service_method_can_overflow_question
  #
  #   @!method serialized?
  #     @!macro executor_service_method_serialized_question

  ###################################################################

  # @!macro executor_service_attr_reader_fallback_policy
  #   @return [Symbol] The fallback policy in effect. Either `:abort`, `:discard`, or `:caller_runs`.

  # @!macro executor_service_method_shutdown
  #
  #   Begin an orderly shutdown. Tasks already in the queue will be executed,
  #   but no new tasks will be accepted. Has no additional effect if the
  #   thread pool is not running.

  # @!macro executor_service_method_kill
  #
  #   Begin an immediate shutdown. In-progress tasks will be allowed to
  #   complete but enqueued tasks will be dismissed and no new tasks
  #   will be accepted. Has no additional effect if the thread pool is
  #   not running.

  # @!macro executor_service_method_wait_for_termination
  #
  #   Block until executor shutdown is complete or until `timeout` seconds have
  #   passed.
  #
  #   @note Does not initiate shutdown or termination. Either `shutdown` or `kill`
  #     must be called before this method (or on another thread).
  #
  #   @param [Integer] timeout the maximum number of seconds to wait for shutdown to complete
  #
  #   @return [Boolean] `true` if shutdown complete or false on `timeout`

  # @!macro executor_service_method_running_question
  #
  #   Is the executor running?
  #
  #   @return [Boolean] `true` when running, `false` when shutting down or shutdown

  # @!macro executor_service_method_shuttingdown_question
  #
  #   Is the executor shuttingdown?
  #
  #   @return [Boolean] `true` when not running and not shutdown, else `false`

  # @!macro executor_service_method_shutdown_question
  #
  #   Is the executor shutdown?
  #
  #   @return [Boolean] `true` when shutdown, `false` when shutting down or running

  # @!macro executor_service_method_auto_terminate_question
  #
  #   Is the executor auto-terminate when the application exits?
  #
  #   @return [Boolean] `true` when auto-termination is enabled else `false`.

  # @!macro executor_service_method_auto_terminate_setter
  #
  #
  #   Set the auto-terminate behavior for this executor.
  #   @deprecated Has no effect
  #   @param [Boolean] value The new auto-terminate value to set for this executor.
  #   @return [Boolean] `true` when auto-termination is enabled else `false`.

  ###################################################################

  # @!macro abstract_executor_service_public_api
  #
  #   @!macro executor_service_public_api
  #
  #   @!attribute [r] fallback_policy
  #     @!macro executor_service_attr_reader_fallback_policy
  #
  #   @!method shutdown
  #     @!macro executor_service_method_shutdown
  #
  #   @!method kill
  #     @!macro executor_service_method_kill
  #
  #   @!method wait_for_termination(timeout = nil)
  #     @!macro executor_service_method_wait_for_termination
  #
  #   @!method running?
  #     @!macro executor_service_method_running_question
  #
  #   @!method shuttingdown?
  #     @!macro executor_service_method_shuttingdown_question
  #
  #   @!method shutdown?
  #     @!macro executor_service_method_shutdown_question
  #
  #   @!method auto_terminate?
  #     @!macro executor_service_method_auto_terminate_question
  #
  #   @!method auto_terminate=(value)
  #     @!macro executor_service_method_auto_terminate_setter

  ###################################################################

  # @!macro executor_service_public_api
  # @!visibility private
  module ExecutorService
    include Concern::Logging

    # @!macro executor_service_method_post
    def post(*args, &task)
      raise NotImplementedError
    end

    # @!macro executor_service_method_left_shift
    def <<(task)
      post(&task)
      self
    end

    # @!macro executor_service_method_can_overflow_question
    #
    # @note Always returns `false`
    def can_overflow?
      false
    end

    # @!macro executor_service_method_serialized_question
    #
    # @note Always returns `false`
    def serialized?
      false
    end
  end
end
