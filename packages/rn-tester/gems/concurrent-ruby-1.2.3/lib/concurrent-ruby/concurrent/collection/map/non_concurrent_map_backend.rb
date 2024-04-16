require 'concurrent/constants'

module Concurrent

  # @!visibility private
  module Collection

    # @!visibility private
    class NonConcurrentMapBackend

      # WARNING: all public methods of the class must operate on the @backend
      # directly without calling each other. This is important because of the
      # SynchronizedMapBackend which uses a non-reentrant mutex for performance
      # reasons.
      def initialize(options = nil, &default_proc)
        validate_options_hash!(options) if options.kind_of?(::Hash)
        set_backend(default_proc)
        @default_proc = default_proc
      end

      def [](key)
        @backend[key]
      end

      def []=(key, value)
        @backend[key] = value
      end

      def compute_if_absent(key)
        if NULL != (stored_value = @backend.fetch(key, NULL))
          stored_value
        else
          @backend[key] = yield
        end
      end

      def replace_pair(key, old_value, new_value)
        if pair?(key, old_value)
          @backend[key] = new_value
          true
        else
          false
        end
      end

      def replace_if_exists(key, new_value)
        if NULL != (stored_value = @backend.fetch(key, NULL))
          @backend[key] = new_value
          stored_value
        end
      end

      def compute_if_present(key)
        if NULL != (stored_value = @backend.fetch(key, NULL))
          store_computed_value(key, yield(stored_value))
        end
      end

      def compute(key)
        store_computed_value(key, yield(get_or_default(key, nil)))
      end

      def merge_pair(key, value)
        if NULL == (stored_value = @backend.fetch(key, NULL))
          @backend[key] = value
        else
          store_computed_value(key, yield(stored_value))
        end
      end

      def get_and_set(key, value)
        stored_value = get_or_default(key, nil)
        @backend[key] = value
        stored_value
      end

      def key?(key)
        @backend.key?(key)
      end

      def delete(key)
        @backend.delete(key)
      end

      def delete_pair(key, value)
        if pair?(key, value)
          @backend.delete(key)
          true
        else
          false
        end
      end

      def clear
        @backend.clear
        self
      end

      def each_pair
        dupped_backend.each_pair do |k, v|
          yield k, v
        end
        self
      end

      def size
        @backend.size
      end

      def get_or_default(key, default_value)
        @backend.fetch(key, default_value)
      end

      private

      def set_backend(default_proc)
        if default_proc
          @backend = ::Hash.new { |_h, key| default_proc.call(self, key) }
        else
          @backend = {}
        end
      end

      def initialize_copy(other)
        super
        set_backend(@default_proc)
        self
      end

      def dupped_backend
        @backend.dup
      end

      def pair?(key, expected_value)
        NULL != (stored_value = @backend.fetch(key, NULL)) && expected_value.equal?(stored_value)
      end

      def store_computed_value(key, new_value)
        if new_value.nil?
          @backend.delete(key)
          nil
        else
          @backend[key] = new_value
        end
      end
    end
  end
end
