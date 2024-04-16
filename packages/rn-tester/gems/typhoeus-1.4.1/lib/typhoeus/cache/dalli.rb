module Typhoeus
  module Cache
    # This module provides a simple way to cache HTTP responses using Dalli.
    class Dalli
      # @example Set Dalli as the Typhoeus cache backend
      #   Typhoeus::Config.cache = Typhoeus::Cache::Dalli.new
      #
      # @param [ Dalli::Client ] client
      #   A connection to the cache server. Defaults to `Dalli::Client.new`
      # @param [ Hash ] options
      #   Options
      # @option options [ Integer ] :default_ttl
      #   The default TTL of cached responses in seconds, for requests which do not set a cache_ttl.
      def initialize(client = ::Dalli::Client.new, options = {})
        @client = client
        @default_ttl = options[:default_ttl]
      end

      def get(request)
        @client.get(request.cache_key)
      end

      def set(request, response)
        @client.set(request.cache_key, response, request.cache_ttl || @default_ttl)
      end
    end
  end
end
