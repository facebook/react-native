require 'thread'
require 'concurrent/constants'
require 'concurrent/errors'
require 'concurrent/ivar'
require 'concurrent/executor/safe_task_executor'

require 'concurrent/options'

module Concurrent

  PromiseExecutionError = Class.new(StandardError)

  # Promises are inspired by the JavaScript [Promises/A](http://wiki.commonjs.org/wiki/Promises/A)
  # and [Promises/A+](http://promises-aplus.github.io/promises-spec/) specifications.
  #
  # > A promise represents the eventual value returned from the single
  # > completion of an operation.
  #
  # Promises are similar to futures and share many of the same behaviours.
  # Promises are far more robust, however. Promises can be chained in a tree
  # structure where each promise may have zero or more children. Promises are
  # chained using the `then` method. The result of a call to `then` is always
  # another promise. Promises are resolved asynchronously (with respect to the
  # main thread) but in a strict order: parents are guaranteed to be resolved
  # before their children, children before their younger siblings. The `then`
  # method takes two parameters: an optional block to be executed upon parent
  # resolution and an optional callable to be executed upon parent failure. The
  # result of each promise is passed to each of its children upon resolution.
  # When a promise is rejected all its children will be summarily rejected and
  # will receive the reason.
  #
  # Promises have several possible states: *:unscheduled*, *:pending*,
  # *:processing*, *:rejected*, or *:fulfilled*. These are also aggregated as
  # `#incomplete?` and `#complete?`. When a Promise is created it is set to
  # *:unscheduled*. Once the `#execute` method is called the state becomes
  # *:pending*. Once a job is pulled from the thread pool's queue and is given
  # to a thread for processing (often immediately upon `#post`) the state
  # becomes *:processing*. The future will remain in this state until processing
  # is complete. A future that is in the *:unscheduled*, *:pending*, or
  # *:processing* is considered `#incomplete?`. A `#complete?` Promise is either
  # *:rejected*, indicating that an exception was thrown during processing, or
  # *:fulfilled*, indicating success. If a Promise is *:fulfilled* its `#value`
  # will be updated to reflect the result of the operation. If *:rejected* the
  # `reason` will be updated with a reference to the thrown exception. The
  # predicate methods `#unscheduled?`, `#pending?`, `#rejected?`, and
  # `#fulfilled?` can be called at any time to obtain the state of the Promise,
  # as can the `#state` method, which returns a symbol.
  #
  # Retrieving the value of a promise is done through the `value` (alias:
  # `deref`) method. Obtaining the value of a promise is a potentially blocking
  # operation. When a promise is *rejected* a call to `value` will return `nil`
  # immediately. When a promise is *fulfilled* a call to `value` will
  # immediately return the current value. When a promise is *pending* a call to
  # `value` will block until the promise is either *rejected* or *fulfilled*. A
  # *timeout* value can be passed to `value` to limit how long the call will
  # block. If `nil` the call will block indefinitely. If `0` the call will not
  # block. Any other integer or float value will indicate the maximum number of
  # seconds to block.
  #
  # Promises run on the global thread pool.
  #
  # @!macro copy_options
  #
  # ### Examples
  #
  # Start by requiring promises
  #
  # ```ruby
  # require 'concurrent/promise'
  # ```
  #
  # Then create one
  #
  # ```ruby
  # p = Concurrent::Promise.execute do
  #       # do something
  #       42
  #     end
  # ```
  #
  # Promises can be chained using the `then` method. The `then` method accepts a
  # block and an executor, to be executed on fulfillment, and a callable argument to be executed
  # on rejection. The result of the each promise is passed as the block argument
  # to chained promises.
  #
  # ```ruby
  # p = Concurrent::Promise.new{10}.then{|x| x * 2}.then{|result| result - 10 }.execute
  # ```
  #
  # And so on, and so on, and so on...
  #
  # ```ruby
  # p = Concurrent::Promise.fulfill(20).
  #     then{|result| result - 10 }.
  #     then{|result| result * 3 }.
  #     then(executor: different_executor){|result| result % 5 }.execute
  # ```
  #
  # The initial state of a newly created Promise depends on the state of its parent:
  # - if parent is *unscheduled* the child will be *unscheduled*
  # - if parent is *pending* the child will be *pending*
  # - if parent is *fulfilled* the child will be *pending*
  # - if parent is *rejected* the child will be *pending* (but will ultimately be *rejected*)
  #
  # Promises are executed asynchronously from the main thread. By the time a
  # child Promise finishes intialization it may be in a different state than its
  # parent (by the time a child is created its parent may have completed
  # execution and changed state). Despite being asynchronous, however, the order
  # of execution of Promise objects in a chain (or tree) is strictly defined.
  #
  # There are multiple ways to create and execute a new `Promise`. Both ways
  # provide identical behavior:
  #
  # ```ruby
  # # create, operate, then execute
  # p1 = Concurrent::Promise.new{ "Hello World!" }
  # p1.state #=> :unscheduled
  # p1.execute
  #
  # # create and immediately execute
  # p2 = Concurrent::Promise.new{ "Hello World!" }.execute
  #
  # # execute during creation
  # p3 = Concurrent::Promise.execute{ "Hello World!" }
  # ```
  #
  # Once the `execute` method is called a `Promise` becomes `pending`:
  #
  # ```ruby
  # p = Concurrent::Promise.execute{ "Hello, world!" }
  # p.state    #=> :pending
  # p.pending? #=> true
  # ```
  #
  # Wait a little bit, and the promise will resolve and provide a value:
  #
  # ```ruby
  # p = Concurrent::Promise.execute{ "Hello, world!" }
  # sleep(0.1)
  #
  # p.state      #=> :fulfilled
  # p.fulfilled? #=> true
  # p.value      #=> "Hello, world!"
  # ```
  #
  # If an exception occurs, the promise will be rejected and will provide
  # a reason for the rejection:
  #
  # ```ruby
  # p = Concurrent::Promise.execute{ raise StandardError.new("Here comes the Boom!") }
  # sleep(0.1)
  #
  # p.state     #=> :rejected
  # p.rejected? #=> true
  # p.reason    #=> "#<StandardError: Here comes the Boom!>"
  # ```
  #
  # #### Rejection
  #
  # When a promise is rejected all its children will be rejected and will
  # receive the rejection `reason` as the rejection callable parameter:
  #
  # ```ruby
  # p = Concurrent::Promise.execute { Thread.pass; raise StandardError }
  #
  # c1 = p.then(-> reason { 42 })
  # c2 = p.then(-> reason { raise 'Boom!' })
  #
  # c1.wait.state  #=> :fulfilled
  # c1.value       #=> 45
  # c2.wait.state  #=> :rejected
  # c2.reason      #=> #<RuntimeError: Boom!>
  # ```
  #
  # Once a promise is rejected it will continue to accept children that will
  # receive immediately rejection (they will be executed asynchronously).
  #
  # #### Aliases
  #
  # The `then` method is the most generic alias: it accepts a block to be
  # executed upon parent fulfillment and a callable to be executed upon parent
  # rejection. At least one of them should be passed. The default block is `{
  # |result| result }` that fulfills the child with the parent value. The
  # default callable is `{ |reason| raise reason }` that rejects the child with
  # the parent reason.
  #
  # - `on_success { |result| ... }` is the same as `then {|result| ... }`
  # - `rescue { |reason| ... }` is the same as `then(Proc.new { |reason| ... } )`
  # - `rescue` is aliased by `catch` and `on_error`
  class Promise < IVar

    # Initialize a new Promise with the provided options.
    #
    # @!macro executor_and_deref_options
    #
    # @!macro promise_init_options
    #
    #   @option opts [Promise] :parent the parent `Promise` when building a chain/tree
    #   @option opts [Proc] :on_fulfill fulfillment handler
    #   @option opts [Proc] :on_reject rejection handler
    #   @option opts [object, Array] :args zero or more arguments to be passed
    #    the task block on execution
    #
    # @yield The block operation to be performed asynchronously.
    #
    # @raise [ArgumentError] if no block is given
    #
    # @see http://wiki.commonjs.org/wiki/Promises/A
    # @see http://promises-aplus.github.io/promises-spec/
    def initialize(opts = {}, &block)
      opts.delete_if { |k, v| v.nil? }
      super(NULL, opts.merge(__promise_body_from_block__: block), &nil)
    end

    # Create a new `Promise` and fulfill it immediately.
    #
    # @!macro executor_and_deref_options
    #
    # @!macro promise_init_options
    #
    # @raise [ArgumentError] if no block is given
    #
    # @return [Promise] the newly created `Promise`
    def self.fulfill(value, opts = {})
      Promise.new(opts).tap { |p| p.send(:synchronized_set_state!, true, value, nil) }
    end

    # Create a new `Promise` and reject it immediately.
    #
    # @!macro executor_and_deref_options
    #
    # @!macro promise_init_options
    #
    # @raise [ArgumentError] if no block is given
    #
    # @return [Promise] the newly created `Promise`
    def self.reject(reason, opts = {})
      Promise.new(opts).tap { |p| p.send(:synchronized_set_state!, false, nil, reason) }
    end

    # Execute an `:unscheduled` `Promise`. Immediately sets the state to `:pending` and
    # passes the block to a new thread/thread pool for eventual execution.
    # Does nothing if the `Promise` is in any state other than `:unscheduled`.
    #
    # @return [Promise] a reference to `self`
    def execute
      if root?
        if compare_and_set_state(:pending, :unscheduled)
          set_pending
          realize(@promise_body)
        end
      else
        compare_and_set_state(:pending, :unscheduled)
        @parent.execute
      end
      self
    end

    # @!macro ivar_set_method
    #
    # @raise [Concurrent::PromiseExecutionError] if not the root promise
    def set(value = NULL, &block)
      raise PromiseExecutionError.new('supported only on root promise') unless root?
      check_for_block_or_value!(block_given?, value)
      synchronize do
        if @state != :unscheduled
          raise MultipleAssignmentError
        else
          @promise_body = block || Proc.new { |result| value }
        end
      end
      execute
    end

    # @!macro ivar_fail_method
    #
    # @raise [Concurrent::PromiseExecutionError] if not the root promise
    def fail(reason = StandardError.new)
      set { raise reason }
    end

    # Create a new `Promise` object with the given block, execute it, and return the
    # `:pending` object.
    #
    # @!macro executor_and_deref_options
    #
    # @!macro promise_init_options
    #
    # @return [Promise] the newly created `Promise` in the `:pending` state
    #
    # @raise [ArgumentError] if no block is given
    #
    # @example
    #   promise = Concurrent::Promise.execute{ sleep(1); 42 }
    #   promise.state #=> :pending
    def self.execute(opts = {}, &block)
      new(opts, &block).execute
    end

    # Chain a new promise off the current promise.
    #
    # @return [Promise] the new promise
    # @yield The block operation to be performed asynchronously.
    # @overload then(rescuer, executor, &block)
    #   @param [Proc] rescuer An optional rescue block to be executed if the
    #     promise is rejected.
    #   @param [ThreadPool] executor An optional thread pool executor to be used
    #     in the new Promise
    # @overload then(rescuer, executor: executor, &block)
    #   @param [Proc] rescuer An optional rescue block to be executed if the
    #     promise is rejected.
    #   @param [ThreadPool] executor An optional thread pool executor to be used
    #     in the new Promise
    def then(*args, &block)
      if args.last.is_a?(::Hash)
        executor = args.pop[:executor]
        rescuer = args.first
      else
        rescuer, executor = args
      end

      executor ||= @executor

      raise ArgumentError.new('rescuers and block are both missing') if rescuer.nil? && !block_given?
      block = Proc.new { |result| result } unless block_given?
      child = Promise.new(
        parent: self,
        executor: executor,
        on_fulfill: block,
        on_reject: rescuer
      )

      synchronize do
        child.state = :pending if @state == :pending
        child.on_fulfill(apply_deref_options(@value)) if @state == :fulfilled
        child.on_reject(@reason) if @state == :rejected
        @children << child
      end

      child
    end

    # Chain onto this promise an action to be undertaken on success
    # (fulfillment).
    #
    # @yield The block to execute
    #
    # @return [Promise] self
    def on_success(&block)
      raise ArgumentError.new('no block given') unless block_given?
      self.then(&block)
    end

    # Chain onto this promise an action to be undertaken on failure
    # (rejection).
    #
    # @yield The block to execute
    #
    # @return [Promise] self
    def rescue(&block)
      self.then(block)
    end

    alias_method :catch, :rescue
    alias_method :on_error, :rescue

    # Yield the successful result to the block that returns a promise. If that
    # promise is also successful the result is the result of the yielded promise.
    # If either part fails the whole also fails.
    #
    # @example
    #   Promise.execute { 1 }.flat_map { |v| Promise.execute { v + 2 } }.value! #=> 3
    #
    # @return [Promise]
    def flat_map(&block)
      child = Promise.new(
        parent: self,
        executor: ImmediateExecutor.new,
      )

      on_error { |e| child.on_reject(e) }
      on_success do |result1|
        begin
          inner = block.call(result1)
          inner.execute
          inner.on_success { |result2| child.on_fulfill(result2) }
          inner.on_error { |e| child.on_reject(e) }
        rescue => e
          child.on_reject(e)
        end
      end

      child
    end

    # Builds a promise that produces the result of promises in an Array
    # and fails if any of them fails.
    #
    # @overload zip(*promises)
    #   @param [Array<Promise>] promises
    #
    # @overload zip(*promises, opts)
    #   @param [Array<Promise>] promises
    #   @param [Hash] opts the configuration options
    #   @option opts [Executor] :executor (ImmediateExecutor.new) when set use the given `Executor` instance.
    #   @option opts [Boolean] :execute (true) execute promise before returning
    #
    # @return [Promise<Array>]
    def self.zip(*promises)
      opts = promises.last.is_a?(::Hash) ? promises.pop.dup : {}
      opts[:executor] ||= ImmediateExecutor.new
      zero = if !opts.key?(:execute) || opts.delete(:execute)
        fulfill([], opts)
      else
        Promise.new(opts) { [] }
      end

      promises.reduce(zero) do |p1, p2|
        p1.flat_map do |results|
          p2.then do |next_result|
            results << next_result
          end
        end
      end
    end

    # Builds a promise that produces the result of self and others in an Array
    # and fails if any of them fails.
    #
    # @overload zip(*promises)
    #   @param [Array<Promise>] others
    #
    # @overload zip(*promises, opts)
    #   @param [Array<Promise>] others
    #   @param [Hash] opts the configuration options
    #   @option opts [Executor] :executor (ImmediateExecutor.new) when set use the given `Executor` instance.
    #   @option opts [Boolean] :execute (true) execute promise before returning
    #
    # @return [Promise<Array>]
    def zip(*others)
      self.class.zip(self, *others)
    end

    # Aggregates a collection of promises and executes the `then` condition
    # if all aggregated promises succeed. Executes the `rescue` handler with
    # a `Concurrent::PromiseExecutionError` if any of the aggregated promises
    # fail. Upon execution will execute any of the aggregate promises that
    # were not already executed.
    #
    # @!macro promise_self_aggregate
    #
    #   The returned promise will not yet have been executed. Additional `#then`
    #   and `#rescue` handlers may still be provided. Once the returned promise
    #   is execute the aggregate promises will be also be executed (if they have
    #   not been executed already). The results of the aggregate promises will
    #   be checked upon completion. The necessary `#then` and `#rescue` blocks
    #   on the aggregating promise will then be executed as appropriate. If the
    #   `#rescue` handlers are executed the raises exception will be
    #   `Concurrent::PromiseExecutionError`.
    #
    #   @param [Array] promises Zero or more promises to aggregate
    #   @return [Promise] an unscheduled (not executed) promise that aggregates
    #     the promises given as arguments
    def self.all?(*promises)
      aggregate(:all?, *promises)
    end

    # Aggregates a collection of promises and executes the `then` condition
    # if any aggregated promises succeed. Executes the `rescue` handler with
    # a `Concurrent::PromiseExecutionError` if any of the aggregated promises
    # fail. Upon execution will execute any of the aggregate promises that
    # were not already executed.
    #
    # @!macro promise_self_aggregate
    def self.any?(*promises)
      aggregate(:any?, *promises)
    end

    protected

    def ns_initialize(value, opts)
      super

      @executor = Options.executor_from_options(opts) || Concurrent.global_io_executor
      @args = get_arguments_from(opts)

      @parent = opts.fetch(:parent) { nil }
      @on_fulfill = opts.fetch(:on_fulfill) { Proc.new { |result| result } }
      @on_reject = opts.fetch(:on_reject) { Proc.new { |reason| raise reason } }

      @promise_body = opts[:__promise_body_from_block__] || Proc.new { |result| result }
      @state = :unscheduled
      @children = []
    end

    # Aggregate a collection of zero or more promises under a composite promise,
    # execute the aggregated promises and collect them into a standard Ruby array,
    # call the given Ruby `Ennnumerable` predicate (such as `any?`, `all?`, `none?`,
    # or `one?`) on the collection checking for the success or failure of each,
    # then executing the composite's `#then` handlers if the predicate returns
    # `true` or executing the composite's `#rescue` handlers if the predicate
    # returns false.
    #
    # @!macro promise_self_aggregate
    def self.aggregate(method, *promises)
      composite = Promise.new do
        completed = promises.collect do |promise|
          promise.execute if promise.unscheduled?
          promise.wait
          promise
        end
        unless completed.empty? || completed.send(method){|promise| promise.fulfilled? }
          raise PromiseExecutionError
        end
      end
      composite
    end

    # @!visibility private
    def set_pending
      synchronize do
        @state = :pending
        @children.each { |c| c.set_pending }
      end
    end

    # @!visibility private
    def root? # :nodoc:
      @parent.nil?
    end

    # @!visibility private
    def on_fulfill(result)
      realize Proc.new { @on_fulfill.call(result) }
      nil
    end

    # @!visibility private
    def on_reject(reason)
      realize Proc.new { @on_reject.call(reason) }
      nil
    end

    # @!visibility private
    def notify_child(child)
      if_state(:fulfilled) { child.on_fulfill(apply_deref_options(@value)) }
      if_state(:rejected) { child.on_reject(@reason) }
    end

    # @!visibility private
    def complete(success, value, reason)
      children_to_notify = synchronize do
        set_state!(success, value, reason)
        @children.dup
      end

      children_to_notify.each { |child| notify_child(child) }
      observers.notify_and_delete_observers{ [Time.now, self.value, reason] }
    end

    # @!visibility private
    def realize(task)
      @executor.post do
        success, value, reason = SafeTaskExecutor.new(task, rescue_exception: true).execute(*@args)
        complete(success, value, reason)
      end
    end

    # @!visibility private
    def set_state!(success, value, reason)
      set_state(success, value, reason)
      event.set
    end

    # @!visibility private
    def synchronized_set_state!(success, value, reason)
      synchronize { set_state!(success, value, reason) }
    end
  end
end
