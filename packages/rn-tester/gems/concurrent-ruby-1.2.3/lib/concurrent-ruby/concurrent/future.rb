require 'thread'
require 'concurrent/constants'
require 'concurrent/errors'
require 'concurrent/ivar'
require 'concurrent/executor/safe_task_executor'

require 'concurrent/options'

# TODO (pitr-ch 14-Mar-2017): deprecate, Future, Promise, etc.


module Concurrent

  # {include:file:docs-source/future.md}
  #
  # @!macro copy_options
  #
  # @see http://ruby-doc.org/stdlib-2.1.1/libdoc/observer/rdoc/Observable.html Ruby Observable module
  # @see http://clojuredocs.org/clojure_core/clojure.core/future Clojure's future function
  # @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Future.html java.util.concurrent.Future
  class Future < IVar

    # Create a new `Future` in the `:unscheduled` state.
    #
    # @yield the asynchronous operation to perform
    #
    # @!macro executor_and_deref_options
    #
    # @option opts [object, Array] :args zero or more arguments to be passed the task
    #   block on execution
    #
    # @raise [ArgumentError] if no block is given
    def initialize(opts = {}, &block)
      raise ArgumentError.new('no block given') unless block_given?
      super(NULL, opts.merge(__task_from_block__: block), &nil)
    end

    # Execute an `:unscheduled` `Future`. Immediately sets the state to `:pending` and
    # passes the block to a new thread/thread pool for eventual execution.
    # Does nothing if the `Future` is in any state other than `:unscheduled`.
    #
    # @return [Future] a reference to `self`
    #
    # @example Instance and execute in separate steps
    #   future = Concurrent::Future.new{ sleep(1); 42 }
    #   future.state #=> :unscheduled
    #   future.execute
    #   future.state #=> :pending
    #
    # @example Instance and execute in one line
    #   future = Concurrent::Future.new{ sleep(1); 42 }.execute
    #   future.state #=> :pending
    def execute
      if compare_and_set_state(:pending, :unscheduled)
        @executor.post{ safe_execute(@task, @args) }
        self
      end
    end

    # Create a new `Future` object with the given block, execute it, and return the
    # `:pending` object.
    #
    # @yield the asynchronous operation to perform
    #
    # @!macro executor_and_deref_options
    #
    # @option opts [object, Array] :args zero or more arguments to be passed the task
    #   block on execution
    #
    # @raise [ArgumentError] if no block is given
    #
    # @return [Future] the newly created `Future` in the `:pending` state
    #
    # @example
    #   future = Concurrent::Future.execute{ sleep(1); 42 }
    #   future.state #=> :pending
    def self.execute(opts = {}, &block)
      Future.new(opts, &block).execute
    end

    # @!macro ivar_set_method
    def set(value = NULL, &block)
      check_for_block_or_value!(block_given?, value)
      synchronize do
        if @state != :unscheduled
          raise MultipleAssignmentError
        else
          @task = block || Proc.new { value }
        end
      end
      execute
    end

    # Attempt to cancel the operation if it has not already processed.
    # The operation can only be cancelled while still `pending`. It cannot
    # be cancelled once it has begun processing or has completed.
    #
    # @return [Boolean] was the operation successfully cancelled.
    def cancel
      if compare_and_set_state(:cancelled, :pending)
        complete(false, nil, CancelledOperationError.new)
        true
      else
        false
      end
    end

    # Has the operation been successfully cancelled?
    #
    # @return [Boolean]
    def cancelled?
      state == :cancelled
    end

    # Wait the given number of seconds for the operation to complete.
    # On timeout attempt to cancel the operation.
    #
    # @param [Numeric] timeout the maximum time in seconds to wait.
    # @return [Boolean] true if the operation completed before the timeout
    #   else false
    def wait_or_cancel(timeout)
      wait(timeout)
      if complete?
        true
      else
        cancel
        false
      end
    end

    protected

    def ns_initialize(value, opts)
      super
      @state = :unscheduled
      @task = opts[:__task_from_block__]
      @executor = Options.executor_from_options(opts) || Concurrent.global_io_executor
      @args = get_arguments_from(opts)
    end
  end
end
