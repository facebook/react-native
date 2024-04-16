if Concurrent.on_jruby?

  require 'concurrent/executor/java_executor_service'
  require 'concurrent/executor/serial_executor_service'

  module Concurrent

    # @!macro single_thread_executor
    # @!macro abstract_executor_service_public_api
    # @!visibility private
    class JavaSingleThreadExecutor < JavaExecutorService
      include SerialExecutorService

      # @!macro single_thread_executor_method_initialize
      def initialize(opts = {})
        super(opts)
      end

      private

      def ns_initialize(opts)
        @executor = java.util.concurrent.Executors.newSingleThreadExecutor(
            DaemonThreadFactory.new(ns_auto_terminate?)
        )
        @fallback_policy = opts.fetch(:fallback_policy, :discard)
        raise ArgumentError.new("#{@fallback_policy} is not a valid fallback policy") unless FALLBACK_POLICY_CLASSES.keys.include?(@fallback_policy)
      end
    end
  end
end
