require 'concurrent/utility/engine'

if Concurrent.on_jruby?
  require 'concurrent/errors'
  require 'concurrent/executor/abstract_executor_service'

  module Concurrent

    # @!macro abstract_executor_service_public_api
    # @!visibility private
    class JavaExecutorService < AbstractExecutorService
      java_import 'java.lang.Runnable'

      FALLBACK_POLICY_CLASSES = {
        abort:       java.util.concurrent.ThreadPoolExecutor::AbortPolicy,
        discard:     java.util.concurrent.ThreadPoolExecutor::DiscardPolicy,
        caller_runs: java.util.concurrent.ThreadPoolExecutor::CallerRunsPolicy
      }.freeze
      private_constant :FALLBACK_POLICY_CLASSES

      def post(*args, &task)
        raise ArgumentError.new('no block given') unless block_given?
        return fallback_action(*args, &task).call unless running?
        @executor.submit Job.new(args, task)
        true
      rescue Java::JavaUtilConcurrent::RejectedExecutionException
        raise RejectedExecutionError
      end

      def wait_for_termination(timeout = nil)
        if timeout.nil?
          ok = @executor.awaitTermination(60, java.util.concurrent.TimeUnit::SECONDS) until ok
          true
        else
          @executor.awaitTermination(1000 * timeout, java.util.concurrent.TimeUnit::MILLISECONDS)
        end
      end

      def shutdown
        synchronize do
          @executor.shutdown
          nil
        end
      end

      def kill
        synchronize do
          @executor.shutdownNow
          nil
        end
      end

      private

      def ns_running?
        !(ns_shuttingdown? || ns_shutdown?)
      end

      def ns_shuttingdown?
        if @executor.respond_to? :isTerminating
          @executor.isTerminating
        else
          false
        end
      end

      def ns_shutdown?
        @executor.isShutdown || @executor.isTerminated
      end

      class Job
        include Runnable
        def initialize(args, block)
          @args = args
          @block = block
        end

        def run
          @block.call(*@args)
        end
      end
      private_constant :Job
    end

    class DaemonThreadFactory
      # hide include from YARD
      send :include, java.util.concurrent.ThreadFactory

      def initialize(daemonize = true)
        @daemonize = daemonize
        @java_thread_factory = java.util.concurrent.Executors.defaultThreadFactory
      end

      def newThread(runnable)
        thread = @java_thread_factory.newThread(runnable)
        thread.setDaemon(@daemonize)
        return thread
      end
    end

    private_constant :DaemonThreadFactory

  end
end
