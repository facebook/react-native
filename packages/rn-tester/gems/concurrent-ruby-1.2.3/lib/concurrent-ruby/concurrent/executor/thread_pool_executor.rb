require 'concurrent/utility/engine'
require 'concurrent/executor/ruby_thread_pool_executor'

module Concurrent

  if Concurrent.on_jruby?
    require 'concurrent/executor/java_thread_pool_executor'
  end

  ThreadPoolExecutorImplementation = case
                                     when Concurrent.on_jruby?
                                       JavaThreadPoolExecutor
                                     else
                                       RubyThreadPoolExecutor
                                     end
  private_constant :ThreadPoolExecutorImplementation

  # @!macro thread_pool_executor
  #
  #   An abstraction composed of one or more threads and a task queue. Tasks
  #   (blocks or `proc` objects) are submitted to the pool and added to the queue.
  #   The threads in the pool remove the tasks and execute them in the order
  #   they were received.
  #
  #   A `ThreadPoolExecutor` will automatically adjust the pool size according
  #   to the bounds set by `min-threads` and `max-threads`. When a new task is
  #   submitted and fewer than `min-threads` threads are running, a new thread
  #   is created to handle the request, even if other worker threads are idle.
  #   If there are more than `min-threads` but less than `max-threads` threads
  #   running, a new thread will be created only if the queue is full.
  #
  #   Threads that are idle for too long will be garbage collected, down to the
  #   configured minimum options. Should a thread crash it, too, will be garbage collected.
  #
  #   `ThreadPoolExecutor` is based on the Java class of the same name. From
  #   the official Java documentation;
  #
  #   > Thread pools address two different problems: they usually provide
  #   > improved performance when executing large numbers of asynchronous tasks,
  #   > due to reduced per-task invocation overhead, and they provide a means
  #   > of bounding and managing the resources, including threads, consumed
  #   > when executing a collection of tasks. Each ThreadPoolExecutor also
  #   > maintains some basic statistics, such as the number of completed tasks.
  #   >
  #   > To be useful across a wide range of contexts, this class provides many
  #   > adjustable parameters and extensibility hooks. However, programmers are
  #   > urged to use the more convenient Executors factory methods
  #   > [CachedThreadPool] (unbounded thread pool, with automatic thread reclamation),
  #   > [FixedThreadPool] (fixed size thread pool) and [SingleThreadExecutor] (single
  #   > background thread), that preconfigure settings for the most common usage
  #   > scenarios.
  #
  # @!macro thread_pool_options
  #
  # @!macro thread_pool_executor_public_api
  class ThreadPoolExecutor < ThreadPoolExecutorImplementation

    # @!macro thread_pool_executor_method_initialize
    #
    #   Create a new thread pool.
    #
    #   @param [Hash] opts the options which configure the thread pool.
    #
    #   @option opts [Integer] :max_threads (DEFAULT_MAX_POOL_SIZE) the maximum
    #     number of threads to be created
    #   @option opts [Integer] :min_threads (DEFAULT_MIN_POOL_SIZE) When a new task is submitted
    #      and fewer than `min_threads` are running, a new thread is created
    #   @option opts [Integer] :idletime (DEFAULT_THREAD_IDLETIMEOUT) the maximum
    #     number of seconds a thread may be idle before being reclaimed
    #   @option opts [Integer] :max_queue (DEFAULT_MAX_QUEUE_SIZE) the maximum
    #     number of tasks allowed in the work queue at any one time; a value of
    #     zero means the queue may grow without bound
    #   @option opts [Symbol] :fallback_policy (:abort) the policy for handling new
    #     tasks that are received when the queue size has reached
    #     `max_queue` or the executor has shut down
    #   @option opts [Boolean] :synchronous (DEFAULT_SYNCHRONOUS) whether or not a value of 0
    #     for :max_queue means the queue must perform direct hand-off rather than unbounded.
    #   @raise [ArgumentError] if `:max_threads` is less than one
    #   @raise [ArgumentError] if `:min_threads` is less than zero
    #   @raise [ArgumentError] if `:fallback_policy` is not one of the values specified
    #     in `FALLBACK_POLICIES`
    #
    #   @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ThreadPoolExecutor.html

    # @!method initialize(opts = {})
    #   @!macro thread_pool_executor_method_initialize
  end
end
