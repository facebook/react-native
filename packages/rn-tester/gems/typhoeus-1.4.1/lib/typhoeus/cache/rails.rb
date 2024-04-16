module Typhoeus
  module Cache
    # This module provides a simple way to cache HTTP responses in using the Rails cache.
    class Rails
      # @example Use the Rails cache setup to cache Typhoeus responses.
      #   Typhoeus::Config.cache = Typhoeus::Cache::Rails.new
      #
      # @param [ ActiveSupport::Cache::Store ] cache
      #   A Rails cache backend. Defaults to Rails.cache.
      # @param [ Hash ] options
      #   Options
      # @option options [ Integer ] :default_ttl
      #   The default TTL of cached responses in seconds, for requests which do not set a cache_ttl.
      def initialize(cache = ::Rails.cache, options = {})
        @cache = cache
        @default_ttl = options[:default_ttl]
      end

      def get(request)
        @cache.read(request)
      end

      def set(request, response)
        @cache.write(request.cache_key, response, :expires_in => request.cache_ttl || @default_ttl)
      end
    end
  end
end
