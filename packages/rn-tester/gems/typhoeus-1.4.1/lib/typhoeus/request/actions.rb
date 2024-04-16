module Typhoeus
  class Request

    # Module containing logic about shortcuts to
    # http methods. Like
    #   Typhoeus.get("www.example.com")
    module Actions

      # Make a get request.
      #
      # @example Make get request.
      #   Typhoeus.get("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option (see Typhoeus::Request#initialize)
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def get(base_url, options = {})
        Request.new(base_url, options.merge(:method => :get)).run
      end

      # Make a post request.
      #
      # @example Make post request.
      #   Typhoeus.post("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option (see Typhoeus::Request#initialize)
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def post(base_url, options = {})
        Request.new(base_url, options.merge(:method => :post)).run
      end

      # Make a put request.
      #
      # @example Make put request.
      #   Typhoeus.put("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option options :params [ Hash ] Params hash which
      #   is attached to the base_url.
      # @option options :body [ Hash ] Body hash which
      #   becomes a PUT request body.
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def put(base_url, options = {})
        Request.new(base_url, options.merge(:method => :put)).run
      end

      # Make a delete request.
      #
      # @example Make delete request.
      #   Typhoeus.delete("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option (see Typhoeus::Request#initialize)
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def delete(base_url, options = {})
        Request.new(base_url, options.merge(:method => :delete)).run
      end

      # Make a head request.
      #
      # @example Make head request.
      #   Typhoeus.head("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option (see Typhoeus::Request#initialize)
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def head(base_url, options = {})
        Request.new(base_url, options.merge(:method => :head)).run
      end

      # Make a patch request.
      #
      # @example Make patch request.
      #   Typhoeus.patch("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option (see Typhoeus::Request#initialize)
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def patch(base_url, options = {})
        Request.new(base_url, options.merge(:method => :patch)).run
      end

      # Make a options request.
      #
      # @example Make options request.
      #   Typhoeus.options("www.example.com")
      #
      # @param (see Typhoeus::Request#initialize)
      #
      # @option (see Typhoeus::Request#initialize)
      #
      # @return (see Typhoeus::Response#initialize)
      #
      # @note (see Typhoeus::Request#initialize)
      def options(base_url, options = {})
        Request.new(base_url, options.merge(:method => :options)).run
      end
    end
  end
end
