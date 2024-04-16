if Concurrent.on_jruby?

  require 'concurrent/executor/java_executor_service'

  module Concurrent

    # @!macro thread_pool_executor
    # @!macro thread_pool_options
    # @!visibility private
    class JavaThreadPoolExecutor < JavaExecutorService

      # @!macro thread_pool_executor_constant_default_max_pool_size
      DEFAULT_MAX_POOL_SIZE = java.lang.Integer::MAX_VALUE # 2147483647

      # @!macro thread_pool_executor_constant_default_min_pool_size
      DEFAULT_MIN_POOL_SIZE = 0

      # @!macro thread_pool_executor_constant_default_max_queue_size
      DEFAULT_MAX_QUEUE_SIZE = 0

      # @!macro thread_pool_executor_constant_default_thread_timeout
      DEFAULT_THREAD_IDLETIMEOUT = 60

      # @!macro thread_pool_executor_constant_default_synchronous
      DEFAULT_SYNCHRONOUS = false

      # @!macro thread_pool_executor_attr_reader_max_length
      attr_reader :max_length

      # @!macro thread_pool_executor_attr_reader_max_queue
      attr_reader :max_queue

      # @!macro thread_pool_executor_attr_reader_synchronous
      attr_reader :synchronous

      # @!macro thread_pool_executor_method_initialize
      def initialize(opts = {})
        super(opts)
      end

      # @!macro executor_service_method_can_overflow_question
      def can_overflow?
        @max_queue != 0
      end

      # @!macro thread_pool_executor_attr_reader_min_length
      def min_length
        @executor.getCorePoolSize
      end

      # @!macro thread_pool_executor_attr_reader_max_length
      def max_length
        @executor.getMaximumPoolSize
      end

      # @!macro thread_pool_executor_attr_reader_length
      def length
        @executor.getPoolSize
      end

      # @!macro thread_pool_executor_attr_reader_largest_length
      def largest_length
        @executor.getLargestPoolSize
      end

      # @!macro thread_pool_executor_attr_reader_scheduled_task_count
      def scheduled_task_count
        @executor.getTaskCount
      end

      # @!macro thread_pool_executor_attr_reader_completed_task_count
      def completed_task_count
        @executor.getCompletedTaskCount
      end

      # @!macro thread_pool_executor_method_active_count
      def active_count
        @executor.getActiveCount
      end

      # @!macro thread_pool_executor_attr_reader_idletime
      def idletime
        @executor.getKeepAliveTime(java.util.concurrent.TimeUnit::SECONDS)
      end

      # @!macro thread_pool_executor_attr_reader_queue_length
      def queue_length
        @executor.getQueue.size
      end

      # @!macro thread_pool_executor_attr_reader_remaining_capacity
      def remaining_capacity
        @max_queue == 0 ? -1 : @executor.getQueue.remainingCapacity
      end

      # @!macro executor_service_method_running_question
      def running?
        super && !@executor.isTerminating
      end

      # @!macro thread_pool_executor_method_prune_pool
      def prune_pool
      end

      private

      def ns_initialize(opts)
        min_length       = opts.fetch(:min_threads, DEFAULT_MIN_POOL_SIZE).to_i
        max_length       = opts.fetch(:max_threads, DEFAULT_MAX_POOL_SIZE).to_i
        idletime         = opts.fetch(:idletime, DEFAULT_THREAD_IDLETIMEOUT).to_i
        @max_queue       = opts.fetch(:max_queue, DEFAULT_MAX_QUEUE_SIZE).to_i
        @synchronous     = opts.fetch(:synchronous, DEFAULT_SYNCHRONOUS)
        @fallback_policy = opts.fetch(:fallback_policy, :abort)

        raise ArgumentError.new("`synchronous` cannot be set unless `max_queue` is 0") if @synchronous && @max_queue > 0
        raise ArgumentError.new("`max_threads` cannot be less than #{DEFAULT_MIN_POOL_SIZE}") if max_length < DEFAULT_MIN_POOL_SIZE
        raise ArgumentError.new("`max_threads` cannot be greater than #{DEFAULT_MAX_POOL_SIZE}") if max_length > DEFAULT_MAX_POOL_SIZE
        raise ArgumentError.new("`min_threads` cannot be less than #{DEFAULT_MIN_POOL_SIZE}") if min_length < DEFAULT_MIN_POOL_SIZE
        raise ArgumentError.new("`min_threads` cannot be more than `max_threads`") if min_length > max_length
        raise ArgumentError.new("#{fallback_policy} is not a valid fallback policy") unless FALLBACK_POLICY_CLASSES.include?(@fallback_policy)

        if @max_queue == 0
          if @synchronous
            queue = java.util.concurrent.SynchronousQueue.new
          else
            queue = java.util.concurrent.LinkedBlockingQueue.new
          end
        else
          queue = java.util.concurrent.LinkedBlockingQueue.new(@max_queue)
        end

        @executor = java.util.concurrent.ThreadPoolExecutor.new(
            min_length,
            max_length,
            idletime,
            java.util.concurrent.TimeUnit::SECONDS,
            queue,
            DaemonThreadFactory.new(ns_auto_terminate?),
            FALLBACK_POLICY_CLASSES[@fallback_policy].new)

      end
    end

  end
end
