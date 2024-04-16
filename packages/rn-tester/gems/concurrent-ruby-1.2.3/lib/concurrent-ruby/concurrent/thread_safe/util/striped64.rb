require 'concurrent/thread_safe/util'
require 'concurrent/thread_safe/util/power_of_two_tuple'
require 'concurrent/thread_safe/util/volatile'
require 'concurrent/thread_safe/util/xor_shift_random'

module Concurrent

  # @!visibility private
  module ThreadSafe

    # @!visibility private
    module Util

      # A Ruby port of the Doug Lea's jsr166e.Striped64 class version 1.6
      # available in public domain.
      #
      # Original source code available here:
      # http://gee.cs.oswego.edu/cgi-bin/viewcvs.cgi/jsr166/src/jsr166e/Striped64.java?revision=1.6
      #
      # Class holding common representation and mechanics for classes supporting
      # dynamic striping on 64bit values.
      #
      # This class maintains a lazily-initialized table of atomically updated
      # variables, plus an extra +base+ field. The table size is a power of two.
      # Indexing uses masked per-thread hash codes. Nearly all methods on this
      # class are private, accessed directly by subclasses.
      #
      # Table entries are of class +Cell+; a variant of AtomicLong padded to
      # reduce cache contention on most processors. Padding is overkill for most
      # Atomics because they are usually irregularly scattered in memory and thus
      # don't interfere much with each other. But Atomic objects residing in
      # arrays will tend to be placed adjacent to each other, and so will most
      # often share cache lines (with a huge negative performance impact) without
      # this precaution.
      #
      # In part because +Cell+s are relatively large, we avoid creating them until
      # they are needed. When there is no contention, all updates are made to the
      # +base+ field. Upon first contention (a failed CAS on +base+ update), the
      # table is initialized to size 2. The table size is doubled upon further
      # contention until reaching the nearest power of two greater than or equal
      # to the number of CPUS. Table slots remain empty (+nil+) until they are
      # needed.
      #
      # A single spinlock (+busy+) is used for initializing and resizing the
      # table, as well as populating slots with new +Cell+s. There is no need for
      # a blocking lock: When the lock is not available, threads try other slots
      # (or the base). During these retries, there is increased contention and
      # reduced locality, which is still better than alternatives.
      #
      # Per-thread hash codes are initialized to random values. Contention and/or
      # table collisions are indicated by failed CASes when performing an update
      # operation (see method +retry_update+). Upon a collision, if the table size
      # is less than the capacity, it is doubled in size unless some other thread
      # holds the lock. If a hashed slot is empty, and lock is available, a new
      # +Cell+ is created. Otherwise, if the slot exists, a CAS is tried. Retries
      # proceed by "double hashing", using a secondary hash (XorShift) to try to
      # find a free slot.
      #
      # The table size is capped because, when there are more threads than CPUs,
      # supposing that each thread were bound to a CPU, there would exist a
      # perfect hash function mapping threads to slots that eliminates collisions.
      # When we reach capacity, we search for this mapping by randomly varying the
      # hash codes of colliding threads. Because search is random, and collisions
      # only become known via CAS failures, convergence can be slow, and because
      # threads are typically not bound to CPUS forever, may not occur at all.
      # However, despite these limitations, observed contention rates are
      # typically low in these cases.
      #
      # It is possible for a +Cell+ to become unused when threads that once hashed
      # to it terminate, as well as in the case where doubling the table causes no
      # thread to hash to it under expanded mask. We do not try to detect or
      # remove such cells, under the assumption that for long-running instances,
      # observed contention levels will recur, so the cells will eventually be
      # needed again; and for short-lived ones, it does not matter.
      #
      # @!visibility private
      class Striped64

        # Padded variant of AtomicLong supporting only raw accesses plus CAS.
        # The +value+ field is placed between pads, hoping that the JVM doesn't
        # reorder them.
        #
        # Optimisation note: It would be possible to use a release-only
        # form of CAS here, if it were provided.
        #
        # @!visibility private
        class Cell < Concurrent::AtomicReference

          alias_method :cas, :compare_and_set

          def cas_computed
            cas(current_value = value, yield(current_value))
          end

          # @!visibility private
          def self.padding
            # TODO: this only adds padding after the :value slot, need to find a way to add padding before the slot
            # TODO (pitr-ch 28-Jul-2018): the padding instance vars may not be created
            # hide from yardoc in a method
            attr_reader :padding_0, :padding_1, :padding_2, :padding_3, :padding_4, :padding_5, :padding_6, :padding_7, :padding_8, :padding_9, :padding_10, :padding_11
          end
          padding
        end

        extend Volatile
        attr_volatile :cells, # Table of cells. When non-null, size is a power of 2.
          :base,  # Base value, used mainly when there is no contention, but also as a fallback during table initialization races. Updated via CAS.
          :busy   # Spinlock (locked via CAS) used when resizing and/or creating Cells.

        alias_method :busy?, :busy

        def initialize
          super()
          self.busy = false
          self.base = 0
        end

        # Handles cases of updates involving initialization, resizing,
        # creating new Cells, and/or contention. See above for
        # explanation. This method suffers the usual non-modularity
        # problems of optimistic retry code, relying on rechecked sets of
        # reads.
        #
        # Arguments:
        # [+x+]
        #   the value
        # [+hash_code+]
        #   hash code used
        # [+x+]
        #   false if CAS failed before call
        def retry_update(x, hash_code, was_uncontended) # :yields: current_value
          hash     = hash_code
          collided = false # True if last slot nonempty
          while true
            if current_cells = cells
              if !(cell = current_cells.volatile_get_by_hash(hash))
                if busy?
                  collided = false
                else # Try to attach new Cell
                  if try_to_install_new_cell(Cell.new(x), hash) # Optimistically create and try to insert new cell
                    break
                  else
                    redo # Slot is now non-empty
                  end
                end
              elsif !was_uncontended # CAS already known to fail
                was_uncontended = true # Continue after rehash
              elsif cell.cas_computed {|current_value| yield current_value}
                break
              elsif current_cells.size >= CPU_COUNT || cells != current_cells # At max size or stale
                collided = false
              elsif collided && expand_table_unless_stale(current_cells)
                collided = false
                redo # Retry with expanded table
              else
                collided = true
              end
              hash = XorShiftRandom.xorshift(hash)

            elsif try_initialize_cells(x, hash) || cas_base_computed {|current_base| yield current_base}
              break
            end
          end
          self.hash_code = hash
        end

        private
        # Static per-thread hash code key. Shared across all instances to
        # reduce Thread locals pollution and because adjustments due to
        # collisions in one table are likely to be appropriate for
        # others.
        THREAD_LOCAL_KEY = "#{name}.hash_code".to_sym

        # A thread-local hash code accessor. The code is initially
        # random, but may be set to a different value upon collisions.
        def hash_code
          Thread.current[THREAD_LOCAL_KEY] ||= XorShiftRandom.get
        end

        def hash_code=(hash)
          Thread.current[THREAD_LOCAL_KEY] = hash
        end

        # Sets base and all +cells+ to the given value.
        def internal_reset(initial_value)
          current_cells = cells
          self.base     = initial_value
          if current_cells
            current_cells.each do |cell|
              cell.value = initial_value if cell
            end
          end
        end

        def cas_base_computed
          cas_base(current_base = base, yield(current_base))
        end

        def free?
          !busy?
        end

        def try_initialize_cells(x, hash)
          if free? && !cells
            try_in_busy do
              unless cells # Recheck under lock
                new_cells = PowerOfTwoTuple.new(2)
                new_cells.volatile_set_by_hash(hash, Cell.new(x))
                self.cells = new_cells
              end
            end
          end
        end

        def expand_table_unless_stale(current_cells)
          try_in_busy do
            if current_cells == cells # Recheck under lock
              new_cells = current_cells.next_in_size_table
              current_cells.each_with_index {|x, i| new_cells.volatile_set(i, x)}
              self.cells = new_cells
            end
          end
        end

        def try_to_install_new_cell(new_cell, hash)
          try_in_busy do
            # Recheck under lock
            if (current_cells = cells) && !current_cells.volatile_get(i = current_cells.hash_to_index(hash))
              current_cells.volatile_set(i, new_cell)
            end
          end
        end

        def try_in_busy
          if cas_busy(false, true)
            begin
              yield
            ensure
              self.busy = false
            end
          end
        end
      end
    end
  end
end
