require 'concurrent/thread_safe/util'
require 'concurrent/tuple'

module Concurrent

  # @!visibility private
  module ThreadSafe

    # @!visibility private
    module Util

      # @!visibility private
      class PowerOfTwoTuple < Concurrent::Tuple

        def initialize(size)
          raise ArgumentError, "size must be a power of 2 (#{size.inspect} provided)" unless size > 0 && size & (size - 1) == 0
          super(size)
        end

        def hash_to_index(hash)
          (size - 1) & hash
        end

        def volatile_get_by_hash(hash)
          volatile_get(hash_to_index(hash))
        end

        def volatile_set_by_hash(hash, value)
          volatile_set(hash_to_index(hash), value)
        end

        def next_in_size_table
          self.class.new(size << 1)
        end
      end
    end
  end
end
