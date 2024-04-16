module Typhoeus
  module Cache
    # This module provides a simple way to cache HTTP responses in Redis.
    class Redis
      # @example Set Redis as the Typhoeus cache backend
      #   Typhoeus::Config.cache = Typhoeus::Cache::Redis.new
      #
      # @param [ Redis ] redis
      #   A connection to Redis. Defaults to `Redis.new`, which uses the
      #   `REDIS_URL` environment variable to connect
      # @param [ Hash ] options
      #   Options
      # @option options [ Integer ] :default_ttl
      #   The default TTL of cached responses in seconds, for requests which do not set a cache_ttl.
      def initialize(redis = ::Redis.new, options = {})
        @redis = redis
        @default_ttl = options[:default_ttl]
      end

      def get(request)
        serialized_response = @redis.get(request.cache_key)
        return unless serialized_response
        Marshal.load(serialized_response)
      end

      def set(request, response)
        ttl = request.cache_ttl || @default_ttl
        key = request.cache_key
        serialized_response = Marshal.dump(response)
        @redis.set(key, serialized_response)
        @redis.expire(key, ttl) if ttl
      end
    end
  end
end
