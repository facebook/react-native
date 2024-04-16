require 'uri'
require 'httpclient'

class DAV
  attr_reader :headers

  def initialize(uri = nil)
    @uri = nil
    @headers = {}
    open(uri) if uri
    proxy = ENV['HTTP_PROXY'] || ENV['http_proxy'] || nil
    @client = HTTPClient.new(proxy)
  end

  def open(uri)
    @uri = if uri.is_a?(URI)
	uri
      else
	URI.parse(uri)
      end
  end

  def set_basic_auth(user_id, passwd)
    @client.set_basic_auth(@uri, user_id, passwd)
  end

  # TODO: propget/propset support

  def propfind(target)
    target_uri = @uri + target
    res = @client.propfind(target_uri)
    res.body.content
  end

  def get(target, local = nil)
    local ||= target
    target_uri = @uri + target
    if FileTest.exist?(local)
      raise RuntimeError.new("File #{ local } exists.")
    end
    f = File.open(local, "wb")
    res = @client.get(target_uri, nil, @headers) do |data|
      f << data
    end
    f.close
    STDOUT.puts("#{ res.header['content-length'][0] } bytes saved to file #{ target }.")
  end

  def debug_dev=(dev)
    @client.debug_dev = dev
  end

  def get_content(target)
    target_uri = @uri + target
    @client.get_content(target_uri, nil, @headers)
  end

  def put_content(target, content)
    target_uri = @uri + target
    res = @client.put(target_uri, content, @headers)
    if res.status < 200 or res.status >= 300
      raise "HTTP PUT failed: #{res.inspect}"
    end
  end

  class Mock
    attr_reader :headers

    def initialize(uri = nil)
      @uri = nil
      @headers = {}
      open(uri) if uri

      @cache = {}
    end

    def open(uri)
      @uri = uri.is_a?(URI) ?  uri : URI.parse(uri)
    end

    def set_basic_auth(user_id, passwd)
      # ignore
    end

    def propfind(target)
      # not found
      nil
    end

    def get(target, local = nil)
      # ignore
    end

    def get_content(target)
      @cache[target]
    end

    def put_content(target, content)
      @cache[target] = content
      nil
    end
  end
end
