module REST
  # Response holds a HTTP response
  class Response
    # These codes are used to define convenience boolean accessors on the response object.
    #
    # Examples
    #
    #   REST::Response.new(200).ok? #=> true
    #   REST::Response.new(201).ok? #=> falses
    #   REST::Response.new(403).forbidden? #=> true
    CODES = [
      [200, :ok],
      [201, :created],
      [301, :moved_permanently],
      [302, :found],
      [400, :bad_request],
      [401, :unauthorized],
      [403, :forbidden],
      [422, :unprocessable_entity],
      [404, :not_found],
      [500, :internal_server_error]
    ]
    
    attr_accessor :body, :headers, :status_code
    
    # * <tt>status_code</tt>: The status code of the response (ie. 200 or '404')
    # * <tt>headers</tt>: The headers of the response
    # * <tt>body</tt>: The body of the response
    def initialize(status_code, headers={}, body='')
      @status_code = status_code.to_i
      @headers = headers
      @body = body
    end
    
    CODES.each do |code, name|
      define_method "#{name}?" do
        status_code == code
      end
    end
    
    # Returns _true_ when the status code is in the 2XX range. Returns false otherwise.
    def success?
      (status_code.to_s =~ /2../) ? true : false
    end
  end
end