# frozen_string_literal: true

begin
  gem "redis", ">= 4.0.1"
  require "redis"
  require "redis/distributed"
rescue LoadError
  warn "The Redis cache store requires the redis gem, version 4.0.1 or later. Please add it to your Gemfile: `gem \"redis\", \">= 4.0.1\"`"
  raise
end

# Prefer the hiredis driver but don't require it.
begin
  if ::Redis::VERSION < "5"
    require "redis/connection/hiredis"
  else
    require "hiredis-client"
  end
rescue LoadError
end

require "active_support/digest"

module ActiveSupport
  module Cache
    module ConnectionPoolLike
      def with
        yield self
      end
    end

    ::Redis.include(ConnectionPoolLike)
    ::Redis::Distributed.include(ConnectionPoolLike)

    # Redis cache store.
    #
    # Deployment note: Take care to use a *dedicated Redis cache* rather
    # than pointing this at your existing Redis server. It won't cope well
    # with mixed usage patterns and it won't expire cache entries by default.
    #
    # Redis cache server setup guide: https://redis.io/topics/lru-cache
    #
    # * Supports vanilla Redis, hiredis, and Redis::Distributed.
    # * Supports Memcached-like sharding across Redises with Redis::Distributed.
    # * Fault tolerant. If the Redis server is unavailable, no exceptions are
    #   raised. Cache fetches are all misses and writes are dropped.
    # * Local cache. Hot in-memory primary cache within block/middleware scope.
    # * +read_multi+ and +write_multi+ support for Redis mget/mset. Use Redis::Distributed
    #   4.0.1+ for distributed mget support.
    # * +delete_matched+ support for Redis KEYS globs.
    class RedisCacheStore < Store
      # Keys are truncated with the ActiveSupport digest if they exceed 1kB
      MAX_KEY_BYTESIZE = 1024

      DEFAULT_REDIS_OPTIONS = {
        connect_timeout:    20,
        read_timeout:       1,
        write_timeout:      1,
        reconnect_attempts: 0,
      }

      DEFAULT_ERROR_HANDLER = -> (method:, returning:, exception:) do
        if logger
          logger.error { "RedisCacheStore: #{method} failed, returned #{returning.inspect}: #{exception.class}: #{exception.message}" }
        end
      end

      # The maximum number of entries to receive per SCAN call.
      SCAN_BATCH_SIZE = 1000
      private_constant :SCAN_BATCH_SIZE

      # Advertise cache versioning support.
      def self.supports_cache_versioning?
        true
      end

      prepend Strategy::LocalCache

      class << self
        # Factory method to create a new Redis instance.
        #
        # Handles four options: :redis block, :redis instance, single :url
        # string, and multiple :url strings.
        #
        #   Option  Class       Result
        #   :redis  Proc    ->  options[:redis].call
        #   :redis  Object  ->  options[:redis]
        #   :url    String  ->  Redis.new(url: …)
        #   :url    Array   ->  Redis::Distributed.new([{ url: … }, { url: … }, …])
        #
        def build_redis(redis: nil, url: nil, **redis_options) # :nodoc:
          urls = Array(url)

          if redis.is_a?(Proc)
            redis.call
          elsif redis
            redis
          elsif urls.size > 1
            build_redis_distributed_client(urls: urls, **redis_options)
          elsif urls.empty?
            build_redis_client(**redis_options)
          else
            build_redis_client(url: urls.first, **redis_options)
          end
        end

        private
          def build_redis_distributed_client(urls:, **redis_options)
            ::Redis::Distributed.new([], DEFAULT_REDIS_OPTIONS.merge(redis_options)).tap do |dist|
              urls.each { |u| dist.add_node url: u }
            end
          end

          def build_redis_client(**redis_options)
            ::Redis.new(DEFAULT_REDIS_OPTIONS.merge(redis_options))
          end
      end

      attr_reader :redis_options
      attr_reader :max_key_bytesize

      # Creates a new Redis cache store.
      #
      # Handles four options: :redis block, :redis instance, single :url
      # string, and multiple :url strings.
      #
      #   Option  Class       Result
      #   :redis  Proc    ->  options[:redis].call
      #   :redis  Object  ->  options[:redis]
      #   :url    String  ->  Redis.new(url: …)
      #   :url    Array   ->  Redis::Distributed.new([{ url: … }, { url: … }, …])
      #
      # No namespace is set by default. Provide one if the Redis cache
      # server is shared with other apps: <tt>namespace: 'myapp-cache'</tt>.
      #
      # Compression is enabled by default with a 1kB threshold, so cached
      # values larger than 1kB are automatically compressed. Disable by
      # passing <tt>compress: false</tt> or change the threshold by passing
      # <tt>compress_threshold: 4.kilobytes</tt>.
      #
      # No expiry is set on cache entries by default. Redis is expected to
      # be configured with an eviction policy that automatically deletes
      # least-recently or -frequently used keys when it reaches max memory.
      # See https://redis.io/topics/lru-cache for cache server setup.
      #
      # Race condition TTL is not set by default. This can be used to avoid
      # "thundering herd" cache writes when hot cache entries are expired.
      # See ActiveSupport::Cache::Store#fetch for more.
      def initialize(namespace: nil, compress: true, compress_threshold: 1.kilobyte, coder: default_coder, expires_in: nil, race_condition_ttl: nil, error_handler: DEFAULT_ERROR_HANDLER, **redis_options)
        @redis_options = redis_options

        @max_key_bytesize = MAX_KEY_BYTESIZE
        @error_handler = error_handler

        super namespace: namespace,
          compress: compress, compress_threshold: compress_threshold,
          expires_in: expires_in, race_condition_ttl: race_condition_ttl,
          coder: coder
      end

      def redis
        @redis ||= begin
          pool_options = self.class.send(:retrieve_pool_options, redis_options)

          if pool_options.any?
            self.class.send(:ensure_connection_pool_added!)
            ::ConnectionPool.new(pool_options) { self.class.build_redis(**redis_options) }
          else
            self.class.build_redis(**redis_options)
          end
        end
      end

      def inspect
        instance = @redis || @redis_options
        "#<#{self.class} options=#{options.inspect} redis=#{instance.inspect}>"
      end

      # Cache Store API implementation.
      #
      # Read multiple values at once. Returns a hash of requested keys ->
      # fetched values.
      def read_multi(*names)
        if mget_capable?
          instrument(:read_multi, names, options) do |payload|
            read_multi_mget(*names).tap do |results|
              payload[:hits] = results.keys
            end
          end
        else
          super
        end
      end

      # Cache Store API implementation.
      #
      # Supports Redis KEYS glob patterns:
      #
      #   h?llo matches hello, hallo and hxllo
      #   h*llo matches hllo and heeeello
      #   h[ae]llo matches hello and hallo, but not hillo
      #   h[^e]llo matches hallo, hbllo, ... but not hello
      #   h[a-b]llo matches hallo and hbllo
      #
      # Use \ to escape special characters if you want to match them verbatim.
      #
      # See https://redis.io/commands/KEYS for more.
      #
      # Failsafe: Raises errors.
      def delete_matched(matcher, options = nil)
        instrument :delete_matched, matcher do
          unless String === matcher
            raise ArgumentError, "Only Redis glob strings are supported: #{matcher.inspect}"
          end
          redis.with do |c|
            pattern = namespace_key(matcher, options)
            cursor = "0"
            # Fetch keys in batches using SCAN to avoid blocking the Redis server.
            nodes = c.respond_to?(:nodes) ? c.nodes : [c]

            nodes.each do |node|
              begin
                cursor, keys = node.scan(cursor, match: pattern, count: SCAN_BATCH_SIZE)
                node.del(*keys) unless keys.empty?
              end until cursor == "0"
            end
          end
        end
      end

      # Cache Store API implementation.
      #
      # Increment a cached value. This method uses the Redis incr atomic
      # operator and can only be used on values written with the +:raw+ option.
      # Calling it on a value not stored with +:raw+ will initialize that value
      # to zero.
      #
      # Failsafe: Raises errors.
      def increment(name, amount = 1, options = nil)
        instrument :increment, name, amount: amount do
          failsafe :increment do
            options = merged_options(options)
            key = normalize_key(name, options)

            redis.with do |c|
              c.incrby(key, amount).tap do
                write_key_expiry(c, key, options)
              end
            end
          end
        end
      end

      # Cache Store API implementation.
      #
      # Decrement a cached value. This method uses the Redis decr atomic
      # operator and can only be used on values written with the +:raw+ option.
      # Calling it on a value not stored with +:raw+ will initialize that value
      # to zero.
      #
      # Failsafe: Raises errors.
      def decrement(name, amount = 1, options = nil)
        instrument :decrement, name, amount: amount do
          failsafe :decrement do
            options = merged_options(options)
            key = normalize_key(name, options)

            redis.with do |c|
              c.decrby(key, amount).tap do
                write_key_expiry(c, key, options)
              end
            end
          end
        end
      end

      # Cache Store API implementation.
      #
      # Removes expired entries. Handled natively by Redis least-recently-/
      # least-frequently-used expiry, so manual cleanup is not supported.
      def cleanup(options = nil)
        super
      end

      # Clear the entire cache on all Redis servers. Safe to use on
      # shared servers if the cache is namespaced.
      #
      # Failsafe: Raises errors.
      def clear(options = nil)
        failsafe :clear do
          if namespace = merged_options(options)[:namespace]
            delete_matched "*", namespace: namespace
          else
            redis.with { |c| c.flushdb }
          end
        end
      end

      # Get info from redis servers.
      def stats
        redis.with { |c| c.info }
      end

      def mget_capable? # :nodoc:
        set_redis_capabilities unless defined? @mget_capable
        @mget_capable
      end

      def mset_capable? # :nodoc:
        set_redis_capabilities unless defined? @mset_capable
        @mset_capable
      end

      private
        def set_redis_capabilities
          redis.with do |c|
            case c
            when Redis::Distributed
              @mget_capable = true
              @mset_capable = false
            else
              @mget_capable = true
              @mset_capable = true
            end
          end
        end

        # Store provider interface:
        # Read an entry from the cache.
        def read_entry(key, **options)
          deserialize_entry(read_serialized_entry(key, **options), **options)
        end

        def read_serialized_entry(key, raw: false, **options)
          failsafe :read_entry do
            redis.with { |c| c.get(key) }
          end
        end

        def read_multi_entries(names, **options)
          if mget_capable?
            read_multi_mget(*names, **options)
          else
            super
          end
        end

        def read_multi_mget(*names)
          options = names.extract_options!
          options = merged_options(options)
          return {} if names == []
          raw = options&.fetch(:raw, false)

          keys = names.map { |name| normalize_key(name, options) }

          values = failsafe(:read_multi_mget, returning: {}) do
            redis.with { |c| c.mget(*keys) }
          end

          names.zip(values).each_with_object({}) do |(name, value), results|
            if value
              entry = deserialize_entry(value, raw: raw)
              unless entry.nil? || entry.expired? || entry.mismatched?(normalize_version(name, options))
                results[name] = entry.value
              end
            end
          end
        end

        # Write an entry to the cache.
        #
        # Requires Redis 2.6.12+ for extended SET options.
        def write_entry(key, entry, raw: false, **options)
          write_serialized_entry(key, serialize_entry(entry, raw: raw, **options), raw: raw, **options)
        end

        def write_serialized_entry(key, payload, raw: false, unless_exist: false, expires_in: nil, race_condition_ttl: nil, **options)
          # If race condition TTL is in use, ensure that cache entries
          # stick around a bit longer after they would have expired
          # so we can purposefully serve stale entries.
          if race_condition_ttl && expires_in && expires_in > 0 && !raw
            expires_in += 5.minutes
          end

          modifiers = {}
          if unless_exist || expires_in
            modifiers[:nx] = unless_exist
            modifiers[:px] = (1000 * expires_in.to_f).ceil if expires_in
          end

          failsafe :write_entry, returning: false do
            redis.with { |c| c.set key, payload, **modifiers }
          end
        end

        def write_key_expiry(client, key, options)
          if options[:expires_in] && client.ttl(key).negative?
            client.expire key, options[:expires_in].to_i
          end
        end

        # Delete an entry from the cache.
        def delete_entry(key, options)
          failsafe :delete_entry, returning: false do
            redis.with { |c| c.del key }
          end
        end

        # Deletes multiple entries in the cache. Returns the number of entries deleted.
        def delete_multi_entries(entries, **_options)
          redis.with { |c| c.del(entries) }
        end

        # Nonstandard store provider API to write multiple values at once.
        def write_multi_entries(entries, expires_in: nil, **options)
          if entries.any?
            if mset_capable? && expires_in.nil?
              failsafe :write_multi_entries do
                payload = serialize_entries(entries, **options)
                redis.with do |c|
                  c.mapped_mset(payload)
                end
              end
            else
              super
            end
          end
        end

        # Truncate keys that exceed 1kB.
        def normalize_key(key, options)
          truncate_key super&.b
        end

        def truncate_key(key)
          if key && key.bytesize > max_key_bytesize
            suffix = ":hash:#{ActiveSupport::Digest.hexdigest(key)}"
            truncate_at = max_key_bytesize - suffix.bytesize
            "#{key.byteslice(0, truncate_at)}#{suffix}"
          else
            key
          end
        end

        def deserialize_entry(payload, raw: false, **)
          if raw && !payload.nil?
            Entry.new(payload)
          else
            super(payload)
          end
        end

        def serialize_entry(entry, raw: false, **options)
          if raw
            entry.value.to_s
          else
            super(entry, raw: raw, **options)
          end
        end

        def serialize_entries(entries, **options)
          entries.transform_values do |entry|
            serialize_entry(entry, **options)
          end
        end

        def failsafe(method, returning: nil)
          yield
        rescue ::Redis::BaseError => error
          ActiveSupport.error_reporter&.report(error, handled: true, severity: :warning)
          @error_handler&.call(method: method, exception: error, returning: returning)
          returning
        end
    end
  end
end
