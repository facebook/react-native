module Typhoeus
  class Response
    module Cacheable

      # Set the cache status, if we got response from cache
      # it will have cached? == true
      attr_writer :cached

      def cached?
        defined?(@cached) ? !!@cached : false
      end
    end
  end
end
