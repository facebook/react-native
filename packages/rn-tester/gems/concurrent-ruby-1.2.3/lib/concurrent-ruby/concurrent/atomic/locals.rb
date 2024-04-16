require 'fiber'
require 'concurrent/utility/engine'
require 'concurrent/constants'

module Concurrent
  # @!visibility private
  # @!macro internal_implementation_note
  #
  # An abstract implementation of local storage, with sub-classes for
  # per-thread and per-fiber locals.
  #
  # Each execution context (EC, thread or fiber) has a lazily initialized array
  # of local variable values. Each time a new local variable is created, we
  # allocate an "index" for it.
  #
  # For example, if the allocated index is 1, that means slot #1 in EVERY EC's
  # locals array will be used for the value of that variable.
  #
  # The good thing about using a per-EC structure to hold values, rather than
  # a global, is that no synchronization is needed when reading and writing
  # those values (since the structure is only ever accessed by a single
  # thread).
  #
  # Of course, when a local variable is GC'd, 1) we need to recover its index
  # for use by other new local variables (otherwise the locals arrays could
  # get bigger and bigger with time), and 2) we need to null out all the
  # references held in the now-unused slots (both to avoid blocking GC of those
  # objects, and also to prevent "stale" values from being passed on to a new
  # local when the index is reused).
  #
  # Because we need to null out freed slots, we need to keep references to
  # ALL the locals arrays, so we can null out the appropriate slots in all of
  # them. This is why we need to use a finalizer to clean up the locals array
  # when the EC goes out of scope.
  class AbstractLocals
    def initialize
      @free = []
      @lock = Mutex.new
      @all_arrays = {}
      @next = 0
    end

    def synchronize
      @lock.synchronize { yield }
    end

    if Concurrent.on_cruby?
      def weak_synchronize
        yield
      end
    else
      alias_method :weak_synchronize, :synchronize
    end

    def next_index(local)
      index = synchronize do
        if @free.empty?
          @next += 1
        else
          @free.pop
        end
      end

      # When the local goes out of scope, we should free the associated index
      # and all values stored into it.
      ObjectSpace.define_finalizer(local, local_finalizer(index))

      index
    end

    def free_index(index)
      weak_synchronize do
        # The cost of GC'ing a TLV is linear in the number of ECs using local
        # variables. But that is natural! More ECs means more storage is used
        # per local variable. So naturally more CPU time is required to free
        # more storage.
        #
        # DO NOT use each_value which might conflict with new pair assignment
        # into the hash in #set method.
        @all_arrays.values.each do |locals|
          locals[index] = nil
        end

        # free index has to be published after the arrays are cleared:
        @free << index
      end
    end

    def fetch(index)
      locals = self.locals
      value = locals ? locals[index] : nil

      if nil == value
        yield
      elsif NULL.equal?(value)
        nil
      else
        value
      end
    end

    def set(index, value)
      locals = self.locals!
      locals[index] = (nil == value ? NULL : value)

      value
    end

    private

    # When the local goes out of scope, clean up that slot across all locals currently assigned.
    def local_finalizer(index)
      proc do
        free_index(index)
      end
    end

    # When a thread/fiber goes out of scope, remove the array from @all_arrays.
    def thread_fiber_finalizer(array_object_id)
      proc do
        weak_synchronize do
          @all_arrays.delete(array_object_id)
        end
      end
    end

    # Returns the locals for the current scope, or nil if none exist.
    def locals
      raise NotImplementedError
    end

    # Returns the locals for the current scope, creating them if necessary.
    def locals!
      raise NotImplementedError
    end
  end

  # @!visibility private
  # @!macro internal_implementation_note
  # An array-backed storage of indexed variables per thread.
  class ThreadLocals < AbstractLocals
    def locals
      Thread.current.thread_variable_get(:concurrent_thread_locals)
    end

    def locals!
      thread = Thread.current
      locals = thread.thread_variable_get(:concurrent_thread_locals)

      unless locals
        locals = thread.thread_variable_set(:concurrent_thread_locals, [])
        weak_synchronize do
          @all_arrays[locals.object_id] = locals
        end
        # When the thread goes out of scope, we should delete the associated locals:
        ObjectSpace.define_finalizer(thread, thread_fiber_finalizer(locals.object_id))
      end

      locals
    end
  end

  # @!visibility private
  # @!macro internal_implementation_note
  # An array-backed storage of indexed variables per fiber.
  class FiberLocals < AbstractLocals
    def locals
      Thread.current[:concurrent_fiber_locals]
    end

    def locals!
      thread = Thread.current
      locals = thread[:concurrent_fiber_locals]

      unless locals
        locals = thread[:concurrent_fiber_locals] = []
        weak_synchronize do
          @all_arrays[locals.object_id] = locals
        end
        # When the fiber goes out of scope, we should delete the associated locals:
        ObjectSpace.define_finalizer(Fiber.current, thread_fiber_finalizer(locals.object_id))
      end

      locals
    end
  end

  private_constant :AbstractLocals, :ThreadLocals, :FiberLocals
end
