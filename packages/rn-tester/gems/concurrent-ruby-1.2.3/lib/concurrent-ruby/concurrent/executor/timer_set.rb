require 'concurrent/scheduled_task'
require 'concurrent/atomic/event'
require 'concurrent/collection/non_concurrent_priority_queue'
require 'concurrent/executor/executor_service'
require 'concurrent/executor/single_thread_executor'
require 'concurrent/errors'
require 'concurrent/options'

module Concurrent

  # Executes a collection of tasks, each after a given delay. A master task
  # monitors the set and schedules each task for execution at the appropriate
  # time. Tasks are run on the global thread pool or on the supplied executor.
  # Each task is represented as a `ScheduledTask`.
  #
  # @see Concurrent::ScheduledTask
  #
  # @!macro monotonic_clock_warning
  class TimerSet < RubyExecutorService

    # Create a new set of timed tasks.
    #
    # @!macro executor_options
    #
    #   @param [Hash] opts the options used to specify the executor on which to perform actions
    #   @option opts [Executor] :executor when set use the given `Executor` instance.
    #     Three special values are also supported: `:task` returns the global task pool,
    #     `:operation` returns the global operation pool, and `:immediate` returns a new
    #     `ImmediateExecutor` object.
    def initialize(opts = {})
      super(opts)
    end

    # Post a task to be execute run after a given delay (in seconds). If the
    # delay is less than 1/100th of a second the task will be immediately post
    # to the executor.
    #
    # @param [Float] delay the number of seconds to wait for before executing the task.
    # @param [Array<Object>] args the arguments passed to the task on execution.
    #
    # @yield the task to be performed.
    #
    # @return [Concurrent::ScheduledTask, false] IVar representing the task if the post
    #   is successful; false after shutdown.
    #
    # @raise [ArgumentError] if the intended execution time is not in the future.
    # @raise [ArgumentError] if no block is given.
    def post(delay, *args, &task)
      raise ArgumentError.new('no block given') unless block_given?
      return false unless running?
      opts = { executor:  @task_executor,
               args:      args,
               timer_set: self }
      task = ScheduledTask.execute(delay, opts, &task) # may raise exception
      task.unscheduled? ? false : task
    end

    # Begin an immediate shutdown. In-progress tasks will be allowed to
    # complete but enqueued tasks will be dismissed and no new tasks
    # will be accepted. Has no additional effect if the thread pool is
    # not running.
    def kill
      shutdown
    end

    private :<<

    private

    # Initialize the object.
    #
    # @param [Hash] opts the options to create the object with.
    # @!visibility private
    def ns_initialize(opts)
      @queue              = Collection::NonConcurrentPriorityQueue.new(order: :min)
      @task_executor      = Options.executor_from_options(opts) || Concurrent.global_io_executor
      @timer_executor     = SingleThreadExecutor.new
      @condition          = Event.new
      @ruby_pid           = $$ # detects if Ruby has forked
    end

    # Post the task to the internal queue.
    #
    # @note This is intended as a callback method from ScheduledTask
    #   only. It is not intended to be used directly. Post a task
    #   by using the `SchedulesTask#execute` method.
    #
    # @!visibility private
    def post_task(task)
      synchronize { ns_post_task(task) }
    end

    # @!visibility private
    def ns_post_task(task)
      return false unless ns_running?
      ns_reset_if_forked
      if (task.initial_delay) <= 0.01
        task.executor.post { task.process_task }
      else
        @queue.push(task)
        # only post the process method when the queue is empty
        @timer_executor.post(&method(:process_tasks)) if @queue.length == 1
        @condition.set
      end
      true
    end

    # Remove the given task from the queue.
    #
    # @note This is intended as a callback method from `ScheduledTask`
    #   only. It is not intended to be used directly. Cancel a task
    #   by using the `ScheduledTask#cancel` method.
    #
    # @!visibility private
    def remove_task(task)
      synchronize { @queue.delete(task) }
    end

    # `ExecutorService` callback called during shutdown.
    #
    # @!visibility private
    def ns_shutdown_execution
      ns_reset_if_forked
      @queue.clear
      @timer_executor.kill
      stopped_event.set
    end

    def ns_reset_if_forked
      if $$ != @ruby_pid
        @queue.clear
        @condition.reset
        @ruby_pid = $$
      end
    end

    # Run a loop and execute tasks in the scheduled order and at the approximate
    # scheduled time. If no tasks remain the thread will exit gracefully so that
    # garbage collection can occur. If there are no ready tasks it will sleep
    # for up to 60 seconds waiting for the next scheduled task.
    #
    # @!visibility private
    def process_tasks
      loop do
        task = synchronize { @condition.reset; @queue.peek }
        break unless task

        now  = Concurrent.monotonic_time
        diff = task.schedule_time - now

        if diff <= 0
          # We need to remove the task from the queue before passing
          # it to the executor, to avoid race conditions where we pass
          # the peek'ed task to the executor and then pop a different
          # one that's been added in the meantime.
          #
          # Note that there's no race condition between the peek and
          # this pop - this pop could retrieve a different task from
          # the peek, but that task would be due to fire now anyway
          # (because @queue is a priority queue, and this thread is
          # the only reader, so whatever timer is at the head of the
          # queue now must have the same pop time, or a closer one, as
          # when we peeked).
          task = synchronize { @queue.pop }
          begin
            task.executor.post { task.process_task }
          rescue RejectedExecutionError
            # ignore and continue
          end
        else
          @condition.wait([diff, 60].min)
        end
      end
    end
  end
end
