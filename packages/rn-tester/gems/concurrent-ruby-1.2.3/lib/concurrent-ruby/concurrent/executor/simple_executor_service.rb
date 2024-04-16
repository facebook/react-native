require 'concurrent/atomic/atomic_boolean'
require 'concurrent/atomic/atomic_fixnum'
require 'concurrent/atomic/event'
require 'concurrent/executor/executor_service'
require 'concurrent/executor/ruby_executor_service'

module Concurrent

  # An executor service in which every operation spawns a new,
  # independently operating thread.
  #
  # This is perhaps the most inefficient executor service in this
  # library. It exists mainly for testing an debugging. Thread creation
  # and management is expensive in Ruby and this executor performs no
  # resource pooling. This can be very beneficial during testing and
  # debugging because it decouples the using code from the underlying
  # executor implementation. In production this executor will likely
  # lead to suboptimal performance.
  #
  # @note Intended for use primarily in testing and debugging.
  class SimpleExecutorService < RubyExecutorService

    # @!macro executor_service_method_post
    def self.post(*args)
      raise ArgumentError.new('no block given') unless block_given?
      Thread.new(*args) do
        Thread.current.abort_on_exception = false
        yield(*args)
      end
      true
    end

    # @!macro executor_service_method_left_shift
    def self.<<(task)
      post(&task)
      self
    end

    # @!macro executor_service_method_post
    def post(*args, &task)
      raise ArgumentError.new('no block given') unless block_given?
      return false unless running?
      @count.increment
      Thread.new(*args) do
        Thread.current.abort_on_exception = false
        begin
          yield(*args)
        ensure
          @count.decrement
          @stopped.set if @running.false? && @count.value == 0
        end
      end
    end

    # @!macro executor_service_method_left_shift
    def <<(task)
      post(&task)
      self
    end

    # @!macro executor_service_method_running_question
    def running?
      @running.true?
    end

    # @!macro executor_service_method_shuttingdown_question
    def shuttingdown?
      @running.false? && ! @stopped.set?
    end

    # @!macro executor_service_method_shutdown_question
    def shutdown?
      @stopped.set?
    end

    # @!macro executor_service_method_shutdown
    def shutdown
      @running.make_false
      @stopped.set if @count.value == 0
      true
    end

    # @!macro executor_service_method_kill
    def kill
      @running.make_false
      @stopped.set
      true
    end

    # @!macro executor_service_method_wait_for_termination
    def wait_for_termination(timeout = nil)
      @stopped.wait(timeout)
    end

    private

    def ns_initialize(*args)
      @running = Concurrent::AtomicBoolean.new(true)
      @stopped = Concurrent::Event.new
      @count = Concurrent::AtomicFixnum.new(0)
    end
  end
end
