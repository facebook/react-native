module Concurrent

  # @!visibility private
  module ThreadSafe

    # @!visibility private
    module Util

      # TODO (pitr-ch 15-Oct-2016): migrate to Utility::NativeInteger
      FIXNUM_BIT_SIZE = (0.size * 8) - 2
      MAX_INT         = (2 ** FIXNUM_BIT_SIZE) - 1
      # TODO (pitr-ch 15-Oct-2016): migrate to Utility::ProcessorCounter
      CPU_COUNT       = 16 # is there a way to determine this?
    end
  end
end
