module Typhoeus

  # This class represents an expectation. It is part
  # of the stubbing mechanism. An expectation contains
  # a url and options, like a request. They are compared
  # to the request url and options in order to evaluate
  # whether they match. If that's the case, the attached
  # responses are returned one by one.
  #
  # @example Stub a request and get specified response.
  #   expected = Typhoeus::Response.new
  #   Typhoeus.stub("www.example.com").and_return(expected)
  #
  #   actual = Typhoeus.get("www.example.com")
  #   expected == actual
  #   #=> true
  #
  # @example Stub a request and get a lazily-constructed response containing data from actual widgets that exist in the system when the stubbed request is made.
  #   Typhoeus.stub("www.example.com/widgets") do
  #     actual_widgets = Widget.all
  #     Typhoeus::Response.new(
  #       :body => actual_widgets.inject([]) do |ids, widget|
  #         ids << widget.id
  #       end.join(",")
  #     )
  #   end
  #
  # @example Stub a request and get a lazily-constructed response in the format requested.
  #   Typhoeus.stub("www.example.com") do |request|
  #     accept = (request.options[:headers]||{})['Accept'] || "application/json"
  #     format = accept.split(",").first
  #     body_obj = { 'things' => [ { 'id' => 'foo' } ] }
  #
  #     Typhoeus::Response.new(
  #       :headers => {
  #         'Content-Type' => format
  #       },
  #       :body => SERIALIZERS[format].serialize(body_obj)
  #     )
  #   end
  class Expectation

    # @api private
    attr_reader :base_url

    # @api private
    attr_reader :options

    # @api private
    attr_reader :from

    class << self

      # Returns all expectations.
      #
      # @example Return expectations.
      #   Typhoeus::Expectation.all
      #
      # @return [ Array<Typhoeus::Expectation> ] The expectations.
      def all
        @expectations ||= []
      end

      # Clears expectations. This is handy while
      # testing, and you want to make sure that
      # you don't get canned responses.
      #
      # @example Clear expectations.
      #   Typhoeus::Expectation.clear
      def clear
        all.clear
      end

      # Returns stubbed response matching the
      # provided request.
      #
      # @example Find response
      #   Typhoeus::Expectation.response_for(request)
      #
      # @return [ Typhoeus::Response ] The stubbed response from a
      #   matching expectation, or nil if no matching expectation
      #   is found.
      #
      # @api private
      def response_for(request)
        expectation = find_by(request)
        return nil if expectation.nil?

        expectation.response(request)
      end

      # @api private
      def find_by(request)
        all.find do |expectation|
          expectation.matches?(request)
        end
      end
    end

    # Creates an expectation.
    #
    # @example Create expectation.
    #   Typhoeus::Expectation.new(base_url)
    #
    # @return [ Expectation ] The created expectation.
    #
    # @api private
    def initialize(base_url, options = {})
      @base_url = base_url
      @options = options
      @response_counter = 0
      @from = nil
    end

    # Set from value to mark an expectaion. Useful for
    # other libraries, e.g. WebMock.
    #
    # @example Mark expectation.
    #   expectation.from(:webmock)
    #
    # @param [ String ] value Value to set.
    #
    # @return [ Expectation ] Returns self.
    #
    # @api private
    def stubbed_from(value)
      @from = value
      self
    end

    # Specify what should be returned,
    # when this expectation is hit.
    #
    # @example Add response.
    #   expectation.and_return(response)
    #
    # @return [ void ]
    def and_return(response=nil, &block)
      new_response = (response.nil? ? block : response)
      responses.push(*new_response)
    end

    # Checks whether this expectation matches
    # the provided request.
    #
    # @example Check if request matches.
    #   expectation.matches? request
    #
    # @param [ Request ] request The request to check.
    #
    # @return [ Boolean ] True when matches, else false.
    #
    # @api private
    def matches?(request)
      url_match?(request.base_url) && options_match?(request)
    end

    # Return canned responses.
    #
    # @example Return responses.
    #   expectation.responses
    #
    # @return [ Array<Typhoeus::Response> ] The responses.
    #
    # @api private
    def responses
      @responses ||= []
    end

    # Return the response. When there are
    # multiple responses, they are returned one
    # by one.
    #
    # @example Return response.
    #   expectation.response
    #
    # @return [ Response ] The response.
    #
    # @api private
    def response(request)
      response = responses.fetch(@response_counter, responses.last)
      if response.respond_to?(:call)
        response = response.call(request)
      end
      @response_counter += 1
      response.mock = @from || true
      response
    end

    private

    # Check whether the options matches the request options.
    # I checks options and original options.
    def options_match?(request)
      (options ? options.all?{ |k,v| request.original_options[k] == v || request.options[k] == v } : true)
    end

    # Check whether the base_url matches the request url.
    # The base_url can be a string, regex or nil. String and
    # regexp are checked, nil is always true, else false.
    #
    # Nil serves as a placeholder in case you want to match
    # all urls.
    def url_match?(request_url)
      case base_url
      when String
        base_url == request_url
      when Regexp
        base_url === request_url
      when nil
        true
      else
        false
      end
    end
  end
end
