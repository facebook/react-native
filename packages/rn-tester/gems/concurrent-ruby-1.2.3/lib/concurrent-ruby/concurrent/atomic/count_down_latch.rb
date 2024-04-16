require 'concurrent/utility/engine'
require 'concurrent/atomic/mutex_count_down_latch'
require 'concurrent/atomic/java_count_down_latch'

module Concurrent

  ###################################################################

  # @!macro count_down_latch_method_initialize
  #
  #   Create a new `CountDownLatch` with the initial `count`.
  #
  #   @param [new] count the initial count
  #
  #   @raise [ArgumentError] if `count` is not an integer or is less than zero

  # @!macro count_down_latch_method_wait
  #
  #   Block on the latch until the counter reaches zero or until `timeout` is reached.
  #
  #   @param [Fixnum] timeout the number of seconds to wait for the counter or `nil`
  #     to block indefinitely
  #   @return [Boolean] `true` if the `count` reaches zero else false on `timeout`

  # @!macro count_down_latch_method_count_down
  #
  #   Signal the latch to decrement the counter. Will signal all blocked threads when
  #   the `count` reaches zero.

  # @!macro count_down_latch_method_count
  #
  #   The current value of the counter.
  #
  #   @return [Fixnum] the current value of the counter

  ###################################################################

  # @!macro count_down_latch_public_api
  #
  #   @!method initialize(count = 1)
  #     @!macro count_down_latch_method_initialize
  #
  #   @!method wait(timeout = nil)
  #     @!macro count_down_latch_method_wait
  #
  #   @!method count_down
  #     @!macro count_down_latch_method_count_down
  #
  #   @!method count
  #     @!macro count_down_latch_method_count

  ###################################################################

  # @!visibility private
  # @!macro internal_implementation_note
  CountDownLatchImplementation = case
                                 when Concurrent.on_jruby?
                                   JavaCountDownLatch
                                 else
                                   MutexCountDownLatch
                                 end
  private_constant :CountDownLatchImplementation

  # @!macro count_down_latch
  #
  #   A synchronization object that allows one thread to wait on multiple other threads.
  #   The thread that will wait creates a `CountDownLatch` and sets the initial value
  #   (normally equal to the number of other threads). The initiating thread passes the
  #   latch to the other threads then waits for the other threads by calling the `#wait`
  #   method. Each of the other threads calls `#count_down` when done with its work.
  #   When the latch counter reaches zero the waiting thread is unblocked and continues
  #   with its work. A `CountDownLatch` can be used only once. Its value cannot be reset.
  #
  # @!macro count_down_latch_public_api
  # @example Waiter and Decrementer
  #   latch = Concurrent::CountDownLatch.new(3)
  #
  #   waiter = Thread.new do
  #     latch.wait()
  #     puts ("Waiter released")
  #   end
  #
  #   decrementer = Thread.new do
  #     sleep(1)
  #     latch.count_down
  #     puts latch.count
  #
  #     sleep(1)
  #     latch.count_down
  #     puts latch.count
  #
  #     sleep(1)
  #     latch.count_down
  #     puts latch.count
  #   end
  #
  #   [waiter, decrementer].each(&:join)
  class CountDownLatch < CountDownLatchImplementation
  end
end
