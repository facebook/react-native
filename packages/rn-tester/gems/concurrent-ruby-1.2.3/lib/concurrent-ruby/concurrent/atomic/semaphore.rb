require 'concurrent/atomic/mutex_semaphore'

module Concurrent

  ###################################################################

  # @!macro semaphore_method_initialize
  #
  #   Create a new `Semaphore` with the initial `count`.
  #
  #   @param [Fixnum] count the initial count
  #
  #   @raise [ArgumentError] if `count` is not an integer

  # @!macro semaphore_method_acquire
  #
  #   Acquires the given number of permits from this semaphore,
  #     blocking until all are available. If a block is given,
  #     yields to it and releases the permits afterwards.
  #
  #   @param [Fixnum] permits Number of permits to acquire
  #
  #   @raise [ArgumentError] if `permits` is not an integer or is less than zero
  #
  #   @return [nil, BasicObject] Without a block, `nil` is returned. If a block
  #   is given, its return value is returned.

  # @!macro semaphore_method_available_permits
  #
  #   Returns the current number of permits available in this semaphore.
  #
  #   @return [Integer]

  # @!macro semaphore_method_drain_permits
  #
  #   Acquires and returns all permits that are immediately available.
  #
  #   @return [Integer]

  # @!macro semaphore_method_try_acquire
  #
  #   Acquires the given number of permits from this semaphore,
  #     only if all are available at the time of invocation or within
  #     `timeout` interval. If a block is given, yields to it if the permits
  #     were successfully acquired, and releases them afterward, returning the
  #     block's return value.
  #
  #   @param [Fixnum] permits the number of permits to acquire
  #
  #   @param [Fixnum] timeout the number of seconds to wait for the counter
  #     or `nil` to return immediately
  #
  #   @raise [ArgumentError] if `permits` is not an integer or is less than zero
  #
  #   @return [true, false, nil, BasicObject] `false` if no permits are
  #     available, `true` when acquired a permit. If a block is given, the
  #     block's return value is returned if the permits were acquired; if not,
  #     `nil` is returned.

  # @!macro semaphore_method_release
  #
  #   Releases the given number of permits, returning them to the semaphore.
  #
  #   @param [Fixnum] permits Number of permits to return to the semaphore.
  #
  #   @raise [ArgumentError] if `permits` is not a number or is less than zero
  #
  #   @return [nil]

  ###################################################################

  # @!macro semaphore_public_api
  #
  #   @!method initialize(count)
  #     @!macro semaphore_method_initialize
  #
  #   @!method acquire(permits = 1)
  #     @!macro semaphore_method_acquire
  #
  #   @!method available_permits
  #     @!macro semaphore_method_available_permits
  #
  #   @!method drain_permits
  #     @!macro semaphore_method_drain_permits
  #
  #   @!method try_acquire(permits = 1, timeout = nil)
  #     @!macro semaphore_method_try_acquire
  #
  #   @!method release(permits = 1)
  #     @!macro semaphore_method_release

  ###################################################################

  # @!visibility private
  # @!macro internal_implementation_note
  SemaphoreImplementation = if Concurrent.on_jruby?
                              require 'concurrent/utility/native_extension_loader'
                              JavaSemaphore
                            else
                              MutexSemaphore
                            end
  private_constant :SemaphoreImplementation

  # @!macro semaphore
  #
  #   A counting semaphore. Conceptually, a semaphore maintains a set of
  #   permits. Each {#acquire} blocks if necessary until a permit is
  #   available, and then takes it. Each {#release} adds a permit, potentially
  #   releasing a blocking acquirer.
  #   However, no actual permit objects are used; the Semaphore just keeps a
  #   count of the number available and acts accordingly.
  #   Alternatively, permits may be acquired within a block, and automatically
  #   released after the block finishes executing.
  #
  # @!macro semaphore_public_api
  # @example
  #   semaphore = Concurrent::Semaphore.new(2)
  #
  #   t1 = Thread.new do
  #     semaphore.acquire
  #     puts "Thread 1 acquired semaphore"
  #   end
  #
  #   t2 = Thread.new do
  #     semaphore.acquire
  #     puts "Thread 2 acquired semaphore"
  #   end
  #
  #   t3 = Thread.new do
  #     semaphore.acquire
  #     puts "Thread 3 acquired semaphore"
  #   end
  #
  #   t4 = Thread.new do
  #     sleep(2)
  #     puts "Thread 4 releasing semaphore"
  #     semaphore.release
  #   end
  #
  #   [t1, t2, t3, t4].each(&:join)
  #
  #   # prints:
  #   # Thread 3 acquired semaphore
  #   # Thread 2 acquired semaphore
  #   # Thread 4 releasing semaphore
  #   # Thread 1 acquired semaphore
  #
  # @example
  #   semaphore = Concurrent::Semaphore.new(1)
  #
  #   puts semaphore.available_permits
  #   semaphore.acquire do
  #     puts semaphore.available_permits
  #   end
  #   puts semaphore.available_permits
  #
  #   # prints:
  #   # 1
  #   # 0
  #   # 1
  class Semaphore < SemaphoreImplementation
  end
end
