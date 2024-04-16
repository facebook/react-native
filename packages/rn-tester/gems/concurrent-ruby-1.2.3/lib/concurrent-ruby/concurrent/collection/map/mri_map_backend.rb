require 'thread'
require 'concurrent/collection/map/non_concurrent_map_backend'

module Concurrent

  # @!visibility private
  module Collection

    # @!visibility private
    class MriMapBackend < NonConcurrentMapBackend

      def initialize(options = nil, &default_proc)
        super(options, &default_proc)
        @write_lock = Mutex.new
      end

      def []=(key, value)
        @write_lock.synchronize { super }
      end

      def compute_if_absent(key)
        if NULL != (stored_value = @backend.fetch(key, NULL)) # fast non-blocking path for the most likely case
          stored_value
        else
          @write_lock.synchronize { super }
        end
      end

      def compute_if_present(key)
        @write_lock.synchronize { super }
      end

      def compute(key)
        @write_lock.synchronize { super }
      end

      def merge_pair(key, value)
        @write_lock.synchronize { super }
      end

      def replace_pair(key, old_value, new_value)
        @write_lock.synchronize { super }
      end

      def replace_if_exists(key, new_value)
        @write_lock.synchronize { super }
      end

      def get_and_set(key, value)
        @write_lock.synchronize { super }
      end

      def delete(key)
        @write_lock.synchronize { super }
      end

      def delete_pair(key, value)
        @write_lock.synchronize { super }
      end

      def clear
        @write_lock.synchronize { super }
      end
    end
  end
end
