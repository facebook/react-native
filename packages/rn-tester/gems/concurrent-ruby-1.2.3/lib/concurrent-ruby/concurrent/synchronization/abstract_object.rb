module Concurrent
  module Synchronization

    # @!visibility private
    # @!macro internal_implementation_note
    class AbstractObject
      def initialize
        # nothing to do
      end

      # @!visibility private
      # @abstract
      def full_memory_barrier
        raise NotImplementedError
      end

      def self.attr_volatile(*names)
        raise NotImplementedError
      end
    end
  end
end
