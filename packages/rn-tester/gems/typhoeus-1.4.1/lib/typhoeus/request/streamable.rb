module Typhoeus
  class Request

    # This module contians the logic for response streaming.
    module Streamable

      # Set on_body callback.
      #
      # This callback will be called each time a portion of the body is read from the socket.
      # Setting an on_body callback will cause the response body to be empty.
      #
      # @example Set on_body.
      #   request.on_body { |body_chunk, response| puts "Got #{body_chunk.bytesize} bytes" }
      #
      # @param [ Block ] block The block to execute.
      #
      # @yield [ Typhoeus::Response, String ]
      #
      # @return [ Array<Block> ] All on_body blocks.
      def on_body(&block)
        @on_body ||= []
        @on_body << block if block_given?
        @on_body
      end

      # Is this request using streaming?
      #
      # @return [ Boolean ] True if any on_body blocks have been set.
      def streaming?
        defined?(@on_body) && @on_body.any?
      end
    end
  end
end
