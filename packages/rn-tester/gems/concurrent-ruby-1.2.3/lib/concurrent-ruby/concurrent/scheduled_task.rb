require 'concurrent/constants'
require 'concurrent/errors'
require 'concurrent/configuration'
require 'concurrent/ivar'
require 'concurrent/collection/copy_on_notify_observer_set'
require 'concurrent/utility/monotonic_time'

require 'concurrent/options'

module Concurrent

  # `ScheduledTask` is a close relative of `Concurrent::Future` but with one
  # important difference: A `Future` is set to execute as soon as possible
  # whereas a `ScheduledTask` is set to execute after a specified delay. This
  # implementation is loosely based on Java's
  # [ScheduledExecutorService](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ScheduledExecutorService.html).
  # It is a more feature-rich variant of {Concurrent.timer}.
  #
  # The *intended* schedule time of task execution is set on object construction
  # with the `delay` argument. The delay is a numeric (floating point or integer)
  # representing a number of seconds in the future. Any other value or a numeric
  # equal to or less than zero will result in an exception. The *actual* schedule
  # time of task execution is set when the `execute` method is called.
  #
  # The constructor can also be given zero or more processing options. Currently
  # the only supported options are those recognized by the
  # [Dereferenceable](Dereferenceable) module.
  #
  # The final constructor argument is a block representing the task to be performed.
  # If no block is given an `ArgumentError` will be raised.
  #
  # **States**
  #
  # `ScheduledTask` mixes in the  [Obligation](Obligation) module thus giving it
  # "future" behavior. This includes the expected lifecycle states. `ScheduledTask`
  # has one additional state, however. While the task (block) is being executed the
  # state of the object will be `:processing`. This additional state is necessary
  # because it has implications for task cancellation.
  #
  # **Cancellation**
  #
  # A `:pending` task can be cancelled using the `#cancel` method. A task in any
  # other state, including `:processing`, cannot be cancelled. The `#cancel`
  # method returns a boolean indicating the success of the cancellation attempt.
  # A cancelled `ScheduledTask` cannot be restarted. It is immutable.
  #
  # **Obligation and Observation**
  #
  # The result of a `ScheduledTask` can be obtained either synchronously or
  # asynchronously. `ScheduledTask` mixes in both the [Obligation](Obligation)
  # module and the
  # [Observable](http://ruby-doc.org/stdlib-2.0/libdoc/observer/rdoc/Observable.html)
  # module from the Ruby standard library. With one exception `ScheduledTask`
  # behaves identically to [Future](Observable) with regard to these modules.
  #
  # @!macro copy_options
  #
  # @example Basic usage
  #
  #   require 'concurrent/scheduled_task'
  #   require 'csv'
  #   require 'open-uri'
  #
  #   class Ticker
  #     def get_year_end_closing(symbol, year, api_key)
  #      uri = "https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=#{symbol}&apikey=#{api_key}&datatype=csv"
  #      data = []
  #      csv = URI.parse(uri).read
  #      if csv.include?('call frequency')
  #        return :rate_limit_exceeded
  #      end
  #      CSV.parse(csv, headers: true) do |row|
  #        data << row['close'].to_f if row['timestamp'].include?(year.to_s)
  #      end
  #      year_end = data.first
  #      year_end
  #    rescue => e
  #      p e
  #    end
  #   end
  #
  #   api_key = ENV['ALPHAVANTAGE_KEY']
  #   abort(error_message) unless api_key
  #
  #   # Future
  #   price = Concurrent::Future.execute{ Ticker.new.get_year_end_closing('TWTR', 2013, api_key) }
  #   price.state #=> :pending
  #   price.pending? #=> true
  #   price.value(0) #=> nil (does not block)
  #
  #    sleep(1)    # do other stuff
  #
  #   price.value #=> 63.65 (after blocking if necessary)
  #   price.state #=> :fulfilled
  #   price.fulfilled? #=> true
  #   price.value #=> 63.65
  #
  # @example Successful task execution
  #
  #   task = Concurrent::ScheduledTask.new(2){ 'What does the fox say?' }
  #   task.state         #=> :unscheduled
  #   task.execute
  #   task.state         #=> pending
  #
  #   # wait for it...
  #   sleep(3)
  #
  #   task.unscheduled? #=> false
  #   task.pending?     #=> false
  #   task.fulfilled?   #=> true
  #   task.rejected?    #=> false
  #   task.value        #=> 'What does the fox say?'
  #
  # @example One line creation and execution
  #
  #   task = Concurrent::ScheduledTask.new(2){ 'What does the fox say?' }.execute
  #   task.state         #=> pending
  #
  #   task = Concurrent::ScheduledTask.execute(2){ 'What do you get when you multiply 6 by 9?' }
  #   task.state         #=> pending
  #
  # @example Failed task execution
  #
  #   task = Concurrent::ScheduledTask.execute(2){ raise StandardError.new('Call me maybe?') }
  #   task.pending?      #=> true
  #
  #   # wait for it...
  #   sleep(3)
  #
  #   task.unscheduled? #=> false
  #   task.pending?     #=> false
  #   task.fulfilled?   #=> false
  #   task.rejected?    #=> true
  #   task.value        #=> nil
  #   task.reason       #=> #<StandardError: Call me maybe?>
  #
  # @example Task execution with observation
  #
  #   observer = Class.new{
  #     def update(time, value, reason)
  #       puts "The task completed at #{time} with value '#{value}'"
  #     end
  #   }.new
  #
  #   task = Concurrent::ScheduledTask.new(2){ 'What does the fox say?' }
  #   task.add_observer(observer)
  #   task.execute
  #   task.pending?      #=> true
  #
  #   # wait for it...
  #   sleep(3)
  #
  #   #>> The task completed at 2013-11-07 12:26:09 -0500 with value 'What does the fox say?'
  #
  # @!macro monotonic_clock_warning
  #
  # @see Concurrent.timer
  class ScheduledTask < IVar
    include Comparable

    # The executor on which to execute the task.
    # @!visibility private
    attr_reader :executor

    # Schedule a task for execution at a specified future time.
    #
    # @param [Float] delay the number of seconds to wait for before executing the task
    #
    # @yield the task to be performed
    #
    # @!macro executor_and_deref_options
    #
    # @option opts [object, Array] :args zero or more arguments to be passed the task
    #   block on execution
    #
    # @raise [ArgumentError] When no block is given
    # @raise [ArgumentError] When given a time that is in the past
    def initialize(delay, opts = {}, &task)
      raise ArgumentError.new('no block given') unless block_given?
      raise ArgumentError.new('seconds must be greater than zero') if delay.to_f < 0.0

      super(NULL, opts, &nil)

      synchronize do
        ns_set_state(:unscheduled)
        @parent = opts.fetch(:timer_set, Concurrent.global_timer_set)
        @args = get_arguments_from(opts)
        @delay = delay.to_f
        @task = task
        @time = nil
        @executor = Options.executor_from_options(opts) || Concurrent.global_io_executor
        self.observers = Collection::CopyOnNotifyObserverSet.new
      end
    end

    # The `delay` value given at instanciation.
    #
    # @return [Float] the initial delay.
    def initial_delay
      synchronize { @delay }
    end

    # The monotonic time at which the the task is scheduled to be executed.
    #
    # @return [Float] the schedule time or nil if `unscheduled`
    def schedule_time
      synchronize { @time }
    end

    # Comparator which orders by schedule time.
    #
    # @!visibility private
    def <=>(other)
      schedule_time <=> other.schedule_time
    end

    # Has the task been cancelled?
    #
    # @return [Boolean] true if the task is in the given state else false
    def cancelled?
      synchronize { ns_check_state?(:cancelled) }
    end

    # In the task execution in progress?
    #
    # @return [Boolean] true if the task is in the given state else false
    def processing?
      synchronize { ns_check_state?(:processing) }
    end

    # Cancel this task and prevent it from executing. A task can only be
    # cancelled if it is pending or unscheduled.
    #
    # @return [Boolean] true if successfully cancelled else false
    def cancel
      if compare_and_set_state(:cancelled, :pending, :unscheduled)
        complete(false, nil, CancelledOperationError.new)
        # To avoid deadlocks this call must occur outside of #synchronize
        # Changing the state above should prevent redundant calls
        @parent.send(:remove_task, self)
      else
        false
      end
    end

    # Reschedule the task using the original delay and the current time.
    # A task can only be reset while it is `:pending`.
    #
    # @return [Boolean] true if successfully rescheduled else false
    def reset
      synchronize{ ns_reschedule(@delay) }
    end

    # Reschedule the task using the given delay and the current time.
    # A task can only be reset while it is `:pending`.
    #
    # @param [Float] delay the number of seconds to wait for before executing the task
    #
    # @return [Boolean] true if successfully rescheduled else false
    #
    # @raise [ArgumentError] When given a time that is in the past
    def reschedule(delay)
      delay = delay.to_f
      raise ArgumentError.new('seconds must be greater than zero') if delay < 0.0
      synchronize{ ns_reschedule(delay) }
    end

    # Execute an `:unscheduled` `ScheduledTask`. Immediately sets the state to `:pending`
    # and starts counting down toward execution. Does nothing if the `ScheduledTask` is
    # in any state other than `:unscheduled`.
    #
    # @return [ScheduledTask] a reference to `self`
    def execute
      if compare_and_set_state(:pending, :unscheduled)
        synchronize{ ns_schedule(@delay) }
      end
      self
    end

    # Create a new `ScheduledTask` object with the given block, execute it, and return the
    # `:pending` object.
    #
    # @param [Float] delay the number of seconds to wait for before executing the task
    #
    # @!macro executor_and_deref_options
    #
    # @return [ScheduledTask] the newly created `ScheduledTask` in the `:pending` state
    #
    # @raise [ArgumentError] if no block is given
    def self.execute(delay, opts = {}, &task)
      new(delay, opts, &task).execute
    end

    # Execute the task.
    #
    # @!visibility private
    def process_task
      safe_execute(@task, @args)
    end

    protected :set, :try_set, :fail, :complete

    protected

    # Schedule the task using the given delay and the current time.
    #
    # @param [Float] delay the number of seconds to wait for before executing the task
    #
    # @return [Boolean] true if successfully rescheduled else false
    #
    # @!visibility private
    def ns_schedule(delay)
      @delay = delay
      @time = Concurrent.monotonic_time + @delay
      @parent.send(:post_task, self)
    end

    # Reschedule the task using the given delay and the current time.
    # A task can only be reset while it is `:pending`.
    #
    # @param [Float] delay the number of seconds to wait for before executing the task
    #
    # @return [Boolean] true if successfully rescheduled else false
    #
    # @!visibility private
    def ns_reschedule(delay)
      return false unless ns_check_state?(:pending)
      @parent.send(:remove_task, self) && ns_schedule(delay)
    end
  end
end
