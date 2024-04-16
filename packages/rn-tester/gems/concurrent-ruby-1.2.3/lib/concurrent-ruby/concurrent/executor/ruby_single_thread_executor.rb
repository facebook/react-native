require 'concurrent/executor/ruby_thread_pool_executor'

module Concurrent

  # @!macro single_thread_executor
  # @!macro abstract_executor_service_public_api
  # @!visibility private
  class RubySingleThreadExecutor < RubyThreadPoolExecutor

    # @!macro single_thread_executor_method_initialize
    def initialize(opts = {})
      super(
        min_threads: 1,
        max_threads: 1,
        max_queue: 0,
        idletime: DEFAULT_THREAD_IDLETIMEOUT,
        fallback_policy: opts.fetch(:fallback_policy, :discard),
      )
    end
  end
end
