require 'concurrent/errors'
require 'concurrent/concern/logging'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # Ensures passed jobs in a serialized order never running at the same time.
  class SerializedExecution < Synchronization::LockableObject
    include Concern::Logging

    def initialize()
      super()
      synchronize { ns_initialize }
    end

    Job = Struct.new(:executor, :args, :block) do
      def call
        block.call(*args)
      end
    end

    # Submit a task to the executor for asynchronous processing.
    #
    # @param [Executor] executor to be used for this job
    #
    # @param [Array] args zero or more arguments to be passed to the task
    #
    # @yield the asynchronous task to perform
    #
    # @return [Boolean] `true` if the task is queued, `false` if the executor
    #   is not running
    #
    # @raise [ArgumentError] if no task is given
    def post(executor, *args, &task)
      posts [[executor, args, task]]
      true
    end

    # As {#post} but allows to submit multiple tasks at once, it's guaranteed that they will not
    # be interleaved by other tasks.
    #
    # @param [Array<Array(ExecutorService, Array<Object>, Proc)>] posts array of triplets where
    #   first is a {ExecutorService}, second is array of args for task, third is a task (Proc)
    def posts(posts)
      # if can_overflow?
      #   raise ArgumentError, 'SerializedExecution does not support thread-pools which can overflow'
      # end

      return nil if posts.empty?

      jobs = posts.map { |executor, args, task| Job.new executor, args, task }

      job_to_post = synchronize do
        if @being_executed
          @stash.push(*jobs)
          nil
        else
          @being_executed = true
          @stash.push(*jobs[1..-1])
          jobs.first
        end
      end

      call_job job_to_post if job_to_post
      true
    end

    private

    def ns_initialize
      @being_executed = false
      @stash          = []
    end

    def call_job(job)
      did_it_run = begin
                     job.executor.post { work(job) }
                     true
                   rescue RejectedExecutionError => ex
                     false
                   end

      # TODO not the best idea to run it myself
      unless did_it_run
        begin
          work job
        rescue => ex
          # let it fail
          log DEBUG, ex
        end
      end
    end

    # ensures next job is executed if any is stashed
    def work(job)
      job.call
    ensure
      synchronize do
        job = @stash.shift || (@being_executed = false)
      end

      # TODO maybe be able to tell caching pool to just enqueue this job, because the current one end at the end
      # of this block
      call_job job if job
    end
  end
end
