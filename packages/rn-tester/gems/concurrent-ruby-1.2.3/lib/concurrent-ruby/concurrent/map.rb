require 'thread'
require 'concurrent/constants'
require 'concurrent/utility/engine'

module Concurrent
  # @!visibility private
  module Collection

    # @!visibility private
    MapImplementation = case
                        when Concurrent.on_jruby?
                          require 'concurrent/utility/native_extension_loader'
                          # noinspection RubyResolve
                          JRubyMapBackend
                        when Concurrent.on_cruby?
                          require 'concurrent/collection/map/mri_map_backend'
                          MriMapBackend
                        when Concurrent.on_truffleruby?
                          if defined?(::TruffleRuby::ConcurrentMap)
                            require 'concurrent/collection/map/truffleruby_map_backend'
                            TruffleRubyMapBackend
                          else
                            require 'concurrent/collection/map/synchronized_map_backend'
                            SynchronizedMapBackend
                          end
                        else
                          warn 'Concurrent::Map: unsupported Ruby engine, using a fully synchronized Concurrent::Map implementation'
                          require 'concurrent/collection/map/synchronized_map_backend'
                          SynchronizedMapBackend
                        end
  end

  # `Concurrent::Map` is a hash-like object and should have much better performance
  # characteristics, especially under high concurrency, than `Concurrent::Hash`.
  # However, `Concurrent::Map `is not strictly semantically equivalent to a ruby `Hash`
  # -- for instance, it does not necessarily retain ordering by insertion time as `Hash`
  # does. For most uses it should do fine though, and we recommend you consider
  # `Concurrent::Map` instead of `Concurrent::Hash` for your concurrency-safe hash needs.
  class Map < Collection::MapImplementation

    # @!macro map.atomic_method
    #   This method is atomic.

    # @!macro map.atomic_method_with_block
    #   This method is atomic.
    #   @note Atomic methods taking a block do not allow the `self` instance
    #     to be used within the block. Doing so will cause a deadlock.

    # @!method []=(key, value)
    #   Set a value with key
    #   @param [Object] key
    #   @param [Object] value
    #   @return [Object] the new value

    # @!method compute_if_absent(key)
    #   Compute and store new value for key if the key is absent.
    #   @param [Object] key
    #   @yield new value
    #   @yieldreturn [Object] new value
    #   @return [Object] new value or current value
    #   @!macro map.atomic_method_with_block

    # @!method compute_if_present(key)
    #   Compute and store new value for key if the key is present.
    #   @param [Object] key
    #   @yield new value
    #   @yieldparam old_value [Object]
    #   @yieldreturn [Object, nil] new value, when nil the key is removed
    #   @return [Object, nil] new value or nil
    #   @!macro map.atomic_method_with_block

    # @!method compute(key)
    #   Compute and store new value for key.
    #   @param [Object] key
    #   @yield compute new value from old one
    #   @yieldparam old_value [Object, nil] old_value, or nil when key is absent
    #   @yieldreturn [Object, nil] new value, when nil the key is removed
    #   @return [Object, nil] new value or nil
    #   @!macro map.atomic_method_with_block

    # @!method merge_pair(key, value)
    #   If the key is absent, the value is stored, otherwise new value is
    #   computed with a block.
    #   @param [Object] key
    #   @param [Object] value
    #   @yield compute new value from old one
    #   @yieldparam old_value [Object] old value
    #   @yieldreturn [Object, nil] new value, when nil the key is removed
    #   @return [Object, nil] new value or nil
    #   @!macro map.atomic_method_with_block

    # @!method replace_pair(key, old_value, new_value)
    #   Replaces old_value with new_value if key exists and current value
    #   matches old_value
    #   @param [Object] key
    #   @param [Object] old_value
    #   @param [Object] new_value
    #   @return [true, false] true if replaced
    #   @!macro map.atomic_method

    # @!method replace_if_exists(key, new_value)
    #   Replaces current value with new_value if key exists
    #   @param [Object] key
    #   @param [Object] new_value
    #   @return [Object, nil] old value or nil
    #   @!macro map.atomic_method

    # @!method get_and_set(key, value)
    #   Get the current value under key and set new value.
    #   @param [Object] key
    #   @param [Object] value
    #   @return [Object, nil] old value or nil when the key was absent
    #   @!macro map.atomic_method

    # @!method delete(key)
    #   Delete key and its value.
    #   @param [Object] key
    #   @return [Object, nil] old value or nil when the key was absent
    #   @!macro map.atomic_method

    # @!method delete_pair(key, value)
    #   Delete pair and its value if current value equals the provided value.
    #   @param [Object] key
    #   @param [Object] value
    #   @return [true, false] true if deleted
    #   @!macro map.atomic_method

    # NonConcurrentMapBackend handles default_proc natively
    unless defined?(Collection::NonConcurrentMapBackend) and self < Collection::NonConcurrentMapBackend

      # @param [Hash, nil] options options to set the :initial_capacity or :load_factor. Ignored on some Rubies.
      # @param [Proc] default_proc Optional block to compute the default value if the key is not set, like `Hash#default_proc`
      def initialize(options = nil, &default_proc)
        if options.kind_of?(::Hash)
          validate_options_hash!(options)
        else
          options = nil
        end

        super(options)
        @default_proc = default_proc
      end

      # Get a value with key
      # @param [Object] key
      # @return [Object] the value
      def [](key)
        if value = super # non-falsy value is an existing mapping, return it right away
          value
          # re-check is done with get_or_default(key, NULL) instead of a simple !key?(key) in order to avoid a race condition, whereby by the time the current thread gets to the key?(key) call
          # a key => value mapping might have already been created by a different thread (key?(key) would then return true, this elsif branch wouldn't be taken and an incorrent +nil+ value
          # would be returned)
          # note: nil == value check is not technically necessary
        elsif @default_proc && nil == value && NULL == (value = get_or_default(key, NULL))
          @default_proc.call(self, key)
        else
          value
        end
      end
    end

    alias_method :get, :[]
    alias_method :put, :[]=

    # Get a value with key, or default_value when key is absent,
    # or fail when no default_value is given.
    # @param [Object] key
    # @param [Object] default_value
    # @yield default value for a key
    # @yieldparam key [Object]
    # @yieldreturn [Object] default value
    # @return [Object] the value or default value
    # @raise [KeyError] when key is missing and no default_value is provided
    # @!macro map_method_not_atomic
    #   @note The "fetch-then-act" methods of `Map` are not atomic. `Map` is intended
    #     to be use as a concurrency primitive with strong happens-before
    #     guarantees. It is not intended to be used as a high-level abstraction
    #     supporting complex operations. All read and write operations are
    #     thread safe, but no guarantees are made regarding race conditions
    #     between the fetch operation and yielding to the block. Additionally,
    #     this method does not support recursion. This is due to internal
    #     constraints that are very unlikely to change in the near future.
    def fetch(key, default_value = NULL)
      if NULL != (value = get_or_default(key, NULL))
        value
      elsif block_given?
        yield key
      elsif NULL != default_value
        default_value
      else
        raise_fetch_no_key
      end
    end

    # Fetch value with key, or store default value when key is absent,
    # or fail when no default_value is given. This is a two step operation,
    # therefore not atomic. The store can overwrite other concurrently
    # stored value.
    # @param [Object] key
    # @param [Object] default_value
    # @yield default value for a key
    # @yieldparam key [Object]
    # @yieldreturn [Object] default value
    # @return [Object] the value or default value
    def fetch_or_store(key, default_value = NULL)
      fetch(key) do
        put(key, block_given? ? yield(key) : (NULL == default_value ? raise_fetch_no_key : default_value))
      end
    end

    # Insert value into map with key if key is absent in one atomic step.
    # @param [Object] key
    # @param [Object] value
    # @return [Object, nil] the previous value when key was present or nil when there was no key
    def put_if_absent(key, value)
      computed = false
      result   = compute_if_absent(key) do
        computed = true
        value
      end
      computed ? nil : result
    end unless method_defined?(:put_if_absent)

    # Is the value stored in the map. Iterates over all values.
    # @param [Object] value
    # @return [true, false]
    def value?(value)
      each_value do |v|
        return true if value.equal?(v)
      end
      false
    end

    # All keys
    # @return [::Array<Object>] keys
    def keys
      arr = []
      each_pair { |k, v| arr << k }
      arr
    end unless method_defined?(:keys)

    # All values
    # @return [::Array<Object>] values
    def values
      arr = []
      each_pair { |k, v| arr << v }
      arr
    end unless method_defined?(:values)

    # Iterates over each key.
    # @yield for each key in the map
    # @yieldparam key [Object]
    # @return [self]
    # @!macro map.atomic_method_with_block
    def each_key
      each_pair { |k, v| yield k }
    end unless method_defined?(:each_key)

    # Iterates over each value.
    # @yield for each value in the map
    # @yieldparam value [Object]
    # @return [self]
    # @!macro map.atomic_method_with_block
    def each_value
      each_pair { |k, v| yield v }
    end unless method_defined?(:each_value)

    # Iterates over each key value pair.
    # @yield for each key value pair in the map
    # @yieldparam key [Object]
    # @yieldparam value [Object]
    # @return [self]
    # @!macro map.atomic_method_with_block
    def each_pair
      return enum_for :each_pair unless block_given?
      super
    end

    alias_method :each, :each_pair unless method_defined?(:each)

    # Find key of a value.
    # @param [Object] value
    # @return [Object, nil] key or nil when not found
    def key(value)
      each_pair { |k, v| return k if v == value }
      nil
    end unless method_defined?(:key)

    # Is map empty?
    # @return [true, false]
    def empty?
      each_pair { |k, v| return false }
      true
    end unless method_defined?(:empty?)

    # The size of map.
    # @return [Integer] size
    def size
      count = 0
      each_pair { |k, v| count += 1 }
      count
    end unless method_defined?(:size)

    # @!visibility private
    def marshal_dump
      raise TypeError, "can't dump hash with default proc" if @default_proc
      h = {}
      each_pair { |k, v| h[k] = v }
      h
    end

    # @!visibility private
    def marshal_load(hash)
      initialize
      populate_from(hash)
    end

    undef :freeze

    # @!visibility private
    def inspect
      format '%s entries=%d default_proc=%s>', to_s[0..-2], size.to_s, @default_proc.inspect
    end

    private

    def raise_fetch_no_key
      raise KeyError, 'key not found'
    end

    def initialize_copy(other)
      super
      populate_from(other)
    end

    def populate_from(hash)
      hash.each_pair { |k, v| self[k] = v }
      self
    end

    def validate_options_hash!(options)
      if (initial_capacity = options[:initial_capacity]) && (!initial_capacity.kind_of?(Integer) || initial_capacity < 0)
        raise ArgumentError, ":initial_capacity must be a positive Integer"
      end
      if (load_factor = options[:load_factor]) && (!load_factor.kind_of?(Numeric) || load_factor <= 0 || load_factor > 1)
        raise ArgumentError, ":load_factor must be a number between 0 and 1"
      end
    end
  end
end
