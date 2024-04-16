require 'concurrent/synchronization/full_memory_barrier'

module Concurrent
  module Synchronization

    # @!visibility private
    # @!macro internal_implementation_note
    #
    # By extending this module, a class and all its children are marked to be constructed safely. Meaning that
    # all writes (ivar initializations) are made visible to all readers of newly constructed object. It ensures
    # same behaviour as Java's final fields.
    #
    # Due to using Kernel#extend, the module is not included again if already present in the ancestors,
    # which avoids extra overhead.
    #
    # @example
    #   class AClass < Concurrent::Synchronization::Object
    #     extend Concurrent::Synchronization::SafeInitialization
    #
    #     def initialize
    #       @AFinalValue = 'value' # published safely, #foo will never return nil
    #     end
    #
    #     def foo
    #       @AFinalValue
    #     end
    #   end
    module SafeInitialization
      def new(*args, &block)
        super(*args, &block)
      ensure
        Concurrent::Synchronization.full_memory_barrier
      end
    end
  end
end
