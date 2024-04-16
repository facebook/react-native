require 'httpclient'
require 'json'
 
# JSONClient auto-converts Hash <-> JSON in request and response.
# * For POST or PUT request, convert Hash body to JSON String with 'application/json; charset=utf-8' header.
# * For response, convert JSON String to Hash when content-type is '(application|text)/(x-)?json'
class JSONClient < HTTPClient
  CONTENT_TYPE_JSON_REGEX = /(application|text)\/(x-)?json/i
  CONTENT_TYPE_JSON = 'application/json; charset=utf-8'

  attr_reader :content_type_json_request
  attr_reader :content_type_json_response_regex
 
  def initialize(*args)
    super
    @content_type_json_request = CONTENT_TYPE_JSON
    @content_type_json_response_regex = CONTENT_TYPE_JSON_REGEX
  end
 
  def post(uri, *args, &block)
    request(:post, uri, argument_to_hash_for_json(args), &block)
  end
 
  def put(uri, *args, &block)
    request(:put, uri, argument_to_hash_for_json(args), &block)
  end

  def request(method, uri, *args, &block)
    res = super
    if @content_type_json_response_regex =~ res.content_type
      res = wrap_json_response(res)
    end
    res
  end
 
private

  def argument_to_hash_for_json(args)
    hash = argument_to_hash(args, :body, :header, :follow_redirect)
    if hash[:body].is_a?(Hash)
      hash[:header] = json_header(hash[:header])
      hash[:body] = JSON.generate(hash[:body])
    end
    hash
  end

  def json_header(header)
    header ||= {}
    if header.is_a?(Hash)
      header['Content-Type'] = @content_type_json_request
    else
      header << ['Content-Type', @content_type_json_request]
    end
    header
  end

  def wrap_json_response(original)
    res = ::HTTP::Message.new_response(JSON.parse(original.content))
    res.http_header = original.http_header
    res.previous = original
    res
  end
end
