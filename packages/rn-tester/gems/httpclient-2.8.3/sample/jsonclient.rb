require 'httpclient'
require 'json'
 
module HTTP
  class Message
    # Returns JSON object of message body
    alias original_content content
    def content
      if JSONClient::CONTENT_TYPE_JSON_REGEX =~ content_type
        JSON.parse(original_content)
      else
        original_content
      end
    end
  end
end
 
 
# JSONClient provides JSON related methods in addition to HTTPClient.
class JSONClient < HTTPClient
  CONTENT_TYPE_JSON_REGEX = /(application|text)\/(x-)?json/i
 
  attr_accessor :content_type_json
 
  class JSONRequestHeaderFilter
    attr_accessor :replace
 
    def initialize(client)
      @client = client
      @replace = false
    end
 
    def filter_request(req)
      req.header['content-type'] = @client.content_type_json if @replace
    end
 
    def filter_response(req, res)
      @replace = false
    end
  end
 
  def initialize(*args)
    super
    @header_filter = JSONRequestHeaderFilter.new(self)
    @request_filter << @header_filter
    @content_type_json = 'application/json; charset=utf-8'
  end
 
  def post(uri, *args, &block)
    @header_filter.replace = true
    request(:post, uri, jsonify(argument_to_hash(args, :body, :header, :follow_redirect)), &block)
  end
 
  def put(uri, *args, &block)
    @header_filter.replace = true
    request(:put, uri, jsonify(argument_to_hash(args, :body, :header)), &block)
  end
 
private
 
  def jsonify(hash)
    if hash[:body] && hash[:body].is_a?(Hash)
      hash[:body] = JSON.generate(hash[:body])
    end
    hash
  end
end
