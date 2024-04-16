require 'concurrent/collection/map/non_concurrent_map_backend'

module Concurrent

  # @!visibility private
  module Collection

    # @!visibility private
    class SynchronizedMapBackend < NonConcurrentMapBackend

      def initialize(*args, &block)
        super

        # WARNING: Mutex is a non-reentrant lock, so the synchronized methods are
        # not allowed to call each other.
        @mutex = Mutex.new
      end

      def [](key)
        @mutex.synchronize { super }
      end

      def []=(key, value)
        @mutex.synchronize { super }
      end

      def compute_if_absent(key)
        @mutex.synchronize { super }
      end

      def compute_if_present(key)
        @mutex.synchronize { super }
      end

      def compute(key)
        @mutex.synchronize { super }
      end

      def merge_pair(key, value)
        @mutex.synchronize { super }
      end

      def replace_pair(key, old_value, new_value)
        @mutex.synchronize { super }
      end

      def replace_if_exists(key, new_value)
        @mutex.synchronize { super }
      end

      def get_and_set(key, value)
        @mutex.synchronize { super }
      end

      def key?(key)
        @mutex.synchronize { super }
      end

      def delete(key)
        @mutex.synchronize { super }
      end

      def delete_pair(key, value)
        @mutex.synchronize { super }
      end

      def clear
        @mutex.synchronize { super }
      end

      def size
        @mutex.synchronize { super }
      end

      def get_or_default(key, default_value)
        @mutex.synchronize { super }
      end

      private
      def dupped_backend
        @mutex.synchronize { super }
      end
    end
  end
end
