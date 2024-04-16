require 'concurrent/collection/copy_on_notify_observer_set'
require 'concurrent/concern/dereferenceable'
require 'concurrent/concern/observable'
require 'concurrent/atomic/atomic_boolean'
require 'concurrent/executor/executor_service'
require 'concurrent/executor/ruby_executor_service'
require 'concurrent/executor/safe_task_executor'
require 'concurrent/scheduled_task'

module Concurrent

  # A very common concurrency pattern is to run a thread that performs a task at
  # regular intervals. The thread that performs the task sleeps for the given
  # interval then wakes up and performs the task. Lather, rinse, repeat... This
  # pattern causes two problems. First, it is difficult to test the business
  # logic of the task because the task itself is tightly coupled with the
  # concurrency logic. Second, an exception raised while performing the task can
  # cause the entire thread to abend. In a long-running application where the
  # task thread is intended to run for days/weeks/years a crashed task thread
  # can pose a significant problem. `TimerTask` alleviates both problems.
  #
  # When a `TimerTask` is launched it starts a thread for monitoring the
  # execution interval. The `TimerTask` thread does not perform the task,
  # however. Instead, the TimerTask launches the task on a separate thread.
  # Should the task experience an unrecoverable crash only the task thread will
  # crash. This makes the `TimerTask` very fault tolerant. Additionally, the
  # `TimerTask` thread can respond to the success or failure of the task,
  # performing logging or ancillary operations.
  #
  # One other advantage of `TimerTask` is that it forces the business logic to
  # be completely decoupled from the concurrency logic. The business logic can
  # be tested separately then passed to the `TimerTask` for scheduling and
  # running.
  #
  # A `TimerTask` supports two different types of interval calculations.
  # A fixed delay will always wait the same amount of time between the
  # completion of one task and the start of the next. A fixed rate will
  # attempt to maintain a constant rate of execution regardless of the
  # duration of the task. For example, if a fixed rate task is scheduled
  # to run every 60 seconds but the task itself takes 10 seconds to
  # complete, the next task will be scheduled to run 50 seconds after
  # the start of the previous task. If the task takes 70 seconds to
  # complete, the next task will be start immediately after the previous
  # task completes. Tasks will not be executed concurrently.
  #
  # In some cases it may be necessary for a `TimerTask` to affect its own
  # execution cycle. To facilitate this, a reference to the TimerTask instance
  # is passed as an argument to the provided block every time the task is
  # executed.
  #
  # The `TimerTask` class includes the `Dereferenceable` mixin module so the
  # result of the last execution is always available via the `#value` method.
  # Dereferencing options can be passed to the `TimerTask` during construction or
  # at any later time using the `#set_deref_options` method.
  #
  # `TimerTask` supports notification through the Ruby standard library
  # {http://ruby-doc.org/stdlib-2.0/libdoc/observer/rdoc/Observable.html
  # Observable} module. On execution the `TimerTask` will notify the observers
  # with three arguments: time of execution, the result of the block (or nil on
  # failure), and any raised exceptions (or nil on success).
  #
  # @!macro copy_options
  #
  # @example Basic usage
  #   task = Concurrent::TimerTask.new{ puts 'Boom!' }
  #   task.execute
  #
  #   task.execution_interval #=> 60 (default)
  #
  #   # wait 60 seconds...
  #   #=> 'Boom!'
  #
  #   task.shutdown #=> true
  #
  # @example Configuring `:execution_interval`
  #   task = Concurrent::TimerTask.new(execution_interval: 5) do
  #          puts 'Boom!'
  #        end
  #
  #   task.execution_interval #=> 5
  #
  # @example Immediate execution with `:run_now`
  #   task = Concurrent::TimerTask.new(run_now: true){ puts 'Boom!' }
  #   task.execute
  #
  #   #=> 'Boom!'
  #
  # @example Configuring `:interval_type` with either :fixed_delay or :fixed_rate, default is :fixed_delay
  #   task = Concurrent::TimerTask.new(execution_interval: 5, interval_type: :fixed_rate) do
  #          puts 'Boom!'
  #        end
  #   task.interval_type #=> :fixed_rate
  #
  # @example Last `#value` and `Dereferenceable` mixin
  #   task = Concurrent::TimerTask.new(
  #     dup_on_deref: true,
  #     execution_interval: 5
  #   ){ Time.now }
  #
  #   task.execute
  #   Time.now   #=> 2013-11-07 18:06:50 -0500
  #   sleep(10)
  #   task.value #=> 2013-11-07 18:06:55 -0500
  #
  # @example Controlling execution from within the block
  #   timer_task = Concurrent::TimerTask.new(execution_interval: 1) do |task|
  #     task.execution_interval.to_i.times{ print 'Boom! ' }
  #     print "\n"
  #     task.execution_interval += 1
  #     if task.execution_interval > 5
  #       puts 'Stopping...'
  #       task.shutdown
  #     end
  #   end
  #
  #   timer_task.execute
  #   #=> Boom!
  #   #=> Boom! Boom!
  #   #=> Boom! Boom! Boom!
  #   #=> Boom! Boom! Boom! Boom!
  #   #=> Boom! Boom! Boom! Boom! Boom!
  #   #=> Stopping...
  #
  # @example Observation
  #   class TaskObserver
  #     def update(time, result, ex)
  #       if result
  #         print "(#{time}) Execution successfully returned #{result}\n"
  #       else
  #         print "(#{time}) Execution failed with error #{ex}\n"
  #       end
  #     end
  #   end
  #
  #   task = Concurrent::TimerTask.new(execution_interval: 1){ 42 }
  #   task.add_observer(TaskObserver.new)
  #   task.execute
  #   sleep 4
  #
  #   #=> (2013-10-13 19:08:58 -0400) Execution successfully returned 42
  #   #=> (2013-10-13 19:08:59 -0400) Execution successfully returned 42
  #   #=> (2013-10-13 19:09:00 -0400) Execution successfully returned 42
  #   task.shutdown
  #
  #   task = Concurrent::TimerTask.new(execution_interval: 1){ sleep }
  #   task.add_observer(TaskObserver.new)
  #   task.execute
  #
  #   #=> (2013-10-13 19:07:25 -0400) Execution timed out
  #   #=> (2013-10-13 19:07:27 -0400) Execution timed out
  #   #=> (2013-10-13 19:07:29 -0400) Execution timed out
  #   task.shutdown
  #
  #   task = Concurrent::TimerTask.new(execution_interval: 1){ raise StandardError }
  #   task.add_observer(TaskObserver.new)
  #   task.execute
  #
  #   #=> (2013-10-13 19:09:37 -0400) Execution failed with error StandardError
  #   #=> (2013-10-13 19:09:38 -0400) Execution failed with error StandardError
  #   #=> (2013-10-13 19:09:39 -0400) Execution failed with error StandardError
  #   task.shutdown
  #
  # @see http://ruby-doc.org/stdlib-2.0/libdoc/observer/rdoc/Observable.html
  # @see http://docs.oracle.com/javase/7/docs/api/java/util/TimerTask.html
  class TimerTask < RubyExecutorService
    include Concern::Dereferenceable
    include Concern::Observable

    # Default `:execution_interval` in seconds.
    EXECUTION_INTERVAL = 60

    # Maintain the interval between the end of one execution and the start of the next execution.
    FIXED_DELAY = :fixed_delay

    # Maintain the interval between the start of one execution and the start of the next.
    # If execution time exceeds the interval, the next execution will start immediately
    # after the previous execution finishes. Executions will not run concurrently.
    FIXED_RATE = :fixed_rate

    # Default `:interval_type`
    DEFAULT_INTERVAL_TYPE = FIXED_DELAY

    # Create a new TimerTask with the given task and configuration.
    #
    # @!macro timer_task_initialize
    #   @param [Hash] opts the options defining task execution.
    #   @option opts [Float] :execution_interval number of seconds between
    #     task executions (default: EXECUTION_INTERVAL)
    #   @option opts [Boolean] :run_now Whether to run the task immediately
    #     upon instantiation or to wait until the first #  execution_interval
    #     has passed (default: false)
    #   @options opts [Symbol] :interval_type method to calculate the interval
    #     between executions, can be either :fixed_rate or :fixed_delay.
    #     (default: :fixed_delay)
    #   @option opts [Executor] executor, default is `global_io_executor`
    #
    #   @!macro deref_options
    #
    #   @raise ArgumentError when no block is given.
    #
    #   @yield to the block after :execution_interval seconds have passed since
    #     the last yield
    #   @yieldparam task a reference to the `TimerTask` instance so that the
    #     block can control its own lifecycle. Necessary since `self` will
    #     refer to the execution context of the block rather than the running
    #     `TimerTask`.
    #
    #   @return [TimerTask] the new `TimerTask`
    def initialize(opts = {}, &task)
      raise ArgumentError.new('no block given') unless block_given?
      super
      set_deref_options opts
    end

    # Is the executor running?
    #
    # @return [Boolean] `true` when running, `false` when shutting down or shutdown
    def running?
      @running.true?
    end

    # Execute a previously created `TimerTask`.
    #
    # @return [TimerTask] a reference to `self`
    #
    # @example Instance and execute in separate steps
    #   task = Concurrent::TimerTask.new(execution_interval: 10){ print "Hello World\n" }
    #   task.running? #=> false
    #   task.execute
    #   task.running? #=> true
    #
    # @example Instance and execute in one line
    #   task = Concurrent::TimerTask.new(execution_interval: 10){ print "Hello World\n" }.execute
    #   task.running? #=> true
    def execute
      synchronize do
        if @running.false?
          @running.make_true
          schedule_next_task(@run_now ? 0 : @execution_interval)
        end
      end
      self
    end

    # Create and execute a new `TimerTask`.
    #
    # @!macro timer_task_initialize
    #
    # @example
    #   task = Concurrent::TimerTask.execute(execution_interval: 10){ print "Hello World\n" }
    #   task.running? #=> true
    def self.execute(opts = {}, &task)
      TimerTask.new(opts, &task).execute
    end

    # @!attribute [rw] execution_interval
    # @return [Fixnum] Number of seconds after the task completes before the
    #   task is performed again.
    def execution_interval
      synchronize { @execution_interval }
    end

    # @!attribute [rw] execution_interval
    # @return [Fixnum] Number of seconds after the task completes before the
    #   task is performed again.
    def execution_interval=(value)
      if (value = value.to_f) <= 0.0
        raise ArgumentError.new('must be greater than zero')
      else
        synchronize { @execution_interval = value }
      end
    end

    # @!attribute [r] interval_type
    # @return [Symbol] method to calculate the interval between executions
    attr_reader :interval_type

    # @!attribute [rw] timeout_interval
    # @return [Fixnum] Number of seconds the task can run before it is
    #   considered to have failed.
    def timeout_interval
      warn 'TimerTask timeouts are now ignored as these were not able to be implemented correctly'
    end

    # @!attribute [rw] timeout_interval
    # @return [Fixnum] Number of seconds the task can run before it is
    #   considered to have failed.
    def timeout_interval=(value)
      warn 'TimerTask timeouts are now ignored as these were not able to be implemented correctly'
    end

    private :post, :<<

    private

    def ns_initialize(opts, &task)
      set_deref_options(opts)

      self.execution_interval = opts[:execution] || opts[:execution_interval] || EXECUTION_INTERVAL
      if opts[:interval_type] && ![FIXED_DELAY, FIXED_RATE].include?(opts[:interval_type])
        raise ArgumentError.new('interval_type must be either :fixed_delay or :fixed_rate')
      end
      if opts[:timeout] || opts[:timeout_interval]
        warn 'TimeTask timeouts are now ignored as these were not able to be implemented correctly'
      end

      @run_now = opts[:now] || opts[:run_now]
      @interval_type = opts[:interval_type] || DEFAULT_INTERVAL_TYPE
      @task = Concurrent::SafeTaskExecutor.new(task)
      @executor = opts[:executor] || Concurrent.global_io_executor
      @running = Concurrent::AtomicBoolean.new(false)
      @value = nil

      self.observers = Collection::CopyOnNotifyObserverSet.new
    end

    # @!visibility private
    def ns_shutdown_execution
      @running.make_false
      super
    end

    # @!visibility private
    def ns_kill_execution
      @running.make_false
      super
    end

    # @!visibility private
    def schedule_next_task(interval = execution_interval)
      ScheduledTask.execute(interval, executor: @executor, args: [Concurrent::Event.new], &method(:execute_task))
      nil
    end

    # @!visibility private
    def execute_task(completion)
      return nil unless @running.true?
      start_time = Concurrent.monotonic_time
      _success, value, reason = @task.execute(self)
      if completion.try?
        self.value = value
        schedule_next_task(calculate_next_interval(start_time))
        time = Time.now
        observers.notify_observers do
          [time, self.value, reason]
        end
      end
      nil
    end

    # @!visibility private
    def calculate_next_interval(start_time)
      if @interval_type == FIXED_RATE
        run_time = Concurrent.monotonic_time - start_time
        [execution_interval - run_time, 0].max
      else # FIXED_DELAY
        execution_interval
      end
    end
  end
end
