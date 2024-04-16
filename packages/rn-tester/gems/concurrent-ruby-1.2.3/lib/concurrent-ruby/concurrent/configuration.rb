require 'thread'
require 'concurrent/delay'
require 'concurrent/errors'
require 'concurrent/concern/deprecation'
require 'concurrent/executor/immediate_executor'
require 'concurrent/executor/fixed_thread_pool'
require 'concurrent/executor/cached_thread_pool'
require 'concurrent/utility/processor_counter'

module Concurrent
  extend Concern::Deprecation

  autoload :Options, 'concurrent/options'
  autoload :TimerSet, 'concurrent/executor/timer_set'
  autoload :ThreadPoolExecutor, 'concurrent/executor/thread_pool_executor'

  # @!visibility private
  GLOBAL_FAST_EXECUTOR = Delay.new { Concurrent.new_fast_executor }
  private_constant :GLOBAL_FAST_EXECUTOR

  # @!visibility private
  GLOBAL_IO_EXECUTOR = Delay.new { Concurrent.new_io_executor }
  private_constant :GLOBAL_IO_EXECUTOR

  # @!visibility private
  GLOBAL_TIMER_SET = Delay.new { TimerSet.new }
  private_constant :GLOBAL_TIMER_SET

  # @!visibility private
  GLOBAL_IMMEDIATE_EXECUTOR = ImmediateExecutor.new
  private_constant :GLOBAL_IMMEDIATE_EXECUTOR

  # Disables AtExit handlers including pool auto-termination handlers.
  # When disabled it will be the application programmer's responsibility
  # to ensure that the handlers are shutdown properly prior to application
  # exit by calling `AtExit.run` method.
  #
  # @note this option should be needed only because of `at_exit` ordering
  #   issues which may arise when running some of the testing frameworks.
  #   E.g. Minitest's test-suite runs itself in `at_exit` callback which
  #   executes after the pools are already terminated. Then auto termination
  #   needs to be disabled and called manually after test-suite ends.
  # @note This method should *never* be called
  #   from within a gem. It should *only* be used from within the main
  #   application and even then it should be used only when necessary.
  # @deprecated Has no effect since it is no longer needed, see https://github.com/ruby-concurrency/concurrent-ruby/pull/841.
  #
  def self.disable_at_exit_handlers!
    deprecated "Method #disable_at_exit_handlers! has no effect since it is no longer needed, see https://github.com/ruby-concurrency/concurrent-ruby/pull/841."
  end

  # Global thread pool optimized for short, fast *operations*.
  #
  # @return [ThreadPoolExecutor] the thread pool
  def self.global_fast_executor
    GLOBAL_FAST_EXECUTOR.value!
  end

  # Global thread pool optimized for long, blocking (IO) *tasks*.
  #
  # @return [ThreadPoolExecutor] the thread pool
  def self.global_io_executor
    GLOBAL_IO_EXECUTOR.value!
  end

  def self.global_immediate_executor
    GLOBAL_IMMEDIATE_EXECUTOR
  end

  # Global thread pool user for global *timers*.
  #
  # @return [Concurrent::TimerSet] the thread pool
  def self.global_timer_set
    GLOBAL_TIMER_SET.value!
  end

  # General access point to global executors.
  # @param [Symbol, Executor] executor_identifier symbols:
  #   - :fast - {Concurrent.global_fast_executor}
  #   - :io - {Concurrent.global_io_executor}
  #   - :immediate - {Concurrent.global_immediate_executor}
  # @return [Executor]
  def self.executor(executor_identifier)
    Options.executor(executor_identifier)
  end

  def self.new_fast_executor(opts = {})
    FixedThreadPool.new(
        [2, Concurrent.processor_count].max,
        auto_terminate:  opts.fetch(:auto_terminate, true),
        idletime:        60, # 1 minute
        max_queue:       0, # unlimited
        fallback_policy: :abort, # shouldn't matter -- 0 max queue
        name:            "fast"
    )
  end

  def self.new_io_executor(opts = {})
    CachedThreadPool.new(
        auto_terminate:  opts.fetch(:auto_terminate, true),
        fallback_policy: :abort, # shouldn't matter -- 0 max queue
        name:            "io"
    )
  end
end
