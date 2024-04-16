require 'concurrent/errors'

module Concurrent

  # Define update methods that use direct paths
  #
  # @!visibility private
  # @!macro internal_implementation_note
  module AtomicDirectUpdate
    def update
      true until compare_and_set(old_value = get, new_value = yield(old_value))
      new_value
    end

    def try_update
      old_value = get
      new_value = yield old_value

      return unless compare_and_set old_value, new_value

      new_value
    end

    def try_update!
      old_value = get
      new_value = yield old_value
      unless compare_and_set(old_value, new_value)
        if $VERBOSE
          raise ConcurrentUpdateError, "Update failed"
        else
          raise ConcurrentUpdateError, "Update failed", ConcurrentUpdateError::CONC_UP_ERR_BACKTRACE
        end
      end
      new_value
    end
  end
end
