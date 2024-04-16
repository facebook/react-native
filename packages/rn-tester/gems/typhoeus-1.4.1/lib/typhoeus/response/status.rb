module Typhoeus
  class Response

    # This module contains logic about the http
    # status.
    module Status

      # Return the status message if present.
      #
      # @example Return status message.
      #   reesponse.status_message
      #
      # @return [ String ] The message.
      def status_message
        return @status_message if defined?(@status_message) && @status_message
        return options[:status_message] unless options[:status_message].nil?

        # HTTP servers can choose not to include the explanation to HTTP codes. The RFC
        # states this (http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4):
        # Except when responding to a HEAD request, the server SHOULD include an entity containing
        # an explanation of the error situation [...]
        # This means 'HTTP/1.1 404' is as valid as 'HTTP/1.1 404 Not Found' and we have to handle it.
        #
        # Regexp doc: http://rubular.com/r/eAr1oVYsVa
        if first_header_line != nil and first_header_line[/\d{3} (.*)$/, 1] != nil
          @status_message = first_header_line[/\d{3} (.*)$/, 1].chomp
        else
          @status_message = nil
        end
      end

      # Return the http version.
      #
      # @example Return http version.
      #  response.http_version
      #
      # @return [ String ] The http version.
      def http_version
        @http_version ||= first_header_line ? first_header_line[/HTTP\/(\S+)/, 1] : nil
      end

      # Return whether the response is a success.
      #
      # @example Return if the response was successful.
      #  response.success?
      #
      # @return [ Boolean ] Return true if successful, false else.
      def success?
        (mock || return_code == :ok) && response_code && has_good_response_code?
      end

      # Return whether the response is a failure.
      #
      # @example Return if the response was failed.
      #  response.failure?
      #
      # @return [ Boolean ] Return true if failure, false else.
      def failure?
        (mock || return_code == :internal_server_error) && response_code && has_bad_response_code?
      end

      # Return wether the response is modified.
      #
      # @example Return if the response was modified.
      #  response.modified?
      #
      # @return [ Boolean ] Return true if modified, false else.
      def modified?
        (mock || return_code == :ok) && response_code && response_code != 304
      end

      # Return whether the response is timed out.
      #
      # @example Return if the response timed out.
      #  response.timed_out?
      #
      # @return [ Boolean ] Return true if timed out, false else.
      def timed_out?
        return_code == :operation_timedout
      end

      private

      # :nodoc:
      def first_header_line
        @first_header_line ||= begin
          if response_headers.to_s.include?("\r\n\r\n")
            response_headers.to_s.split("\r\n\r\n").last.split("\r\n").first
          else
            response_headers.to_s.split("\r\n").first
          end
        end
      end

      # :nodoc:
      def has_good_response_code?
        response_code >= 200 && response_code < 300
      end

      # :nodoc:
      def has_bad_response_code?
        !has_good_response_code?
      end
    end
  end
end
