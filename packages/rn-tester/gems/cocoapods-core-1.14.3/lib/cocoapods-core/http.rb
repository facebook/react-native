require 'uri'

module Pod
  # Handles HTTP requests
  #
  module HTTP
    # Resolve potential redirects and return the final URL.
    #
    # @return [string]
    #
    def self.get_actual_url(url, user_agent = nil)
      redirects = 0

      loop do
        response = perform_head_request(url, user_agent)

        if [301, 302, 303, 307, 308].include? response.status_code
          location = response.headers['location'].first

          if location =~ %r{://}
            url = location
          else
            url = URI.join(url, location).to_s
          end

          redirects += 1
        else
          break
        end

        break unless redirects < MAX_HTTP_REDIRECTS
      end

      url
    end

    # Performs validation of a URL
    #
    # @return [REST::response]
    #
    def self.validate_url(url, user_agent = nil)
      return nil unless url =~ /^#{URI.regexp}$/

      begin
        url = get_actual_url(url, user_agent)
        resp = perform_head_request(url, user_agent)
      rescue SocketError, URI::InvalidURIError, REST::Error, REST::Error::Connection
        resp = nil
      end

      resp
    end

    #-------------------------------------------------------------------------#

    private

    # Does a HEAD request and in case of any errors a GET request
    #
    # @return [REST::response]
    #
    def self.perform_head_request(url, user_agent)
      require 'rest'

      user_agent ||= USER_AGENT

      resp = ::REST.head(url, 'User-Agent' => user_agent)

      if resp.status_code >= 400
        resp = ::REST.get(url, 'User-Agent' => user_agent,
                               'Range' => 'bytes=0-0')

        if resp.status_code >= 400
          resp = ::REST.get(url, 'User-Agent' => user_agent)
        end
      end

      resp
    end

    MAX_HTTP_REDIRECTS = 3
    USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/538.43.40 (KHTML, like Gecko) Version/8.0 Safari/538.43.40'

    #-------------------------------------------------------------------------#
  end
end
