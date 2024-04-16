require 'concurrent/utility/engine'
require 'concurrent/executor/thread_pool_executor'

module Concurrent

  # A thread pool that dynamically grows and shrinks to fit the current workload.
  # New threads are created as needed, existing threads are reused, and threads
  # that remain idle for too long are killed and removed from the pool. These
  # pools are particularly suited to applications that perform a high volume of
  # short-lived tasks.
  #
  # On creation a `CachedThreadPool` has zero running threads. New threads are
  # created on the pool as new operations are `#post`. The size of the pool
  # will grow until `#max_length` threads are in the pool or until the number
  # of threads exceeds the number of running and pending operations. When a new
  # operation is post to the pool the first available idle thread will be tasked
  # with the new operation.
  #
  # Should a thread crash for any reason the thread will immediately be removed
  # from the pool. Similarly, threads which remain idle for an extended period
  # of time will be killed and reclaimed. Thus these thread pools are very
  # efficient at reclaiming unused resources.
  #
  # The API and behavior of this class are based on Java's `CachedThreadPool`
  #
  # @!macro thread_pool_options
  class CachedThreadPool < ThreadPoolExecutor

    # @!macro cached_thread_pool_method_initialize
    #
    #   Create a new thread pool.
    #
    #   @param [Hash] opts the options defining pool behavior.
    #   @option opts [Symbol] :fallback_policy (`:abort`) the fallback policy
    #
    #   @raise [ArgumentError] if `fallback_policy` is not a known policy
    #
    #   @see http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newCachedThreadPool--
    def initialize(opts = {})
      defaults  = { idletime: DEFAULT_THREAD_IDLETIMEOUT }
      overrides = { min_threads: 0,
                    max_threads: DEFAULT_MAX_POOL_SIZE,
                    max_queue:   DEFAULT_MAX_QUEUE_SIZE }
      super(defaults.merge(opts).merge(overrides))
    end

    private

    # @!macro cached_thread_pool_method_initialize
    # @!visibility private
    def ns_initialize(opts)
      super(opts)
      if Concurrent.on_jruby?
        @max_queue          = 0
        @executor           = java.util.concurrent.Executors.newCachedThreadPool(
            DaemonThreadFactory.new(ns_auto_terminate?))
        @executor.setRejectedExecutionHandler(FALLBACK_POLICY_CLASSES[@fallback_policy].new)
        @executor.setKeepAliveTime(opts.fetch(:idletime, DEFAULT_THREAD_IDLETIMEOUT), java.util.concurrent.TimeUnit::SECONDS)
      end
    end
  end
end
