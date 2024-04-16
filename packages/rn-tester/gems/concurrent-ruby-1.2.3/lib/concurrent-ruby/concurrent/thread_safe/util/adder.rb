require 'concurrent/thread_safe/util'
require 'concurrent/thread_safe/util/striped64'

module Concurrent

  # @!visibility private
  module ThreadSafe
    
    # @!visibility private
    module Util

      # A Ruby port of the Doug Lea's jsr166e.LondAdder class version 1.8
      # available in public domain.
      #
      # Original source code available here:
      # http://gee.cs.oswego.edu/cgi-bin/viewcvs.cgi/jsr166/src/jsr166e/LongAdder.java?revision=1.8
      #
      # One or more variables that together maintain an initially zero
      # sum. When updates (method +add+) are contended across threads,
      # the set of variables may grow dynamically to reduce contention.
      # Method +sum+ returns the current total combined across the
      # variables maintaining the sum.
      #
      # This class is usually preferable to single +Atomic+ reference when
      # multiple threads update a common sum that is used for purposes such
      # as collecting statistics, not for fine-grained synchronization
      # control.  Under low update contention, the two classes have similar
      # characteristics. But under high contention, expected throughput of
      # this class is significantly higher, at the expense of higher space
      # consumption.
      # 
      # @!visibility private
      class Adder < Striped64
        # Adds the given value.
        def add(x)
          if (current_cells = cells) || !cas_base_computed {|current_base| current_base + x}
            was_uncontended = true
            hash            = hash_code
            unless current_cells && (cell = current_cells.volatile_get_by_hash(hash)) && (was_uncontended = cell.cas_computed {|current_value| current_value + x})
              retry_update(x, hash, was_uncontended) {|current_value| current_value + x}
            end
          end
        end

        def increment
          add(1)
        end

        def decrement
          add(-1)
        end

        # Returns the current sum.  The returned value is _NOT_ an
        # atomic snapshot: Invocation in the absence of concurrent
        # updates returns an accurate result, but concurrent updates that
        # occur while the sum is being calculated might not be
        # incorporated.
        def sum
          x = base
          if current_cells = cells
            current_cells.each do |cell|
              x += cell.value if cell
            end
          end
          x
        end

        def reset
          internal_reset(0)
        end
      end
    end
  end
end
