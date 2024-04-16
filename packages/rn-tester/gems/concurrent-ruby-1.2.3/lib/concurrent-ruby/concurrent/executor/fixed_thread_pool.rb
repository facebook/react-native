require 'concurrent/utility/engine'
require 'concurrent/executor/thread_pool_executor'

module Concurrent

  # @!macro thread_pool_executor_constant_default_max_pool_size
  #   Default maximum number of threads that will be created in the pool.

  # @!macro thread_pool_executor_constant_default_min_pool_size
  #   Default minimum number of threads that will be retained in the pool.

  # @!macro thread_pool_executor_constant_default_max_queue_size
  #   Default maximum number of tasks that may be added to the task queue.

  # @!macro thread_pool_executor_constant_default_thread_timeout
  #   Default maximum number of seconds a thread in the pool may remain idle
  #   before being reclaimed.

  # @!macro thread_pool_executor_constant_default_synchronous
  #   Default value of the :synchronous option.

  # @!macro thread_pool_executor_attr_reader_max_length
  #   The maximum number of threads that may be created in the pool.
  #   @return [Integer] The maximum number of threads that may be created in the pool.

  # @!macro thread_pool_executor_attr_reader_min_length
  #   The minimum number of threads that may be retained in the pool.
  #   @return [Integer] The minimum number of threads that may be retained in the pool.

  # @!macro thread_pool_executor_attr_reader_largest_length
  #   The largest number of threads that have been created in the pool since construction.
  #   @return [Integer] The largest number of threads that have been created in the pool since construction.

  # @!macro thread_pool_executor_attr_reader_scheduled_task_count
  #   The number of tasks that have been scheduled for execution on the pool since construction.
  #   @return [Integer] The number of tasks that have been scheduled for execution on the pool since construction.

  # @!macro thread_pool_executor_attr_reader_completed_task_count
  #   The number of tasks that have been completed by the pool since construction.
  #   @return [Integer] The number of tasks that have been completed by the pool since construction.

  # @!macro thread_pool_executor_method_active_count
  #   The number of threads that are actively executing tasks.
  #   @return [Integer] The number of threads that are actively executing tasks.

  # @!macro thread_pool_executor_attr_reader_idletime
  #   The number of seconds that a thread may be idle before being reclaimed.
  #   @return [Integer] The number of seconds that a thread may be idle before being reclaimed.

  # @!macro thread_pool_executor_attr_reader_synchronous
  #   Whether or not a value of 0 for :max_queue option means the queue must perform direct hand-off or rather unbounded queue.
  #   @return [true, false]

  # @!macro thread_pool_executor_attr_reader_max_queue
  #   The maximum number of tasks that may be waiting in the work queue at any one time.
  #   When the queue size reaches `max_queue` subsequent tasks will be rejected in
  #   accordance with the configured `fallback_policy`.
  #
  #   @return [Integer] The maximum number of tasks that may be waiting in the work queue at any one time.
  #     When the queue size reaches `max_queue` subsequent tasks will be rejected in
  #     accordance with the configured `fallback_policy`.

  # @!macro thread_pool_executor_attr_reader_length
  #   The number of threads currently in the pool.
  #   @return [Integer] The number of threads currently in the pool.

  # @!macro thread_pool_executor_attr_reader_queue_length
  #   The number of tasks in the queue awaiting execution.
  #   @return [Integer] The number of tasks in the queue awaiting execution.

  # @!macro thread_pool_executor_attr_reader_remaining_capacity
  #   Number of tasks that may be enqueued before reaching `max_queue` and rejecting
  #   new tasks. A value of -1 indicates that the queue may grow without bound.
  #
  #   @return [Integer] Number of tasks that may be enqueued before reaching `max_queue` and rejecting
  #     new tasks. A value of -1 indicates that the queue may grow without bound.

  # @!macro thread_pool_executor_method_prune_pool
  #   Prune the thread pool of unneeded threads
  #
  #   What is being pruned is controlled by the min_threads and idletime
  #   parameters passed at pool creation time
  #
  #   This is a no-op on some pool implementation (e.g. the Java one).  The Ruby
  #   pool will auto-prune each time a new job is posted. You will need to call
  #   this method explicitely in case your application post jobs in bursts (a
  #   lot of jobs and then nothing for long periods)

  # @!macro thread_pool_executor_public_api
  #
  #   @!macro abstract_executor_service_public_api
  #
  #   @!attribute [r] max_length
  #     @!macro thread_pool_executor_attr_reader_max_length
  #
  #   @!attribute [r] min_length
  #     @!macro thread_pool_executor_attr_reader_min_length
  #
  #   @!attribute [r] largest_length
  #     @!macro thread_pool_executor_attr_reader_largest_length
  #
  #   @!attribute [r] scheduled_task_count
  #     @!macro thread_pool_executor_attr_reader_scheduled_task_count
  #
  #   @!attribute [r] completed_task_count
  #     @!macro thread_pool_executor_attr_reader_completed_task_count
  #
  #   @!attribute [r] idletime
  #     @!macro thread_pool_executor_attr_reader_idletime
  #
  #   @!attribute [r] max_queue
  #     @!macro thread_pool_executor_attr_reader_max_queue
  #
  #   @!attribute [r] length
  #     @!macro thread_pool_executor_attr_reader_length
  #
  #   @!attribute [r] queue_length
  #     @!macro thread_pool_executor_attr_reader_queue_length
  #
  #   @!attribute [r] remaining_capacity
  #     @!macro thread_pool_executor_attr_reader_remaining_capacity
  #
  #   @!method can_overflow?
  #     @!macro executor_service_method_can_overflow_question
  #
  #   @!method prune_pool
  #     @!macro thread_pool_executor_method_prune_pool




  # @!macro thread_pool_options
  #
  #   **Thread Pool Options**
  #
  #   Thread pools support several configuration options:
  #
  #   * `idletime`: The number of seconds that a thread may be idle before being reclaimed.
  #   * `name`: The name of the executor (optional). Printed in the executor's `#to_s` output and
  #     a `<name>-worker-<id>` name is given to its threads if supported by used Ruby
  #     implementation. `<id>` is uniq for each thread.
  #   * `max_queue`: The maximum number of tasks that may be waiting in the work queue at
  #     any one time. When the queue size reaches `max_queue` and no new threads can be created,
  #     subsequent tasks will be rejected in accordance with the configured `fallback_policy`.
  #   * `auto_terminate`: When true (default), the threads started will be marked as daemon.
  #   * `fallback_policy`: The policy defining how rejected tasks are handled.
  #
  #   Three fallback policies are supported:
  #
  #   * `:abort`: Raise a `RejectedExecutionError` exception and discard the task.
  #   * `:discard`: Discard the task and return false.
  #   * `:caller_runs`: Execute the task on the calling thread.
  #
  #   **Shutting Down Thread Pools**
  #
  #   Killing a thread pool while tasks are still being processed, either by calling
  #   the `#kill` method or at application exit, will have unpredictable results. There
  #   is no way for the thread pool to know what resources are being used by the
  #   in-progress tasks. When those tasks are killed the impact on those resources
  #   cannot be predicted. The *best* practice is to explicitly shutdown all thread
  #   pools using the provided methods:
  #
  #   * Call `#shutdown` to initiate an orderly termination of all in-progress tasks
  #   * Call `#wait_for_termination` with an appropriate timeout interval an allow
  #     the orderly shutdown to complete
  #   * Call `#kill` *only when* the thread pool fails to shutdown in the allotted time
  #
  #   On some runtime platforms (most notably the JVM) the application will not
  #   exit until all thread pools have been shutdown. To prevent applications from
  #   "hanging" on exit, all threads can be marked as daemon according to the
  #   `:auto_terminate` option.
  #
  #   ```ruby
  #   pool1 = Concurrent::FixedThreadPool.new(5) # threads will be marked as daemon
  #   pool2 = Concurrent::FixedThreadPool.new(5, auto_terminate: false) # mark threads as non-daemon
  #   ```
  #
  #   @note Failure to properly shutdown a thread pool can lead to unpredictable results.
  #     Please read *Shutting Down Thread Pools* for more information.
  #
  #   @see http://docs.oracle.com/javase/tutorial/essential/concurrency/pools.html Java Tutorials: Thread Pools
  #   @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Executors.html Java Executors class
  #   @see http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html Java ExecutorService interface
  #   @see https://docs.oracle.com/javase/8/docs/api/java/lang/Thread.html#setDaemon-boolean-





  # @!macro fixed_thread_pool
  #
  #   A thread pool that reuses a fixed number of threads operating off an unbounded queue.
  #   At any point, at most `num_threads` will be active processing tasks. When all threads are busy new
  #   tasks `#post` to the thread pool are enqueued until a thread becomes available.
  #   Should a thread crash for any reason the thread will immediately be removed
  #   from the pool and replaced.
  #
  #   The API and behavior of this class are based on Java's `FixedThreadPool`
  #
  # @!macro thread_pool_options
  class FixedThreadPool < ThreadPoolExecutor

    # @!macro fixed_thread_pool_method_initialize
    #
    #   Create a new thread pool.
    #
    #   @param [Integer] num_threads the number of threads to allocate
    #   @param [Hash] opts the options defining pool behavior.
    #   @option opts [Symbol] :fallback_policy (`:abort`) the fallback policy
    #
    #   @raise [ArgumentError] if `num_threads` is less than or equal to zero
    #   @raise [ArgumentError] if `fallback_policy` is not a known policy
    #
    #   @see http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executors.html#newFixedThreadPool-int-
    def initialize(num_threads, opts = {})
      raise ArgumentError.new('number of threads must be greater than zero') if num_threads.to_i < 1
      defaults  = { max_queue:   DEFAULT_MAX_QUEUE_SIZE,
                    idletime:    DEFAULT_THREAD_IDLETIMEOUT }
      overrides = { min_threads: num_threads,
                    max_threads: num_threads }
      super(defaults.merge(opts).merge(overrides))
    end
  end
end
