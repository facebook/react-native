module Typhoeus
  class Request
    module Cacheable
      def response=(response)
        cache.set(self, response) if cacheable? && !response.cached?
        super
      end

      def cacheable?
        cache
      end

      def run
        if response = cached_response
          response.cached = true
          finish(response)
        else
          super
        end
      end

      def cached_response
        cacheable? && cache.get(self)
      end

      def cache_ttl
        options[:cache_ttl]
      end

      private

      def cache
        return nil if options[:cache] === false
        options[:cache] || Typhoeus::Config.cache
      end
    end
  end
end
