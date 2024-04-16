require 'thread'
require 'concurrent/atomic/event'
require 'concurrent/concern/logging'
require 'concurrent/executor/ruby_executor_service'
require 'concurrent/utility/monotonic_time'

module Concurrent

  # @!macro thread_pool_executor
  # @!macro thread_pool_options
  # @!visibility private
  class RubyThreadPoolExecutor < RubyExecutorService

    # @!macro thread_pool_executor_constant_default_max_pool_size
    DEFAULT_MAX_POOL_SIZE      = 2_147_483_647 # java.lang.Integer::MAX_VALUE

    # @!macro thread_pool_executor_constant_default_min_pool_size
    DEFAULT_MIN_POOL_SIZE      = 0

    # @!macro thread_pool_executor_constant_default_max_queue_size
    DEFAULT_MAX_QUEUE_SIZE     = 0

    # @!macro thread_pool_executor_constant_default_thread_timeout
    DEFAULT_THREAD_IDLETIMEOUT = 60

    # @!macro thread_pool_executor_constant_default_synchronous
    DEFAULT_SYNCHRONOUS = false

    # @!macro thread_pool_executor_attr_reader_max_length
    attr_reader :max_length

    # @!macro thread_pool_executor_attr_reader_min_length
    attr_reader :min_length

    # @!macro thread_pool_executor_attr_reader_idletime
    attr_reader :idletime

    # @!macro thread_pool_executor_attr_reader_max_queue
    attr_reader :max_queue

    # @!macro thread_pool_executor_attr_reader_synchronous
    attr_reader :synchronous

    # @!macro thread_pool_executor_method_initialize
    def initialize(opts = {})
      super(opts)
    end

    # @!macro thread_pool_executor_attr_reader_largest_length
    def largest_length
      synchronize { @largest_length }
    end

    # @!macro thread_pool_executor_attr_reader_scheduled_task_count
    def scheduled_task_count
      synchronize { @scheduled_task_count }
    end

    # @!macro thread_pool_executor_attr_reader_completed_task_count
    def completed_task_count
      synchronize { @completed_task_count }
    end

    # @!macro thread_pool_executor_method_active_count
    def active_count
      synchronize do
        @pool.length - @ready.length
      end
    end

    # @!macro executor_service_method_can_overflow_question
    def can_overflow?
      synchronize { ns_limited_queue? }
    end

    # @!macro thread_pool_executor_attr_reader_length
    def length
      synchronize { @pool.length }
    end

    # @!macro thread_pool_executor_attr_reader_queue_length
    def queue_length
      synchronize { @queue.length }
    end

    # @!macro thread_pool_executor_attr_reader_remaining_capacity
    def remaining_capacity
      synchronize do
        if ns_limited_queue?
          @max_queue - @queue.length
        else
          -1
        end
      end
    end

    # @!visibility private
    def remove_busy_worker(worker)
      synchronize { ns_remove_busy_worker worker }
    end

    # @!visibility private
    def ready_worker(worker, last_message)
      synchronize { ns_ready_worker worker, last_message }
    end

    # @!visibility private
    def worker_died(worker)
      synchronize { ns_worker_died worker }
    end

    # @!visibility private
    def worker_task_completed
      synchronize { @completed_task_count += 1 }
    end

    # @!macro thread_pool_executor_method_prune_pool
    def prune_pool
      synchronize { ns_prune_pool }
    end

    private

    # @!visibility private
    def ns_initialize(opts)
      @min_length      = opts.fetch(:min_threads, DEFAULT_MIN_POOL_SIZE).to_i
      @max_length      = opts.fetch(:max_threads, DEFAULT_MAX_POOL_SIZE).to_i
      @idletime        = opts.fetch(:idletime, DEFAULT_THREAD_IDLETIMEOUT).to_i
      @max_queue       = opts.fetch(:max_queue, DEFAULT_MAX_QUEUE_SIZE).to_i
      @synchronous     = opts.fetch(:synchronous, DEFAULT_SYNCHRONOUS)
      @fallback_policy = opts.fetch(:fallback_policy, :abort)

      raise ArgumentError.new("`synchronous` cannot be set unless `max_queue` is 0") if @synchronous && @max_queue > 0
      raise ArgumentError.new("#{@fallback_policy} is not a valid fallback policy") unless FALLBACK_POLICIES.include?(@fallback_policy)
      raise ArgumentError.new("`max_threads` cannot be less than #{DEFAULT_MIN_POOL_SIZE}") if @max_length < DEFAULT_MIN_POOL_SIZE
      raise ArgumentError.new("`max_threads` cannot be greater than #{DEFAULT_MAX_POOL_SIZE}") if @max_length > DEFAULT_MAX_POOL_SIZE
      raise ArgumentError.new("`min_threads` cannot be less than #{DEFAULT_MIN_POOL_SIZE}") if @min_length < DEFAULT_MIN_POOL_SIZE
      raise ArgumentError.new("`min_threads` cannot be more than `max_threads`") if min_length > max_length

      @pool                 = [] # all workers
      @ready                = [] # used as a stash (most idle worker is at the start)
      @queue                = [] # used as queue
      # @ready or @queue is empty at all times
      @scheduled_task_count = 0
      @completed_task_count = 0
      @largest_length       = 0
      @workers_counter      = 0
      @ruby_pid             = $$ # detects if Ruby has forked

      @gc_interval  = opts.fetch(:gc_interval, @idletime / 2.0).to_i # undocumented
      @next_gc_time = Concurrent.monotonic_time + @gc_interval
    end

    # @!visibility private
    def ns_limited_queue?
      @max_queue != 0
    end

    # @!visibility private
    def ns_execute(*args, &task)
      ns_reset_if_forked

      if ns_assign_worker(*args, &task) || ns_enqueue(*args, &task)
        @scheduled_task_count += 1
      else
        return fallback_action(*args, &task)
      end

      ns_prune_pool if @next_gc_time < Concurrent.monotonic_time
      nil
    end

    # @!visibility private
    def ns_shutdown_execution
      ns_reset_if_forked

      if @pool.empty?
        # nothing to do
        stopped_event.set
      end

      if @queue.empty?
        # no more tasks will be accepted, just stop all workers
        @pool.each(&:stop)
      end
    end

    # @!visibility private
    def ns_kill_execution
      # TODO log out unprocessed tasks in queue
      # TODO try to shutdown first?
      @pool.each(&:kill)
      @pool.clear
      @ready.clear
    end

    # tries to assign task to a worker, tries to get one from @ready or to create new one
    # @return [true, false] if task is assigned to a worker
    #
    # @!visibility private
    def ns_assign_worker(*args, &task)
      # keep growing if the pool is not at the minimum yet
      worker, _ = (@ready.pop if @pool.size >= @min_length) || ns_add_busy_worker
      if worker
        worker << [task, args]
        true
      else
        false
      end
    rescue ThreadError
      # Raised when the operating system refuses to create the new thread
      return false
    end

    # tries to enqueue task
    # @return [true, false] if enqueued
    #
    # @!visibility private
    def ns_enqueue(*args, &task)
      return false if @synchronous
      
      if !ns_limited_queue? || @queue.size < @max_queue
        @queue << [task, args]
        true
      else
        false
      end
    end

    # @!visibility private
    def ns_worker_died(worker)
      ns_remove_busy_worker worker
      replacement_worker = ns_add_busy_worker
      ns_ready_worker replacement_worker, Concurrent.monotonic_time, false if replacement_worker
    end

    # creates new worker which has to receive work to do after it's added
    # @return [nil, Worker] nil of max capacity is reached
    #
    # @!visibility private
    def ns_add_busy_worker
      return if @pool.size >= @max_length

      @workers_counter += 1
      @pool << (worker = Worker.new(self, @workers_counter))
      @largest_length = @pool.length if @pool.length > @largest_length
      worker
    end

    # handle ready worker, giving it new job or assigning back to @ready
    #
    # @!visibility private
    def ns_ready_worker(worker, last_message, success = true)
      task_and_args = @queue.shift
      if task_and_args
        worker << task_and_args
      else
        # stop workers when !running?, do not return them to @ready
        if running?
          raise unless last_message
          @ready.push([worker, last_message])
        else
          worker.stop
        end
      end
    end

    # removes a worker which is not in not tracked in @ready
    #
    # @!visibility private
    def ns_remove_busy_worker(worker)
      @pool.delete(worker)
      stopped_event.set if @pool.empty? && !running?
      true
    end

    # try oldest worker if it is idle for enough time, it's returned back at the start
    #
    # @!visibility private
    def ns_prune_pool
      now = Concurrent.monotonic_time
      stopped_workers = 0
      while !@ready.empty? && (@pool.size - stopped_workers > @min_length)
        worker, last_message = @ready.first
        if now - last_message > self.idletime
          stopped_workers += 1
          @ready.shift
          worker << :stop
        else break
        end
      end

      @next_gc_time = Concurrent.monotonic_time + @gc_interval
    end

    def ns_reset_if_forked
      if $$ != @ruby_pid
        @queue.clear
        @ready.clear
        @pool.clear
        @scheduled_task_count = 0
        @completed_task_count = 0
        @largest_length       = 0
        @workers_counter      = 0
        @ruby_pid             = $$
      end
    end

    # @!visibility private
    class Worker
      include Concern::Logging

      def initialize(pool, id)
        # instance variables accessed only under pool's lock so no need to sync here again
        @queue  = Queue.new
        @pool   = pool
        @thread = create_worker @queue, pool, pool.idletime

        if @thread.respond_to?(:name=)
          @thread.name = [pool.name, 'worker', id].compact.join('-')
        end
      end

      def <<(message)
        @queue << message
      end

      def stop
        @queue << :stop
      end

      def kill
        @thread.kill
      end

      private

      def create_worker(queue, pool, idletime)
        Thread.new(queue, pool, idletime) do |my_queue, my_pool, my_idletime|
          catch(:stop) do
            loop do

              case message = my_queue.pop
              when :stop
                my_pool.remove_busy_worker(self)
                throw :stop

              else
                task, args = message
                run_task my_pool, task, args
                my_pool.ready_worker(self, Concurrent.monotonic_time)
              end
            end
          end
        end
      end

      def run_task(pool, task, args)
        task.call(*args)
        pool.worker_task_completed
      rescue => ex
        # let it fail
        log DEBUG, ex
      rescue Exception => ex
        log ERROR, ex
        pool.worker_died(self)
        throw :stop
      end
    end

    private_constant :Worker
  end
end
