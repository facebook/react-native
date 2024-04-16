require 'thread'
require 'concurrent/synchronization/lockable_object'

module Concurrent

  # Old school kernel-style event reminiscent of Win32 programming in C++.
  #
  # When an `Event` is created it is in the `unset` state. Threads can choose to
  # `#wait` on the event, blocking until released by another thread. When one
  # thread wants to alert all blocking threads it calls the `#set` method which
  # will then wake up all listeners. Once an `Event` has been set it remains set.
  # New threads calling `#wait` will return immediately. An `Event` may be
  # `#reset` at any time once it has been set.
  #
  # @see http://msdn.microsoft.com/en-us/library/windows/desktop/ms682655.aspx
  # @example
  #   event = Concurrent::Event.new
  #
  #   t1 = Thread.new do
  #     puts "t1 is waiting"
  #     event.wait(1)
  #     puts "event occurred"
  #   end
  #
  #   t2 = Thread.new do
  #     puts "t2 calling set"
  #     event.set
  #   end
  #
  #   [t1, t2].each(&:join)
  #
  #   # prints:
  #   # t1 is waiting
  #   # t2 calling set
  #   # event occurred
  class Event < Synchronization::LockableObject

    # Creates a new `Event` in the unset state. Threads calling `#wait` on the
    # `Event` will block.
    def initialize
      super
      synchronize { ns_initialize }
    end

    # Is the object in the set state?
    #
    # @return [Boolean] indicating whether or not the `Event` has been set
    def set?
      synchronize { @set }
    end

    # Trigger the event, setting the state to `set` and releasing all threads
    # waiting on the event. Has no effect if the `Event` has already been set.
    #
    # @return [Boolean] should always return `true`
    def set
      synchronize { ns_set }
    end

    def try?
      synchronize { @set ? false : ns_set }
    end

    # Reset a previously set event back to the `unset` state.
    # Has no effect if the `Event` has not yet been set.
    #
    # @return [Boolean] should always return `true`
    def reset
      synchronize do
        if @set
          @set       = false
          @iteration +=1
        end
        true
      end
    end

    # Wait a given number of seconds for the `Event` to be set by another
    # thread. Will wait forever when no `timeout` value is given. Returns
    # immediately if the `Event` has already been set.
    #
    # @return [Boolean] true if the `Event` was set before timeout else false
    def wait(timeout = nil)
      synchronize do
        unless @set
          iteration = @iteration
          ns_wait_until(timeout) { iteration < @iteration || @set }
        else
          true
        end
      end
    end

    protected

    def ns_set
      unless @set
        @set = true
        ns_broadcast
      end
      true
    end

    def ns_initialize
      @set       = false
      @iteration = 0
    end
  end
end
