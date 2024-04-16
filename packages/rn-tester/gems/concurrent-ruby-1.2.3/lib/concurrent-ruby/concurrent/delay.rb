require 'thread'
require 'concurrent/concern/obligation'
require 'concurrent/executor/immediate_executor'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # This file has circular require issues. It must be autoloaded here.
  autoload :Options, 'concurrent/options'

  # Lazy evaluation of a block yielding an immutable result. Useful for
  # expensive operations that may never be needed. It may be non-blocking,
  # supports the `Concern::Obligation` interface, and accepts the injection of
  # custom executor upon which to execute the block. Processing of
  # block will be deferred until the first time `#value` is called.
  # At that time the caller can choose to return immediately and let
  # the block execute asynchronously, block indefinitely, or block
  # with a timeout.
  #
  # When a `Delay` is created its state is set to `pending`. The value and
  # reason are both `nil`. The first time the `#value` method is called the
  # enclosed opration will be run and the calling thread will block. Other
  # threads attempting to call `#value` will block as well. Once the operation
  # is complete the *value* will be set to the result of the operation or the
  # *reason* will be set to the raised exception, as appropriate. All threads
  # blocked on `#value` will return. Subsequent calls to `#value` will immediately
  # return the cached value. The operation will only be run once. This means that
  # any side effects created by the operation will only happen once as well.
  #
  # `Delay` includes the `Concurrent::Concern::Dereferenceable` mixin to support thread
  # safety of the reference returned by `#value`.
  #
  # @!macro copy_options
  #
  # @!macro delay_note_regarding_blocking
  #   @note The default behavior of `Delay` is to block indefinitely when
  #     calling either `value` or `wait`, executing the delayed operation on
  #     the current thread. This makes the `timeout` value completely
  #     irrelevant. To enable non-blocking behavior, use the `executor`
  #     constructor option. This will cause the delayed operation to be
  #     execute on the given executor, allowing the call to timeout.
  #
  # @see Concurrent::Concern::Dereferenceable
  class Delay < Synchronization::LockableObject
    include Concern::Obligation

    # NOTE: Because the global thread pools are lazy-loaded with these objects
    # there is a performance hit every time we post a new task to one of these
    # thread pools. Subsequently it is critical that `Delay` perform as fast
    # as possible post-completion. This class has been highly optimized using
    # the benchmark script `examples/lazy_and_delay.rb`. Do NOT attempt to
    # DRY-up this class or perform other refactoring with running the
    # benchmarks and ensuring that performance is not negatively impacted.

    # Create a new `Delay` in the `:pending` state.
    #
    # @!macro executor_and_deref_options
    #
    # @yield the delayed operation to perform
    #
    # @raise [ArgumentError] if no block is given
    def initialize(opts = {}, &block)
      raise ArgumentError.new('no block given') unless block_given?
      super(&nil)
      synchronize { ns_initialize(opts, &block) }
    end

    # Return the value this object represents after applying the options
    # specified by the `#set_deref_options` method. If the delayed operation
    # raised an exception this method will return nil. The exception object
    # can be accessed via the `#reason` method.
    #
    # @param [Numeric] timeout the maximum number of seconds to wait
    # @return [Object] the current value of the object
    #
    # @!macro delay_note_regarding_blocking
    def value(timeout = nil)
      if @executor # TODO (pitr 12-Sep-2015): broken unsafe read?
        super
      else
        # this function has been optimized for performance and
        # should not be modified without running new benchmarks
        synchronize do
          execute = @evaluation_started = true unless @evaluation_started
          if execute
            begin
              set_state(true, @task.call, nil)
            rescue => ex
              set_state(false, nil, ex)
            end
          elsif incomplete?
            raise IllegalOperationError, 'Recursive call to #value during evaluation of the Delay'
          end
        end
        if @do_nothing_on_deref
          @value
        else
          apply_deref_options(@value)
        end
      end
    end

    # Return the value this object represents after applying the options
    # specified by the `#set_deref_options` method. If the delayed operation
    # raised an exception, this method will raise that exception (even when)
    # the operation has already been executed).
    #
    # @param [Numeric] timeout the maximum number of seconds to wait
    # @return [Object] the current value of the object
    # @raise [Exception] when `#rejected?` raises `#reason`
    #
    # @!macro delay_note_regarding_blocking
    def value!(timeout = nil)
      if @executor
        super
      else
        result = value
        raise @reason if @reason
        result
      end
    end

    # Return the value this object represents after applying the options
    # specified by the `#set_deref_options` method.
    #
    # @param [Integer] timeout (nil) the maximum number of seconds to wait for
    #   the value to be computed. When `nil` the caller will block indefinitely.
    #
    # @return [Object] self
    #
    # @!macro delay_note_regarding_blocking
    def wait(timeout = nil)
      if @executor
        execute_task_once
        super(timeout)
      else
        value
      end
      self
    end

    # Reconfigures the block returning the value if still `#incomplete?`
    #
    # @yield the delayed operation to perform
    # @return [true, false] if success
    def reconfigure(&block)
      synchronize do
        raise ArgumentError.new('no block given') unless block_given?
        unless @evaluation_started
          @task = block
          true
        else
          false
        end
      end
    end

    protected

    def ns_initialize(opts, &block)
      init_obligation
      set_deref_options(opts)
      @executor = opts[:executor]

      @task               = block
      @state              = :pending
      @evaluation_started = false
    end

    private

    # @!visibility private
    def execute_task_once # :nodoc:
      # this function has been optimized for performance and
      # should not be modified without running new benchmarks
      execute = task = nil
      synchronize do
        execute = @evaluation_started = true unless @evaluation_started
        task    = @task
      end

      if execute
        executor = Options.executor_from_options(executor: @executor)
        executor.post do
          begin
            result  = task.call
            success = true
          rescue => ex
            reason = ex
          end
          synchronize do
            set_state(success, result, reason)
            event.set
          end
        end
      end
    end
  end
end
