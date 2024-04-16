require 'concurrent/utility/engine'
require 'concurrent/executor/ruby_single_thread_executor'

module Concurrent

  if Concurrent.on_jruby?
    require 'concurrent/executor/java_single_thread_executor'
  end

  SingleThreadExecutorImplementation = case
                                       when Concurrent.on_jruby?
                                         JavaSingleThreadExecutor
                                       else
                                         RubySingleThreadExecutor
                                       end
  private_constant :SingleThreadExecutorImplementation

  # @!macro single_thread_executor
  #
  #   A thread pool with a single thread an unlimited queue. Should the thread
  #   die for any reason it will be removed and replaced, thus ensuring that
  #   the executor will always remain viable and available to process jobs.
  #
  #   A common pattern for background processing is to create a single thread
  #   on which an infinite loop is run. The thread's loop blocks on an input
  #   source (perhaps blocking I/O or a queue) and processes each input as it
  #   is received. This pattern has several issues. The thread itself is highly
  #   susceptible to errors during processing. Also, the thread itself must be
  #   constantly monitored and restarted should it die. `SingleThreadExecutor`
  #   encapsulates all these bahaviors. The task processor is highly resilient
  #   to errors from within tasks. Also, should the thread die it will
  #   automatically be restarted.
  #
  #   The API and behavior of this class are based on Java's `SingleThreadExecutor`.
  #
  # @!macro abstract_executor_service_public_api
  class SingleThreadExecutor < SingleThreadExecutorImplementation

    # @!macro single_thread_executor_method_initialize
    #
    #   Create a new thread pool.
    #
    #   @option opts [Symbol] :fallback_policy (:discard) the policy for handling new
    #     tasks that are received when the queue size has reached
    #     `max_queue` or the executor has shut down
    #
    #   @raise [ArgumentError] if `:fallback_policy` is not one of the values specified
    #     in `FALLBACK_POLICIES`
    #
    #   @see http://docs.oracle.com/javase/tutorial/essential/concurrency/pools.html
    #   @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Executors.html
    #   @see http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html

    # @!method initialize(opts = {})
    #   @!macro single_thread_executor_method_initialize
  end
end
