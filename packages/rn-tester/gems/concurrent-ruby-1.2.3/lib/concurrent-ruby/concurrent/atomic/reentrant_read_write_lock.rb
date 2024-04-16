require 'thread'
require 'concurrent/atomic/atomic_reference'
require 'concurrent/atomic/atomic_fixnum'
require 'concurrent/errors'
require 'concurrent/synchronization/object'
require 'concurrent/synchronization/lock'
require 'concurrent/atomic/lock_local_var'

module Concurrent

  # Re-entrant read-write lock implementation
  #
  # Allows any number of concurrent readers, but only one concurrent writer
  # (And while the "write" lock is taken, no read locks can be obtained either.
  # Hence, the write lock can also be called an "exclusive" lock.)
  #
  # If another thread has taken a read lock, any thread which wants a write lock
  # will block until all the readers release their locks. However, once a thread
  # starts waiting to obtain a write lock, any additional readers that come along
  # will also wait (so writers are not starved).
  #
  # A thread can acquire both a read and write lock at the same time. A thread can
  # also acquire a read lock OR a write lock more than once. Only when the read (or
  # write) lock is released as many times as it was acquired, will the thread
  # actually let it go, allowing other threads which might have been waiting
  # to proceed. Therefore the lock can be upgraded by first acquiring
  # read lock and then write lock and that the lock can be downgraded by first
  # having both read and write lock a releasing just the write lock.
  #
  # If both read and write locks are acquired by the same thread, it is not strictly
  # necessary to release them in the same order they were acquired. In other words,
  # the following code is legal:
  #
  # @example
  #   lock = Concurrent::ReentrantReadWriteLock.new
  #   lock.acquire_write_lock
  #   lock.acquire_read_lock
  #   lock.release_write_lock
  #   # At this point, the current thread is holding only a read lock, not a write
  #   # lock. So other threads can take read locks, but not a write lock.
  #   lock.release_read_lock
  #   # Now the current thread is not holding either a read or write lock, so
  #   # another thread could potentially acquire a write lock.
  #
  # This implementation was inspired by `java.util.concurrent.ReentrantReadWriteLock`.
  #
  # @example
  #   lock = Concurrent::ReentrantReadWriteLock.new
  #   lock.with_read_lock  { data.retrieve }
  #   lock.with_write_lock { data.modify! }
  #
  # @see http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/locks/ReentrantReadWriteLock.html java.util.concurrent.ReentrantReadWriteLock
  class ReentrantReadWriteLock < Synchronization::Object

    # Implementation notes:
    #
    # A goal is to make the uncontended path for both readers/writers mutex-free
    # Only if there is reader-writer or writer-writer contention, should mutexes be used
    # Otherwise, a single CAS operation is all we need to acquire/release a lock
    #
    # Internal state is represented by a single integer ("counter"), and updated
    #   using atomic compare-and-swap operations
    # When the counter is 0, the lock is free
    # Each thread which has one OR MORE read locks increments the counter by 1
    #   (and decrements by 1 when releasing the read lock)
    # The counter is increased by (1 << 15) for each writer waiting to acquire the
    #   write lock, and by (1 << 29) if the write lock is taken
    #
    # Additionally, each thread uses a thread-local variable to count how many times
    #   it has acquired a read lock, AND how many times it has acquired a write lock.
    # It uses a similar trick; an increment of 1 means a read lock was taken, and
    #   an increment of (1 << 15) means a write lock was taken
    # This is what makes re-entrancy possible
    #
    # 2 rules are followed to ensure good liveness properties:
    # 1) Once a writer has queued up and is waiting for a write lock, no other thread
    #    can take a lock without waiting
    # 2) When a write lock is released, readers are given the "first chance" to wake
    #    up and acquire a read lock
    # Following these rules means readers and writers tend to "take turns", so neither
    #   can starve the other, even under heavy contention

    # @!visibility private
    READER_BITS    = 15
    # @!visibility private
    WRITER_BITS    = 14

    # Used with @Counter:
    # @!visibility private
    WAITING_WRITER = 1 << READER_BITS
    # @!visibility private
    RUNNING_WRITER = 1 << (READER_BITS + WRITER_BITS)
    # @!visibility private
    MAX_READERS    = WAITING_WRITER - 1
    # @!visibility private
    MAX_WRITERS    = RUNNING_WRITER - MAX_READERS - 1

    # Used with @HeldCount:
    # @!visibility private
    WRITE_LOCK_HELD = 1 << READER_BITS
    # @!visibility private
    READ_LOCK_MASK  = WRITE_LOCK_HELD - 1
    # @!visibility private
    WRITE_LOCK_MASK = MAX_WRITERS

    safe_initialization!

    # Create a new `ReentrantReadWriteLock` in the unlocked state.
    def initialize
      super()
      @Counter    = AtomicFixnum.new(0)       # single integer which represents lock state
      @ReadQueue  = Synchronization::Lock.new # used to queue waiting readers
      @WriteQueue = Synchronization::Lock.new # used to queue waiting writers
      @HeldCount  = LockLocalVar.new(0) # indicates # of R & W locks held by this thread
    end

    # Execute a block operation within a read lock.
    #
    # @yield the task to be performed within the lock.
    #
    # @return [Object] the result of the block operation.
    #
    # @raise [ArgumentError] when no block is given.
    # @raise [Concurrent::ResourceLimitError] if the maximum number of readers
    #   is exceeded.
    def with_read_lock
      raise ArgumentError.new('no block given') unless block_given?
      acquire_read_lock
      begin
        yield
      ensure
        release_read_lock
      end
    end

    # Execute a block operation within a write lock.
    #
    # @yield the task to be performed within the lock.
    #
    # @return [Object] the result of the block operation.
    #
    # @raise [ArgumentError] when no block is given.
    # @raise [Concurrent::ResourceLimitError] if the maximum number of readers
    #   is exceeded.
    def with_write_lock
      raise ArgumentError.new('no block given') unless block_given?
      acquire_write_lock
      begin
        yield
      ensure
        release_write_lock
      end
    end

    # Acquire a read lock. If a write lock is held by another thread, will block
    # until it is released.
    #
    # @return [Boolean] true if the lock is successfully acquired
    #
    # @raise [Concurrent::ResourceLimitError] if the maximum number of readers
    #   is exceeded.
    def acquire_read_lock
      if (held = @HeldCount.value) > 0
        # If we already have a lock, there's no need to wait
        if held & READ_LOCK_MASK == 0
          # But we do need to update the counter, if we were holding a write
          #   lock but not a read lock
          @Counter.update { |c| c + 1 }
        end
        @HeldCount.value = held + 1
        return true
      end

      while true
        c = @Counter.value
        raise ResourceLimitError.new('Too many reader threads') if max_readers?(c)

        # If a writer is waiting OR running when we first queue up, we need to wait
        if waiting_or_running_writer?(c)
          # Before going to sleep, check again with the ReadQueue mutex held
          @ReadQueue.synchronize do
            @ReadQueue.ns_wait if waiting_or_running_writer?
          end
          # Note: the above 'synchronize' block could have used #wait_until,
          #   but that waits repeatedly in a loop, checking the wait condition
          #   each time it wakes up (to protect against spurious wakeups)
          # But we are already in a loop, which is only broken when we successfully
          #   acquire the lock! So we don't care about spurious wakeups, and would
          #   rather not pay the extra overhead of using #wait_until

          # After a reader has waited once, they are allowed to "barge" ahead of waiting writers
          # But if a writer is *running*, the reader still needs to wait (naturally)
          while true
            c = @Counter.value
            if running_writer?(c)
              @ReadQueue.synchronize do
                @ReadQueue.ns_wait if running_writer?
              end
            elsif @Counter.compare_and_set(c, c+1)
              @HeldCount.value = held + 1
              return true
            end
          end
        elsif @Counter.compare_and_set(c, c+1)
          @HeldCount.value = held + 1
          return true
        end
      end
    end

    # Try to acquire a read lock and return true if we succeed. If it cannot be
    # acquired immediately, return false.
    #
    # @return [Boolean] true if the lock is successfully acquired
    def try_read_lock
      if (held = @HeldCount.value) > 0
        if held & READ_LOCK_MASK == 0
          # If we hold a write lock, but not a read lock...
          @Counter.update { |c| c + 1 }
        end
        @HeldCount.value = held + 1
        return true
      else
        c = @Counter.value
        if !waiting_or_running_writer?(c) && @Counter.compare_and_set(c, c+1)
          @HeldCount.value = held + 1
          return true
        end
      end
      false
    end

    # Release a previously acquired read lock.
    #
    # @return [Boolean] true if the lock is successfully released
    def release_read_lock
      held = @HeldCount.value = @HeldCount.value - 1
      rlocks_held = held & READ_LOCK_MASK
      if rlocks_held == 0
        c = @Counter.update { |counter| counter - 1 }
        # If one or more writers were waiting, and we were the last reader, wake a writer up
        if waiting_or_running_writer?(c) && running_readers(c) == 0
          @WriteQueue.signal
        end
      elsif rlocks_held == READ_LOCK_MASK
        raise IllegalOperationError, "Cannot release a read lock which is not held"
      end
      true
    end

    # Acquire a write lock. Will block and wait for all active readers and writers.
    #
    # @return [Boolean] true if the lock is successfully acquired
    #
    # @raise [Concurrent::ResourceLimitError] if the maximum number of writers
    #   is exceeded.
    def acquire_write_lock
      if (held = @HeldCount.value) >= WRITE_LOCK_HELD
        # if we already have a write (exclusive) lock, there's no need to wait
        @HeldCount.value = held + WRITE_LOCK_HELD
        return true
      end

      while true
        c = @Counter.value
        raise ResourceLimitError.new('Too many writer threads') if max_writers?(c)

        # To go ahead and take the lock without waiting, there must be no writer
        #   running right now, AND no writers who came before us still waiting to
        #   acquire the lock
        # Additionally, if any read locks have been taken, we must hold all of them
        if held > 0 && @Counter.compare_and_set(1, c+RUNNING_WRITER)
          # If we are the only one reader and successfully swap the RUNNING_WRITER bit on, then we can go ahead
          @HeldCount.value = held + WRITE_LOCK_HELD
          return true
        elsif @Counter.compare_and_set(c, c+WAITING_WRITER)
          while true
            # Now we have successfully incremented, so no more readers will be able to increment
            #   (they will wait instead)
            # However, readers OR writers could decrement right here
            @WriteQueue.synchronize do
              # So we have to do another check inside the synchronized section
              # If a writer OR another reader is running, then go to sleep
              c = @Counter.value
              @WriteQueue.ns_wait if running_writer?(c) || running_readers(c) != held
            end
            # Note: if you are thinking of replacing the above 'synchronize' block
            # with #wait_until, read the comment in #acquire_read_lock first!

            # We just came out of a wait
            # If we successfully turn the RUNNING_WRITER bit on with an atomic swap,
            #   then we are OK to stop waiting and go ahead
            # Otherwise go back and wait again
            c = @Counter.value
            if !running_writer?(c) &&
               running_readers(c) == held &&
               @Counter.compare_and_set(c, c+RUNNING_WRITER-WAITING_WRITER)
              @HeldCount.value = held + WRITE_LOCK_HELD
              return true
            end
          end
        end
      end
    end

    # Try to acquire a write lock and return true if we succeed. If it cannot be
    # acquired immediately, return false.
    #
    # @return [Boolean] true if the lock is successfully acquired
    def try_write_lock
      if (held = @HeldCount.value) >= WRITE_LOCK_HELD
        @HeldCount.value = held + WRITE_LOCK_HELD
        return true
      else
        c = @Counter.value
        if !waiting_or_running_writer?(c) &&
           running_readers(c) == held &&
           @Counter.compare_and_set(c, c+RUNNING_WRITER)
           @HeldCount.value = held + WRITE_LOCK_HELD
          return true
        end
      end
      false
    end

    # Release a previously acquired write lock.
    #
    # @return [Boolean] true if the lock is successfully released
    def release_write_lock
      held = @HeldCount.value = @HeldCount.value - WRITE_LOCK_HELD
      wlocks_held = held & WRITE_LOCK_MASK
      if wlocks_held == 0
        c = @Counter.update { |counter| counter - RUNNING_WRITER }
        @ReadQueue.broadcast
        @WriteQueue.signal if waiting_writers(c) > 0
      elsif wlocks_held == WRITE_LOCK_MASK
        raise IllegalOperationError, "Cannot release a write lock which is not held"
      end
      true
    end

    private

    # @!visibility private
    def running_readers(c = @Counter.value)
      c & MAX_READERS
    end

    # @!visibility private
    def running_readers?(c = @Counter.value)
      (c & MAX_READERS) > 0
    end

    # @!visibility private
    def running_writer?(c = @Counter.value)
      c >= RUNNING_WRITER
    end

    # @!visibility private
    def waiting_writers(c = @Counter.value)
      (c & MAX_WRITERS) >> READER_BITS
    end

    # @!visibility private
    def waiting_or_running_writer?(c = @Counter.value)
      c >= WAITING_WRITER
    end

    # @!visibility private
    def max_readers?(c = @Counter.value)
      (c & MAX_READERS) == MAX_READERS
    end

    # @!visibility private
    def max_writers?(c = @Counter.value)
      (c & MAX_WRITERS) == MAX_WRITERS
    end
  end
end
