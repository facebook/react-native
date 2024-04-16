# frozen_string_literal: true

module ActiveSupport
  module Cache
    # A cache store implementation which doesn't actually store anything. Useful in
    # development and test environments where you don't want caching turned on but
    # need to go through the caching interface.
    #
    # This cache does implement the local cache strategy, so values will actually
    # be cached inside blocks that utilize this strategy. See
    # ActiveSupport::Cache::Strategy::LocalCache for more details.
    class NullStore < Store
      prepend Strategy::LocalCache

      # Advertise cache versioning support.
      def self.supports_cache_versioning?
        true
      end

      def clear(options = nil)
      end

      def cleanup(options = nil)
      end

      def increment(name, amount = 1, options = nil)
      end

      def decrement(name, amount = 1, options = nil)
      end

      def delete_matched(matcher, options = nil)
      end

      private
        def read_entry(key, **s)
          deserialize_entry(read_serialized_entry(key))
        end

        def read_serialized_entry(_key, **)
        end

        def write_entry(key, entry, **)
          write_serialized_entry(key, serialize_entry(entry))
        end

        def write_serialized_entry(_key, _payload, **)
          true
        end

        def delete_entry(key, **options)
          false
        end
    end
  end
end
