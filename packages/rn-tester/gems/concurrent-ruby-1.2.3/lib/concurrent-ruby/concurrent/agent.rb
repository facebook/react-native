require 'concurrent/configuration'
require 'concurrent/atomic/atomic_reference'
require 'concurrent/atomic/count_down_latch'
require 'concurrent/atomic/thread_local_var'
require 'concurrent/collection/copy_on_write_observer_set'
require 'concurrent/concern/observable'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # `Agent` is inspired by Clojure's [agent](http://clojure.org/agents)
  # function. An agent is a shared, mutable variable providing independent,
  # uncoordinated, *asynchronous* change of individual values. Best used when
  # the value will undergo frequent, complex updates. Suitable when the result
  # of an update does not need to be known immediately. `Agent` is (mostly)
  # functionally equivalent to Clojure's agent, except where the runtime
  # prevents parity.
  #
  # Agents are reactive, not autonomous - there is no imperative message loop
  # and no blocking receive. The state of an Agent should be itself immutable
  # and the `#value` of an Agent is always immediately available for reading by
  # any thread without any messages, i.e. observation does not require
  # cooperation or coordination.
  #
  # Agent action dispatches are made using the various `#send` methods. These
  # methods always return immediately. At some point later, in another thread,
  # the following will happen:
  #
  # 1. The given `action` will be applied to the state of the Agent and the
  #    `args`, if any were supplied.
  # 2. The return value of `action` will be passed to the validator lambda,
  #    if one has been set on the Agent.
  # 3. If the validator succeeds or if no validator was given, the return value
  #    of the given `action` will become the new `#value` of the Agent. See
  #    `#initialize` for details.
  # 4. If any observers were added to the Agent, they will be notified. See
  #    `#add_observer` for details.
  # 5. If during the `action` execution any other dispatches are made (directly
  #    or indirectly), they will be held until after the `#value` of the Agent
  #    has been changed.
  #
  # If any exceptions are thrown by an action function, no nested dispatches
  # will occur, and the exception will be cached in the Agent itself. When an
  # Agent has errors cached, any subsequent interactions will immediately throw
  # an exception, until the agent's errors are cleared. Agent errors can be
  # examined with `#error` and the agent restarted with `#restart`.
  #
  # The actions of all Agents get interleaved amongst threads in a thread pool.
  # At any point in time, at most one action for each Agent is being executed.
  # Actions dispatched to an agent from another single agent or thread will
  # occur in the order they were sent, potentially interleaved with actions
  # dispatched to the same agent from other sources. The `#send` method should
  # be used for actions that are CPU limited, while the `#send_off` method is
  # appropriate for actions that may block on IO.
  #
  # Unlike in Clojure, `Agent` cannot participate in `Concurrent::TVar` transactions.
  #
  # ## Example
  #
  # ```
  # def next_fibonacci(set = nil)
  #   return [0, 1] if set.nil?
  #   set + [set[-2..-1].reduce{|sum,x| sum + x }]
  # end
  #
  # # create an agent with an initial value
  # agent = Concurrent::Agent.new(next_fibonacci)
  #
  # # send a few update requests
  # 5.times do
  #   agent.send{|set| next_fibonacci(set) }
  # end
  #
  # # wait for them to complete
  # agent.await
  #
  # # get the current value
  # agent.value #=> [0, 1, 1, 2, 3, 5, 8]
  # ```
  #
  # ## Observation
  #
  # Agents support observers through the {Concurrent::Observable} mixin module.
  # Notification of observers occurs every time an action dispatch returns and
  # the new value is successfully validated. Observation will *not* occur if the
  # action raises an exception, if validation fails, or when a {#restart} occurs.
  #
  # When notified the observer will receive three arguments: `time`, `old_value`,
  # and `new_value`. The `time` argument is the time at which the value change
  # occurred. The `old_value` is the value of the Agent when the action began
  # processing. The `new_value` is the value to which the Agent was set when the
  # action completed. Note that `old_value` and `new_value` may be the same.
  # This is not an error. It simply means that the action returned the same
  # value.
  #
  # ## Nested Actions
  #
  # It is possible for an Agent action to post further actions back to itself.
  # The nested actions will be enqueued normally then processed *after* the
  # outer action completes, in the order they were sent, possibly interleaved
  # with action dispatches from other threads. Nested actions never deadlock
  # with one another and a failure in a nested action will never affect the
  # outer action.
  #
  # Nested actions can be called using the Agent reference from the enclosing
  # scope or by passing the reference in as a "send" argument. Nested actions
  # cannot be post using `self` from within the action block/proc/lambda; `self`
  # in this context will not reference the Agent. The preferred method for
  # dispatching nested actions is to pass the Agent as an argument. This allows
  # Ruby to more effectively manage the closing scope.
  #
  # Prefer this:
  #
  # ```
  # agent = Concurrent::Agent.new(0)
  # agent.send(agent) do |value, this|
  #   this.send {|v| v + 42 }
  #   3.14
  # end
  # agent.value #=> 45.14
  # ```
  #
  # Over this:
  #
  # ```
  # agent = Concurrent::Agent.new(0)
  # agent.send do |value|
  #   agent.send {|v| v + 42 }
  #   3.14
  # end
  # ```
  #
  # @!macro agent_await_warning
  #
  #   **NOTE** Never, *under any circumstances*, call any of the "await" methods
  #   ({#await}, {#await_for}, {#await_for!}, and {#wait}) from within an action
  #   block/proc/lambda. The call will block the Agent and will always fail.
  #   Calling either {#await} or {#wait} (with a timeout of `nil`) will
  #   hopelessly deadlock the Agent with no possibility of recovery.
  #
  # @!macro thread_safe_variable_comparison
  #
  # @see http://clojure.org/Agents Clojure Agents
  # @see http://clojure.org/state Values and Change - Clojure's approach to Identity and State
  class Agent < Synchronization::LockableObject
    include Concern::Observable

    ERROR_MODES = [:continue, :fail].freeze
    private_constant :ERROR_MODES

    AWAIT_FLAG = ::Object.new
    private_constant :AWAIT_FLAG

    AWAIT_ACTION = ->(value, latch) { latch.count_down; AWAIT_FLAG }
    private_constant :AWAIT_ACTION

    DEFAULT_ERROR_HANDLER = ->(agent, error) { nil }
    private_constant :DEFAULT_ERROR_HANDLER

    DEFAULT_VALIDATOR = ->(value) { true }
    private_constant :DEFAULT_VALIDATOR

    Job = Struct.new(:action, :args, :executor, :caller)
    private_constant :Job

    # Raised during action processing or any other time in an Agent's lifecycle.
    class Error < StandardError
      def initialize(message = nil)
        message ||= 'agent must be restarted before jobs can post'
        super(message)
      end
    end

    # Raised when a new value obtained during action processing or at `#restart`
    # fails validation.
    class ValidationError < Error
      def initialize(message = nil)
        message ||= 'invalid value'
        super(message)
      end
    end

    # The error mode this Agent is operating in. See {#initialize} for details.
    attr_reader :error_mode

    # Create a new `Agent` with the given initial value and options.
    #
    # The `:validator` option must be `nil` or a side-effect free proc/lambda
    # which takes one argument. On any intended value change the validator, if
    # provided, will be called. If the new value is invalid the validator should
    # return `false` or raise an error.
    #
    # The `:error_handler` option must be `nil` or a proc/lambda which takes two
    # arguments. When an action raises an error or validation fails, either by
    # returning false or raising an error, the error handler will be called. The
    # arguments to the error handler will be a reference to the agent itself and
    # the error object which was raised.
    #
    # The `:error_mode` may be either `:continue` (the default if an error
    # handler is given) or `:fail` (the default if error handler nil or not
    # given).
    #
    # If an action being run by the agent throws an error or doesn't pass
    # validation the error handler, if present, will be called. After the
    # handler executes if the error mode is `:continue` the Agent will continue
    # as if neither the action that caused the error nor the error itself ever
    # happened.
    #
    # If the mode is `:fail` the Agent will become {#failed?} and will stop
    # accepting new action dispatches. Any previously queued actions will be
    # held until {#restart} is called. The {#value} method will still work,
    # returning the value of the Agent before the error.
    #
    # @param [Object] initial the initial value
    # @param [Hash] opts the configuration options
    #
    # @option opts [Symbol] :error_mode either `:continue` or `:fail`
    # @option opts [nil, Proc] :error_handler the (optional) error handler
    # @option opts [nil, Proc] :validator the (optional) validation procedure
    def initialize(initial, opts = {})
      super()
      synchronize { ns_initialize(initial, opts) }
    end

    # The current value (state) of the Agent, irrespective of any pending or
    # in-progress actions. The value is always available and is non-blocking.
    #
    # @return [Object] the current value
    def value
      @current.value # TODO (pitr 12-Sep-2015): broken unsafe read?
    end

    alias_method :deref, :value

    # When {#failed?} and {#error_mode} is `:fail`, returns the error object
    # which caused the failure, else `nil`. When {#error_mode} is `:continue`
    # will *always* return `nil`.
    #
    # @return [nil, Error] the error which caused the failure when {#failed?}
    def error
      @error.value
    end

    alias_method :reason, :error

    # @!macro agent_send
    #
    #   Dispatches an action to the Agent and returns immediately. Subsequently,
    #   in a thread from a thread pool, the {#value} will be set to the return
    #   value of the action. Action dispatches are only allowed when the Agent
    #   is not {#failed?}.
    #
    #   The action must be a block/proc/lambda which takes 1 or more arguments.
    #   The first argument is the current {#value} of the Agent. Any arguments
    #   passed to the send method via the `args` parameter will be passed to the
    #   action as the remaining arguments. The action must return the new value
    #   of the Agent.
    #
    #   * {#send} and {#send!} should be used for actions that are CPU limited
    #   * {#send_off}, {#send_off!}, and {#<<} are appropriate for actions that
    #     may block on IO
    #   * {#send_via} and {#send_via!} are used when a specific executor is to
    #     be used for the action
    #
    #   @param [Array<Object>] args zero or more arguments to be passed to
    #     the action
    #   @param [Proc] action the action dispatch to be enqueued
    #
    #   @yield [agent, value, *args] process the old value and return the new
    #   @yieldparam [Object] value the current {#value} of the Agent
    #   @yieldparam [Array<Object>] args zero or more arguments to pass to the
    #     action
    #   @yieldreturn [Object] the new value of the Agent
    #
    # @!macro send_return
    #   @return [Boolean] true if the action is successfully enqueued, false if
    #     the Agent is {#failed?}
    def send(*args, &action)
      enqueue_action_job(action, args, Concurrent.global_fast_executor)
    end

    # @!macro agent_send
    #
    # @!macro send_bang_return_and_raise
    #   @return [Boolean] true if the action is successfully enqueued
    #   @raise [Concurrent::Agent::Error] if the Agent is {#failed?}
    def send!(*args, &action)
      raise Error.new unless send(*args, &action)
      true
    end

    # @!macro agent_send
    # @!macro send_return
    def send_off(*args, &action)
      enqueue_action_job(action, args, Concurrent.global_io_executor)
    end

    alias_method :post, :send_off

    # @!macro agent_send
    # @!macro send_bang_return_and_raise
    def send_off!(*args, &action)
      raise Error.new unless send_off(*args, &action)
      true
    end

    # @!macro agent_send
    # @!macro send_return
    # @param [Concurrent::ExecutorService] executor the executor on which the
    #   action is to be dispatched
    def send_via(executor, *args, &action)
      enqueue_action_job(action, args, executor)
    end

    # @!macro agent_send
    # @!macro send_bang_return_and_raise
    # @param [Concurrent::ExecutorService] executor the executor on which the
    #   action is to be dispatched
    def send_via!(executor, *args, &action)
      raise Error.new unless send_via(executor, *args, &action)
      true
    end

    # Dispatches an action to the Agent and returns immediately. Subsequently,
    # in a thread from a thread pool, the {#value} will be set to the return
    # value of the action. Appropriate for actions that may block on IO.
    #
    # @param [Proc] action the action dispatch to be enqueued
    # @return [Concurrent::Agent] self
    # @see #send_off
    def <<(action)
      send_off(&action)
      self
    end

    # Blocks the current thread (indefinitely!) until all actions dispatched
    # thus far, from this thread or nested by the Agent, have occurred. Will
    # block when {#failed?}. Will never return if a failed Agent is {#restart}
    # with `:clear_actions` true.
    #
    # Returns a reference to `self` to support method chaining:
    #
    # ```
    # current_value = agent.await.value
    # ```
    #
    # @return [Boolean] self
    #
    # @!macro agent_await_warning
    def await
      wait(nil)
      self
    end

    # Blocks the current thread until all actions dispatched thus far, from this
    # thread or nested by the Agent, have occurred, or the timeout (in seconds)
    # has elapsed.
    #
    # @param [Float] timeout the maximum number of seconds to wait
    # @return [Boolean] true if all actions complete before timeout else false
    #
    # @!macro agent_await_warning
    def await_for(timeout)
      wait(timeout.to_f)
    end

    # Blocks the current thread until all actions dispatched thus far, from this
    # thread or nested by the Agent, have occurred, or the timeout (in seconds)
    # has elapsed.
    #
    # @param [Float] timeout the maximum number of seconds to wait
    # @return [Boolean] true if all actions complete before timeout
    #
    # @raise [Concurrent::TimeoutError] when timout is reached
    #
    # @!macro agent_await_warning
    def await_for!(timeout)
      raise Concurrent::TimeoutError unless wait(timeout.to_f)
      true
    end

    # Blocks the current thread until all actions dispatched thus far, from this
    # thread or nested by the Agent, have occurred, or the timeout (in seconds)
    # has elapsed. Will block indefinitely when timeout is nil or not given.
    #
    # Provided mainly for consistency with other classes in this library. Prefer
    # the various `await` methods instead.
    #
    # @param [Float] timeout the maximum number of seconds to wait
    # @return [Boolean] true if all actions complete before timeout else false
    #
    # @!macro agent_await_warning
    def wait(timeout = nil)
      latch = Concurrent::CountDownLatch.new(1)
      enqueue_await_job(latch)
      latch.wait(timeout)
    end

    # Is the Agent in a failed state?
    #
    # @see #restart
    def failed?
      !@error.value.nil?
    end

    alias_method :stopped?, :failed?

    # When an Agent is {#failed?}, changes the Agent {#value} to `new_value`
    # then un-fails the Agent so that action dispatches are allowed again. If
    # the `:clear_actions` option is give and true, any actions queued on the
    # Agent that were being held while it was failed will be discarded,
    # otherwise those held actions will proceed. The `new_value` must pass the
    # validator if any, or `restart` will raise an exception and the Agent will
    # remain failed with its old {#value} and {#error}. Observers, if any, will
    # not be notified of the new state.
    #
    # @param [Object] new_value the new value for the Agent once restarted
    # @param [Hash] opts the configuration options
    # @option opts [Symbol] :clear_actions true if all enqueued but unprocessed
    #   actions should be discarded on restart, else false (default: false)
    # @return [Boolean] true
    #
    # @raise [Concurrent:AgentError] when not failed
    def restart(new_value, opts = {})
      clear_actions = opts.fetch(:clear_actions, false)
      synchronize do
        raise Error.new('agent is not failed') unless failed?
        raise ValidationError unless ns_validate(new_value)
        @current.value = new_value
        @error.value   = nil
        @queue.clear if clear_actions
        ns_post_next_job unless @queue.empty?
      end
      true
    end

    class << self

      # Blocks the current thread (indefinitely!) until all actions dispatched
      # thus far to all the given Agents, from this thread or nested by the
      # given Agents, have occurred. Will block when any of the agents are
      # failed. Will never return if a failed Agent is restart with
      # `:clear_actions` true.
      #
      # @param [Array<Concurrent::Agent>] agents the Agents on which to wait
      # @return [Boolean] true
      #
      # @!macro agent_await_warning
      def await(*agents)
        agents.each { |agent| agent.await }
        true
      end

      # Blocks the current thread until all actions dispatched thus far to all
      # the given Agents, from this thread or nested by the given Agents, have
      # occurred, or the timeout (in seconds) has elapsed.
      #
      # @param [Float] timeout the maximum number of seconds to wait
      # @param [Array<Concurrent::Agent>] agents the Agents on which to wait
      # @return [Boolean] true if all actions complete before timeout else false
      #
      # @!macro agent_await_warning
      def await_for(timeout, *agents)
        end_at = Concurrent.monotonic_time + timeout.to_f
        ok     = agents.length.times do |i|
          break false if (delay = end_at - Concurrent.monotonic_time) < 0
          break false unless agents[i].await_for(delay)
        end
        !!ok
      end

      # Blocks the current thread until all actions dispatched thus far to all
      # the given Agents, from this thread or nested by the given Agents, have
      # occurred, or the timeout (in seconds) has elapsed.
      #
      # @param [Float] timeout the maximum number of seconds to wait
      # @param [Array<Concurrent::Agent>] agents the Agents on which to wait
      # @return [Boolean] true if all actions complete before timeout
      #
      # @raise [Concurrent::TimeoutError] when timout is reached
      # @!macro agent_await_warning
      def await_for!(timeout, *agents)
        raise Concurrent::TimeoutError unless await_for(timeout, *agents)
        true
      end
    end

    private

    def ns_initialize(initial, opts)
      @error_mode    = opts[:error_mode]
      @error_handler = opts[:error_handler]

      if @error_mode && !ERROR_MODES.include?(@error_mode)
        raise ArgumentError.new('unrecognized error mode')
      elsif @error_mode.nil?
        @error_mode = @error_handler ? :continue : :fail
      end

      @error_handler ||= DEFAULT_ERROR_HANDLER
      @validator     = opts.fetch(:validator, DEFAULT_VALIDATOR)
      @current       = Concurrent::AtomicReference.new(initial)
      @error         = Concurrent::AtomicReference.new(nil)
      @caller        = Concurrent::ThreadLocalVar.new(nil)
      @queue         = []

      self.observers = Collection::CopyOnNotifyObserverSet.new
    end

    def enqueue_action_job(action, args, executor)
      raise ArgumentError.new('no action given') unless action
      job = Job.new(action, args, executor, @caller.value || Thread.current.object_id)
      synchronize { ns_enqueue_job(job) }
    end

    def enqueue_await_job(latch)
      synchronize do
        if (index = ns_find_last_job_for_thread)
          job = Job.new(AWAIT_ACTION, [latch], Concurrent.global_immediate_executor,
                        Thread.current.object_id)
          ns_enqueue_job(job, index+1)
        else
          latch.count_down
          true
        end
      end
    end

    def ns_enqueue_job(job, index = nil)
      # a non-nil index means this is an await job
      return false if index.nil? && failed?
      index ||= @queue.length
      @queue.insert(index, job)
      # if this is the only job, post to executor
      ns_post_next_job if @queue.length == 1
      true
    end

    def ns_post_next_job
      @queue.first.executor.post { execute_next_job }
    end

    def execute_next_job
      job       = synchronize { @queue.first }
      old_value = @current.value

      @caller.value = job.caller # for nested actions
      new_value     = job.action.call(old_value, *job.args)
      @caller.value = nil

      return if new_value == AWAIT_FLAG

      if ns_validate(new_value)
        @current.value = new_value
        observers.notify_observers(Time.now, old_value, new_value)
      else
        handle_error(ValidationError.new)
      end
    rescue => error
      handle_error(error)
    ensure
      synchronize do
        @queue.shift
        unless failed? || @queue.empty?
          ns_post_next_job
        end
      end
    end

    def ns_validate(value)
      @validator.call(value)
    rescue
      false
    end

    def handle_error(error)
      # stop new jobs from posting
      @error.value = error if @error_mode == :fail
      @error_handler.call(self, error)
    rescue
      # do nothing
    end

    def ns_find_last_job_for_thread
      @queue.rindex { |job| job.caller == Thread.current.object_id }
    end
  end
end
