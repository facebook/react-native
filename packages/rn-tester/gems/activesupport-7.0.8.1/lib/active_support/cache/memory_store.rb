# frozen_string_literal: true

require "monitor"

module ActiveSupport
  module Cache
    # A cache store implementation which stores everything into memory in the
    # same process. If you're running multiple Ruby on Rails server processes
    # (which is the case if you're using Phusion Passenger or puma clustered mode),
    # then this means that Rails server process instances won't be able
    # to share cache data with each other and this may not be the most
    # appropriate cache in that scenario.
    #
    # This cache has a bounded size specified by the +:size+ options to the
    # initializer (default is 32Mb). When the cache exceeds the allotted size,
    # a cleanup will occur which tries to prune the cache down to three quarters
    # of the maximum size by removing the least recently used entries.
    #
    # Unlike other Cache store implementations, MemoryStore does not compress
    # values by default. MemoryStore does not benefit from compression as much
    # as other Store implementations, as it does not send data over a network.
    # However, when compression is enabled, it still pays the full cost of
    # compression in terms of cpu use.
    #
    # MemoryStore is thread-safe.
    class MemoryStore < Store
      module DupCoder # :nodoc:
        extend self

        def dump(entry)
          entry.dup_value! unless entry.compressed?
          entry
        end

        def dump_compressed(entry, threshold)
          entry = entry.compressed(threshold)
          entry.dup_value! unless entry.compressed?
          entry
        end

        def load(entry)
          entry = entry.dup
          entry.dup_value!
          entry
        end
      end

      def initialize(options = nil)
        options ||= {}
        # Disable compression by default.
        options[:compress] ||= false
        super(options)
        @data = {}
        @max_size = options[:size] || 32.megabytes
        @max_prune_time = options[:max_prune_time] || 2
        @cache_size = 0
        @monitor = Monitor.new
        @pruning = false
      end

      # Advertise cache versioning support.
      def self.supports_cache_versioning?
        true
      end

      # Delete all data stored in a given cache store.
      def clear(options = nil)
        synchronize do
          @data.clear
          @cache_size = 0
        end
      end

      # Preemptively iterates through all stored keys and removes the ones which have expired.
      def cleanup(options = nil)
        options = merged_options(options)
        instrument(:cleanup, size: @data.size) do
          keys = synchronize { @data.keys }
          keys.each do |key|
            entry = @data[key]
            delete_entry(key, **options) if entry && entry.expired?
          end
        end
      end

      # To ensure entries fit within the specified memory prune the cache by removing the least
      # recently accessed entries.
      def prune(target_size, max_time = nil)
        return if pruning?
        @pruning = true
        begin
          start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          cleanup
          instrument(:prune, target_size, from: @cache_size) do
            keys = synchronize { @data.keys }
            keys.each do |key|
              delete_entry(key, **options)
              return if @cache_size <= target_size || (max_time && Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time > max_time)
            end
          end
        ensure
          @pruning = false
        end
      end

      # Returns true if the cache is currently being pruned.
      def pruning?
        @pruning
      end

      # Increment an integer value in the cache.
      def increment(name, amount = 1, options = nil)
        modify_value(name, amount, options)
      end

      # Decrement an integer value in the cache.
      def decrement(name, amount = 1, options = nil)
        modify_value(name, -amount, options)
      end

      # Deletes cache entries if the cache key matches a given pattern.
      def delete_matched(matcher, options = nil)
        options = merged_options(options)
        instrument(:delete_matched, matcher.inspect) do
          matcher = key_matcher(matcher, options)
          keys = synchronize { @data.keys }
          keys.each do |key|
            delete_entry(key, **options) if key.match(matcher)
          end
        end
      end

      def inspect # :nodoc:
        "#<#{self.class.name} entries=#{@data.size}, size=#{@cache_size}, options=#{@options.inspect}>"
      end

      # Synchronize calls to the cache. This should be called wherever the underlying cache implementation
      # is not thread safe.
      def synchronize(&block) # :nodoc:
        @monitor.synchronize(&block)
      end

      private
        PER_ENTRY_OVERHEAD = 240

        def default_coder
          DupCoder
        end

        def cached_size(key, payload)
          key.to_s.bytesize + payload.bytesize + PER_ENTRY_OVERHEAD
        end

        def read_entry(key, **options)
          entry = nil
          synchronize do
            payload = @data.delete(key)
            if payload
              @data[key] = payload
              entry = deserialize_entry(payload)
            end
          end
          entry
        end

        def write_entry(key, entry, **options)
          payload = serialize_entry(entry, **options)
          synchronize do
            return false if options[:unless_exist] && @data.key?(key)

            old_payload = @data[key]
            if old_payload
              @cache_size -= (old_payload.bytesize - payload.bytesize)
            else
              @cache_size += cached_size(key, payload)
            end
            @data[key] = payload
            prune(@max_size * 0.75, @max_prune_time) if @cache_size > @max_size
            true
          end
        end

        def delete_entry(key, **options)
          synchronize do
            payload = @data.delete(key)
            @cache_size -= cached_size(key, payload) if payload
            !!payload
          end
        end

        def modify_value(name, amount, options)
          options = merged_options(options)
          synchronize do
            if num = read(name, options)
              num = num.to_i + amount
              write(name, num, options)
              num
            end
          end
        end
    end
  end
end
