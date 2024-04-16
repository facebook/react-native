# -*- encoding: utf-8 -*-
require File.expand_path('helper', File.dirname(__FILE__))
require 'tempfile'


class TestHTTPClient < Test::Unit::TestCase
  include Helper
  include HTTPClient::Util

  def setup
    super
    setup_server
    setup_client
  end

  def teardown
    super
  end

  def test_initialize
    setup_proxyserver
    escape_noproxy do
      @proxyio.string = ""
      @client = HTTPClient.new(proxyurl)
      assert_equal(urify(proxyurl), @client.proxy)
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ =~ @proxyio.string)
    end
  end

  def test_agent_name
    @client = HTTPClient.new(nil, "agent_name_foo")
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_match(/^User-Agent: agent_name_foo \(#{HTTPClient::VERSION}/, lines[4])
  end

  def test_from
    @client = HTTPClient.new(nil, nil, "from_bar")
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_match(/^From: from_bar/, lines[5])
  end

  def test_debug_dev
    str = ""
    @client.debug_dev = str
    assert_equal(str.object_id, @client.debug_dev.object_id)
    assert(str.empty?)
    @client.get(serverurl)
    assert(!str.empty?)
  end

  def test_debug_dev_stream
    str = ""
    @client.debug_dev = str
    conn = @client.get_async(serverurl)
    Thread.pass while !conn.finished?
    assert(!str.empty?)
  end

  def test_protocol_version_http09
    @client.protocol_version = 'HTTP/0.9'
    @client.debug_dev = str = ''
    @client.test_loopback_http_response << "hello\nworld\n"
    res = @client.get(serverurl + 'hello')
    assert_equal('0.9', res.http_version)
    assert_equal(nil, res.status)
    assert_equal(nil, res.reason)
    assert_equal("hello\nworld\n", res.content)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET /hello HTTP/0.9", lines[3])
    assert_equal("Connection: close", lines[7])
    assert_equal("= Response", lines[8])
    assert_match(/^hello$/, lines[9])
    assert_match(/^world$/, lines[10])
  end

  def test_protocol_version_http10
    assert_equal(nil, @client.protocol_version)
    @client.protocol_version = 'HTTP/1.0'
    assert_equal('HTTP/1.0', @client.protocol_version)
    str = ""
    @client.debug_dev = str
    @client.get(serverurl + 'hello')
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET /hello HTTP/1.0", lines[3])
    assert_equal("Connection: close", lines[7])
    assert_equal("= Response", lines[8])
  end

  def test_header_accept_by_default
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("Accept: */*", lines[5])
  end

  def test_header_accept
    str = ""
    @client.debug_dev = str
    @client.get(serverurl, :header => {:Accept => 'text/html'})
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("Accept: text/html", lines[4])
  end

  def test_header_symbol
    str = ""
    @client.debug_dev = str
    @client.post(serverurl + 'servlet', :header => {:'Content-Type' => 'application/json'}, :body => 'hello')
    lines = str.split(/(?:\r?\n)+/).grep(/^Content-Type/)
    assert_equal(2, lines.size) # 1 for both request and response
  end

  def test_host_given
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET / HTTP/1.1", lines[3])
    assert_equal("Host: localhost:#{serverport}", lines[7])
    #
    @client.reset_all
    str = ""
    @client.debug_dev = str
    @client.get(serverurl, nil, {'Host' => 'foo'})
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET / HTTP/1.1", lines[3])
    assert_equal("Host: foo", lines[4]) # use given param
  end

  def test_redirect_returns_not_modified
    assert_nothing_raised do
      ::Timeout.timeout(2) do
        @client.get(serverurl + 'status', {:status => 306}, {:follow_redirect => true})
      end
    end
  end

  class LocationRemoveFilter
    def filter_request(req); end
    def filter_response(req, res); res.header.delete('Location'); end
  end

  def test_redirect_without_location_should_gracefully_fail
    @client.request_filter << LocationRemoveFilter.new
    assert_raises(HTTPClient::BadResponseError) do
      @client.get(serverurl + 'redirect1', :follow_redirect => true)
    end
  end

  def test_protocol_version_http11
    assert_equal(nil, @client.protocol_version)
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET / HTTP/1.1", lines[3])
    assert_equal("Host: localhost:#{serverport}", lines[7])
    @client.protocol_version = 'HTTP/1.1'
    assert_equal('HTTP/1.1', @client.protocol_version)
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET / HTTP/1.1", lines[3])
    @client.protocol_version = 'HTTP/1.0'
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET / HTTP/1.0", lines[3])
  end

  def test_proxy
    setup_proxyserver
    escape_noproxy do
      begin
        @client.proxy = "http://あ"
      rescue => e
        assert_match(/InvalidURIError/, e.class.to_s)
      end
      @client.proxy = ""
      assert_nil(@client.proxy)
      @client.proxy = "http://admin:admin@foo:1234"
      assert_equal(urify("http://admin:admin@foo:1234"), @client.proxy)
      uri = urify("http://bar:2345")
      @client.proxy = uri
      assert_equal(uri, @client.proxy)
      #
      @proxyio.string = ""
      @client.proxy = nil
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ !~ @proxyio.string)
      #
      @proxyio.string = ""
      @client.proxy = proxyurl
      @client.debug_dev = str = ""
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ =~ @proxyio.string)
      assert(/Host: localhost:#{serverport}/ =~ str)
    end
  end

  def test_host_header
    @client.proxy = proxyurl
    @client.debug_dev = str = ""
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\n\r\n"
    assert_equal(200, @client.head('http://www.example.com/foo').status)
    # ensure no ':80' is added.  some servers dislike that.
    assert(/\r\nHost: www\.example\.com\r\n/ =~ str)
    #
    @client.debug_dev = str = ""
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\n\r\n"
    assert_equal(200, @client.head('http://www.example.com:12345/foo').status)
    # ensure ':12345' exists.
    assert(/\r\nHost: www\.example\.com:12345\r\n/ =~ str)
  end

  def test_proxy_env
    setup_proxyserver
    escape_env do
      ENV['http_proxy'] = "http://admin:admin@foo:1234"
      ENV['NO_PROXY'] = "foobar"
      client = HTTPClient.new
      assert_equal(urify("http://admin:admin@foo:1234"), client.proxy)
      assert_equal('foobar', client.no_proxy)
    end
  end

  def test_proxy_env_cgi
    setup_proxyserver
    escape_env do
      ENV['REQUEST_METHOD'] = 'GET' # CGI environment emulation
      ENV['http_proxy'] = "http://admin:admin@foo:1234"
      ENV['no_proxy'] = "foobar"
      client = HTTPClient.new
      assert_equal(nil, client.proxy)
      ENV['CGI_HTTP_PROXY'] = "http://admin:admin@foo:1234"
      client = HTTPClient.new
      assert_equal(urify("http://admin:admin@foo:1234"), client.proxy)
    end
  end

  def test_empty_proxy_env
    setup_proxyserver
    escape_env do
      ENV['http_proxy'] = ""
      client = HTTPClient.new
      assert_equal(nil, client.proxy)
    end
  end

  def test_noproxy_for_localhost
    @proxyio.string = ""
    @client.proxy = proxyurl
    assert_equal(200, @client.head(serverurl).status)
    assert(/accept/ !~ @proxyio.string)
  end

  def test_no_proxy
    setup_proxyserver
    escape_noproxy do
      # proxy is not set.
      assert_equal(nil, @client.no_proxy)
      @client.no_proxy = 'localhost'
      assert_equal('localhost', @client.no_proxy)
      @proxyio.string = ""
      @client.proxy = nil
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ !~ @proxyio.string)
      #
      @proxyio.string = ""
      @client.proxy = proxyurl
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ !~ @proxyio.string)
      #
      @client.no_proxy = 'foobar'
      @proxyio.string = ""
      @client.proxy = proxyurl
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ =~ @proxyio.string)
      #
      @client.no_proxy = 'foobar,localhost:baz'
      @proxyio.string = ""
      @client.proxy = proxyurl
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ !~ @proxyio.string)
      #
      @client.no_proxy = 'foobar,localhost:443'
      @proxyio.string = ""
      @client.proxy = proxyurl
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ =~ @proxyio.string)
      #
      @client.no_proxy = "foobar,localhost:443:localhost:#{serverport},baz"
      @proxyio.string = ""
      @client.proxy = proxyurl
      assert_equal(200, @client.head(serverurl).status)
      assert(/accept/ !~ @proxyio.string)
    end
  end

  def test_no_proxy_with_initial_dot
    @client.debug_dev = str = ""
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\n\r\n"
    @client.no_proxy = ''
    @client.proxy = proxyurl
    @client.head('http://www.foo.com')
    assert(/CONNECT TO localhost/ =~ str, 'via proxy')
    #
    @client.debug_dev = str = ""
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\n\r\n"
    @client.no_proxy = '.foo.com'
    @client.proxy = proxyurl
    @client.head('http://www.foo.com')
    assert(/CONNECT TO www.foo.com/ =~ str, 'no proxy because .foo.com matches with www.foo.com')
    #
    @client.debug_dev = str = ""
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\n\r\n"
    @client.no_proxy = '.foo.com'
    @client.proxy = proxyurl
    @client.head('http://foo.com')
    assert(/CONNECT TO localhost/ =~ str, 'via proxy because .foo.com does not matche with foo.com')
    #
    @client.debug_dev = str = ""
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\n\r\n"
    @client.no_proxy = 'foo.com'
    @client.proxy = proxyurl
    @client.head('http://foo.com')
    assert(/CONNECT TO foo.com/ =~ str, 'no proxy because foo.com matches with foo.com')
  end

  def test_cookie_update_while_authentication
    escape_noproxy do
      @client.test_loopback_http_response << <<EOS
HTTP/1.0 401\r
Date: Fri, 19 Dec 2008 11:57:29 GMT\r
Content-Type: text/plain\r
Content-Length: 0\r
WWW-Authenticate: Basic realm="hello"\r
Set-Cookie: foo=bar; path=/; domain=.example.org; expires=#{Time.at(1924873200).httpdate}\r
\r
EOS
      @client.test_loopback_http_response << <<EOS
HTTP/1.1 200 OK\r
Content-Length: 5\r
Connection: close\r
\r
hello
EOS
      @client.debug_dev = str = ''
      @client.set_auth("http://www.example.org/baz/", 'admin', 'admin')
      assert_equal('hello', @client.get('http://www.example.org/baz/foo').content)
      assert_match(/^Cookie: foo=bar/, str)
      assert_match(/^Authorization: Basic YWRtaW46YWRtaW4=/, str)
    end
  end


  def test_proxy_ssl
    escape_noproxy do
      @client.proxy = 'http://admin:admin@localhost:8080/'
      # disconnected at initial 'CONNECT' so there're 2 loopback responses
      @client.test_loopback_http_response << <<EOS
HTTP/1.0 407 Proxy Authentication Required\r
Date: Fri, 19 Dec 2008 11:57:29 GMT\r
Content-Type: text/plain\r
Content-Length: 0\r
Proxy-Authenticate: Basic realm="hello"\r
Proxy-Connection: close\r
\r
EOS
      @client.test_loopback_http_response << <<EOS
HTTP/1.0 200 Connection established\r
\r
HTTP/1.1 200 OK\r
Content-Length: 5\r
Connection: close\r
\r
hello
EOS
      assert_equal('hello', @client.get('https://localhost:17171/baz').content)
    end
  end

  def test_loopback_response
    @client.test_loopback_response << 'message body 1'
    @client.test_loopback_response << 'message body 2'
    assert_equal('message body 1', @client.get_content('http://somewhere'))
    assert_equal('message body 2', @client.get_content('http://somewhere'))
    #
    @client.debug_dev = str = ''
    @client.test_loopback_response << 'message body 3'
    assert_equal('message body 3', @client.get_content('http://somewhere'))
    assert_match(/message body 3/, str)
  end

  def test_loopback_response_stream
    @client.test_loopback_response << 'message body 1'
    @client.test_loopback_response << 'message body 2'
    conn = @client.get_async('http://somewhere')
    Thread.pass while !conn.finished?
    assert_equal('message body 1', conn.pop.content.read)
    conn = @client.get_async('http://somewhere')
    Thread.pass while !conn.finished?
    assert_equal('message body 2', conn.pop.content.read)
  end

  def test_loopback_http_response
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\ncontent-length: 100\n\nmessage body 1"
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\ncontent-length: 100\n\nmessage body 2"
    assert_equal('message body 1', @client.get_content('http://somewhere'))
    assert_equal('message body 2', @client.get_content('http://somewhere'))
  end

  def test_multiline_header
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\nX-Foo: XXX\n   YYY\nX-Bar: \n XXX\n\tYYY\ncontent-length: 100\n\nmessage body 1"
    res = @client.get('http://somewhere')
    assert_equal('message body 1', res.content)
    assert_equal(['XXX YYY'], res.header['x-foo'])
    assert_equal(['XXX YYY'], res.header['x-bar'])
  end

  def test_broken_header
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\nXXXXX\ncontent-length: 100\n\nmessage body 1"
    res = @client.get('http://somewhere')
    assert_equal('message body 1', res.content)
  end

  def test_request_uri_in_response
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\ncontent-length: 100\n\nmessage body"
    assert_equal(urify('http://google.com/'), @client.get('http://google.com/').header.request_uri)
  end

  def test_request_uri_in_response_when_redirect
    expected = urify(serverurl + 'hello')
    assert_equal(expected, @client.get(serverurl + 'redirect1', :follow_redirect => true).header.request_uri)
    assert_equal(expected, @client.get(serverurl + 'redirect2', :follow_redirect => true).header.request_uri)
  end

  def test_redirect_non_https
    url = serverurl + 'redirect1'
    https_url = urify(url)
    https_url.scheme = 'https'
    #
    redirect_to_http = "HTTP/1.0 302 OK\nLocation: #{url}\n\n"
    redirect_to_https = "HTTP/1.0 302 OK\nLocation: #{https_url}\n\n"
    #
    # https -> http is denied
    @client.test_loopback_http_response << redirect_to_http
    assert_raises(HTTPClient::BadResponseError) do
      @client.get_content(https_url)
    end
    #
    # http -> http is OK
    @client.reset_all
    @client.test_loopback_http_response << redirect_to_http
    assert_equal('hello', @client.get_content(url))
    #
    # http -> https is OK
    @client.reset_all
    @client.test_loopback_http_response << redirect_to_https
    assert_raises(OpenSSL::SSL::SSLError) do
      # trying to normal endpoint with SSL -> SSL negotiation failure
      @client.get_content(url)
    end
    #
    # https -> https is OK
    @client.reset_all
    @client.test_loopback_http_response << redirect_to_https
    assert_raises(OpenSSL::SSL::SSLError) do
      # trying to normal endpoint with SSL -> SSL negotiation failure
      @client.get_content(https_url)
    end
    #
    # https -> http with strict_redirect_uri_callback
    @client.redirect_uri_callback = @client.method(:strict_redirect_uri_callback)
    @client.test_loopback_http_response << redirect_to_http
    assert_raises(HTTPClient::BadResponseError) do
      @client.get_content(https_url)
    end
  end

  def test_redirect_see_other
    assert_equal('hello', @client.post_content(serverurl + 'redirect_see_other'))
  end

  def test_redirect_relative
    @client.test_loopback_http_response << "HTTP/1.0 302 OK\nLocation: hello\n\n"
    silent do
      assert_equal('hello', @client.get_content(serverurl + 'redirect1'))
    end
    #
    @client.reset_all
    @client.redirect_uri_callback = @client.method(:strict_redirect_uri_callback)
    assert_equal('hello', @client.get_content(serverurl + 'redirect1'))
    @client.reset_all
    @client.test_loopback_http_response << "HTTP/1.0 302 OK\nLocation: hello\n\n"
    begin
      @client.get_content(serverurl + 'redirect1')
      assert(false)
    rescue HTTPClient::BadResponseError => e
      assert_equal(302, e.res.status)
    end
  end

  def test_redirect_https_relative
    url = serverurl + 'redirect1'
    https_url = urify(url)
    https_url.scheme = 'https'
    @client.test_loopback_http_response << "HTTP/1.0 302 OK\nLocation: /foo\n\n"
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\n\nhello"
    silent do
      assert_equal('hello', @client.get_content(https_url))
    end
  end

  def test_no_content
    assert_nothing_raised do
      ::Timeout.timeout(2) do
        @client.get(serverurl + 'status', :status => 101)
        @client.get(serverurl + 'status', :status => 204)
        @client.get(serverurl + 'status', :status => 304)
      end
    end
  end

  def test_get_content
    assert_equal('hello', @client.get_content(serverurl + 'hello'))
    assert_equal('hello', @client.get_content(serverurl + 'redirect1'))
    assert_equal('hello', @client.get_content(serverurl + 'redirect2'))
    url = serverurl.sub(/localhost/, '127.0.0.1')
    assert_equal('hello', @client.get_content(url + 'hello'))
    assert_equal('hello', @client.get_content(url + 'redirect1'))
    assert_equal('hello', @client.get_content(url + 'redirect2'))
    @client.reset(serverurl)
    @client.reset(url)
    @client.reset(serverurl)
    @client.reset(url)
    assert_raises(HTTPClient::BadResponseError) do
      @client.get_content(serverurl + 'notfound')
    end
    assert_raises(HTTPClient::BadResponseError) do
      @client.get_content(serverurl + 'redirect_self')
    end
    called = false
    @client.redirect_uri_callback = lambda { |uri, res|
      newuri = res.header['location'][0]
      called = true
      newuri
    }
    assert_equal('hello', @client.get_content(serverurl + 'relative_redirect'))
    assert(called)
  end

  def test_get_content_with_base_url
    @client = HTTPClient.new(:base_url => serverurl)
    assert_equal('hello', @client.get_content('/hello'))
    assert_equal('hello', @client.get_content('/redirect1'))
    assert_equal('hello', @client.get_content('/redirect2'))
    @client.reset('/')
    assert_raises(HTTPClient::BadResponseError) do
      @client.get_content('/notfound')
    end
    assert_raises(HTTPClient::BadResponseError) do
      @client.get_content('/redirect_self')
    end
    called = false
    @client.redirect_uri_callback = lambda { |uri, res|
      newuri = res.header['location'][0]
      called = true
      newuri
    }
    assert_equal('hello', @client.get_content('/relative_redirect'))
    assert(called)
  end

  GZIP_CONTENT = "\x1f\x8b\x08\x00\x1a\x96\xe0\x4c\x00\x03\xcb\x48\xcd\xc9\xc9\x07\x00\x86\xa6\x10\x36\x05\x00\x00\x00"
  DEFLATE_CONTENT = "\x78\x9c\xcb\x48\xcd\xc9\xc9\x07\x00\x06\x2c\x02\x15"
  DEFLATE_NOHEADER_CONTENT = "x\x9C\xCBH\xCD\xC9\xC9\a\x00\x06,\x02\x15"
  [GZIP_CONTENT, DEFLATE_CONTENT, DEFLATE_NOHEADER_CONTENT].each do |content|
    content.force_encoding('BINARY') if content.respond_to?(:force_encoding)
  end
  def test_get_gzipped_content
    @client.transparent_gzip_decompression = false
    content = @client.get_content(serverurl + 'compressed?enc=gzip')
    assert_not_equal('hello', content)
    assert_equal(GZIP_CONTENT, content)
    @client.transparent_gzip_decompression = true
    @client.reset_all
    assert_equal('hello', @client.get_content(serverurl + 'compressed?enc=gzip'))
    assert_equal('hello', @client.get_content(serverurl + 'compressed?enc=deflate'))
    assert_equal('hello', @client.get_content(serverurl + 'compressed?enc=deflate_noheader'))
    @client.transparent_gzip_decompression = false
    @client.reset_all
  end

  def test_get_content_with_block
    @client.get_content(serverurl + 'hello') do |str|
      assert_equal('hello', str)
    end
    @client.get_content(serverurl + 'redirect1') do |str|
      assert_equal('hello', str)
    end
    @client.get_content(serverurl + 'redirect2') do |str|
      assert_equal('hello', str)
    end
  end

  def test_post_content
    assert_equal('hello', @client.post_content(serverurl + 'hello'))
    assert_equal('hello', @client.post_content(serverurl + 'redirect1'))
    assert_equal('hello', @client.post_content(serverurl + 'redirect2'))
    assert_raises(HTTPClient::BadResponseError) do
      @client.post_content(serverurl + 'notfound')
    end
    assert_raises(HTTPClient::BadResponseError) do
      @client.post_content(serverurl + 'redirect_self')
    end
    called = false
    @client.redirect_uri_callback = lambda { |uri, res|
      newuri = res.header['location'][0]
      called = true
      newuri
    }
    assert_equal('hello', @client.post_content(serverurl + 'relative_redirect'))
    assert(called)
  end

  def test_post_content_io
    post_body = StringIO.new("1234567890")
    assert_equal('post,1234567890', @client.post_content(serverurl + 'servlet', post_body))
    post_body = StringIO.new("1234567890")
    assert_equal('post,1234567890', @client.post_content(serverurl + 'servlet_redirect', post_body))
    #
    post_body = StringIO.new("1234567890")
    post_body.read(5)
    assert_equal('post,67890', @client.post_content(serverurl + 'servlet_redirect', post_body))
  end

  def test_head
    assert_equal("head", @client.head(serverurl + 'servlet').header["x-head"][0])
    param = {'1'=>'2', '3'=>'4'}
    res = @client.head(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_head_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.head_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_get
    assert_equal("get", @client.get(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
    assert_nil(res.contenttype)
    #
    url = serverurl.to_s + 'servlet?5=6&7=8'
    res = @client.get(url, param)
    assert_equal(param.merge("5"=>"6", "7"=>"8"), params(res.header["x-query"][0]))
    assert_nil(res.contenttype)
  end

  def test_get_with_base_url
    @client = HTTPClient.new(:base_url => serverurl)
    assert_equal("get", @client.get('/servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get('/servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
    assert_nil(res.contenttype)
    #
    @client.base_url = serverurl[0...-1] + '/servlet'
    url = '?5=6&7=8'
    res = @client.get(url, param)
    assert_equal(param.merge("5"=>"6", "7"=>"8"), params(res.header["x-query"][0]))
    assert_nil(res.contenttype)
  end

  def test_get_with_default_header
    @client = HTTPClient.new(:base_url => serverurl, :default_header => {'x-header' => 'custom'})
    assert_equal('custom', @client.get('/servlet').headers['X-Header'])
    @client.default_header = {'x-header' => 'custom2'}
    assert_equal('custom2', @client.get('/servlet').headers['X-Header'])
    # passing Hash overrides
    assert_equal('custom3', @client.get('/servlet', :header => {'x-header' => 'custom3'}).headers['X-Header'])
    # passing Array does not override
    assert_equal('custom2, custom4', @client.get('/servlet', :header => [['x-header', 'custom4']]).headers['X-Header'])
  end

  def test_head_follow_redirect
    expected = urify(serverurl + 'hello')
    assert_equal(expected, @client.head(serverurl + 'hello', :follow_redirect => true).header.request_uri)
    assert_equal(expected, @client.head(serverurl + 'redirect1', :follow_redirect => true).header.request_uri)
    assert_equal(expected, @client.head(serverurl + 'redirect2', :follow_redirect => true).header.request_uri)
  end

  def test_get_follow_redirect
    assert_equal('hello', @client.get(serverurl + 'hello', :follow_redirect => true).body)
    assert_equal('hello', @client.get(serverurl + 'redirect1', :follow_redirect => true).body)

    res = @client.get(serverurl + 'redirect2', :follow_redirect => true)
    assert_equal('hello', res.body)
    assert_equal("http://localhost:#{@serverport}/hello", res.header.request_uri.to_s)
    assert_equal("http://localhost:#{@serverport}/redirect3", res.previous.header.request_uri.to_s)
    assert_equal("http://localhost:#{@serverport}/redirect2", res.previous.previous.header.request_uri.to_s)
    assert_equal(nil, res.previous.previous.previous)
  end

  def test_get_follow_redirect_with_query
    assert_equal('hello?1=2&3=4', @client.get(serverurl + 'redirect1', :query => {1 => 2, 3 => 4}, :follow_redirect => true).body)
  end

  def test_get_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.get_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_get_async_with_base_url
    param = {'1'=>'2', '3'=>'4'}
    @client = HTTPClient.new(:base_url => serverurl)

    # Use preconfigured :base_url
    conn = @client.get_async('servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
    # full URL still works
    conn = @client.get_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_get_async_for_largebody
    conn = @client.get_async(serverurl + 'largebody')
    res = conn.pop
    assert_equal(1000*1000, res.content.read.length)
  end

  if RUBY_VERSION > "1.9"
    def test_post_async_with_default_internal
      original_encoding = Encoding.default_internal
      Encoding.default_internal = Encoding::UTF_8
      begin
        post_body = StringIO.new("こんにちは")
        conn = @client.post_async(serverurl + 'servlet', post_body)
        Thread.pass while !conn.finished?
        res = conn.pop
        assert_equal 'post,こんにちは', res.content.read
      ensure
        Encoding.default_internal = original_encoding
      end
    end
  end

  def test_get_with_block
    called = false
    res = @client.get(serverurl + 'servlet') { |str|
      assert_equal('get', str)
      called = true
    }
    assert(called)
    # res does not have a content
    assert_nil(res.content)
  end

  def test_get_with_block_arity_2
    called = false
    res = @client.get(serverurl + 'servlet') { |blk_res, str|
      assert_equal(200, blk_res.status)
      assert_equal('get', str)
      called = true
    }
    assert(called)
    # res does not have a content
    assert_nil(res.content)
  end

  def test_get_with_block_and_redirects
    called = false
    res = @client.get(serverurl + 'servlet', :follow_redirect => true) { |str|
      assert_equal('get', str)
      called = true
    }
    assert(called)
    # res does not have a content
    assert_nil(res.content)
  end

  def test_get_with_block_arity_2_and_redirects
    called = false
    res = @client.get(serverurl + 'servlet', :follow_redirect => true) { |blk_res, str|
      assert_equal(200, blk_res.status)
      assert_equal('get', str)
      called = true
    }
    assert(called)
    # res does not have a content
    assert_nil(res.content)
  end

  def test_get_with_block_string_recycle
    @client.read_block_size = 2
    body = []
    _res = @client.get(serverurl + 'servlet') { |str|
      body << str
    }
    assert_equal(2, body.size)
    assert_equal("get", body.join) # Was "tt" by String object recycle...
  end

  def test_get_with_block_chunked_string_recycle
    server = TCPServer.open('localhost', 0)
    server_thread = Thread.new {
      Thread.abort_on_exception = true
      sock = server.accept
      create_keepalive_thread(1, sock)
    }
    url = "http://localhost:#{server.addr[1]}/"
    body = []
    begin
      _res = @client.get(url + 'chunked') { |str|
        body << str
      }
    ensure
      server.close
      server_thread.join
    end
    assert_equal('abcdefghijklmnopqrstuvwxyz1234567890abcdef', body.join)
  end

  def test_post
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4])
    param = {'1'=>'2', '3'=>'4'}
    res = @client.post(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_post_empty
    @client.debug_dev = str = ''
    # nil body means 'no content' that is allowed but WEBrick cannot handle it.
    @client.post(serverurl + 'servlet', :body => nil)
    # request does not have 'Content-Type'
    assert_equal(1, str.scan(/content-type/i).size)
  end

  def test_post_with_query
    # this {:query => 'query'} recognized as body
    res = @client.post(serverurl + 'servlet', :query => 'query')
    assert_equal("post", res.content[0, 4])
    assert_equal("query=query", res.headers["X-Query"])
    assert_equal("", res.headers["X-Request-Query"])
  end

  def test_post_with_query_and_body
    res = @client.post(serverurl + 'servlet', :query => {:query => 'query'}, :body => {:body => 'body'})
    assert_equal("post", res.content[0, 4])
    assert_equal("body=body", res.headers["X-Query"])
    assert_equal("query=query", res.headers["X-Request-Query"])
  end

  def test_post_follow_redirect
    assert_equal('hello', @client.post(serverurl + 'hello', :follow_redirect => true).body)
    assert_equal('hello', @client.post(serverurl + 'redirect1', :follow_redirect => true).body)
    assert_equal('hello', @client.post(serverurl + 'redirect2', :follow_redirect => true).body)
  end

  def test_post_with_content_type
    param = [['1', '2'], ['3', '4']]
    ext = {'content-type' => 'application/x-www-form-urlencoded', 'hello' => 'world'}
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4], ext)
    res = @client.post(serverurl + 'servlet', param, ext)
    assert_equal(Hash[param], params(res.header["x-query"][0]))
    #
    ext = [['content-type', 'multipart/form-data'], ['hello', 'world']]
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4], ext)
    res = @client.post(serverurl + 'servlet', param, ext)
    assert_match(/Content-Disposition: form-data; name="1"/, res.content)
    assert_match(/Content-Disposition: form-data; name="3"/, res.content)
    #
    ext = {'content-type' => 'multipart/form-data; boundary=hello'}
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4], ext)
    res = @client.post(serverurl + 'servlet', param, ext)
    assert_match(/Content-Disposition: form-data; name="1"/, res.content)
    assert_match(/Content-Disposition: form-data; name="3"/, res.content)
    assert_equal("post,--hello\r\nContent-Disposition: form-data; name=\"1\"\r\n\r\n2\r\n--hello\r\nContent-Disposition: form-data; name=\"3\"\r\n\r\n4\r\n--hello--\r\n\r\n", res.content)
  end

  def test_post_with_custom_multipart_and_boolean_params
    param = [['boolean_true', true]]
    ext = { 'content-type' => 'multipart/form-data' }
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4], ext)
    res = @client.post(serverurl + 'servlet', param, ext)
    assert_match(/Content-Disposition: form-data; name="boolean_true"\r\n\r\ntrue\r\n/, res.content)
    #
    param = [['boolean_false', false]]
    res = @client.post(serverurl + 'servlet', param, ext)
    assert_match(/Content-Disposition: form-data; name="boolean_false"\r\n\r\nfalse\r\n/, res.content)
    #
    param = [['nil', nil]]
    res = @client.post(serverurl + 'servlet', param, ext)
    assert_match(/Content-Disposition: form-data; name="nil"\r\n\r\n\r\n/, res.content)
  end

  def test_post_with_file
    STDOUT.sync = true
    File.open(__FILE__) do |file|
      res = @client.post(serverurl + 'servlet', {1=>2, 3=>file})
      assert_match(/^Content-Disposition: form-data; name="1"\r\n/nm, res.content)
      assert_match(/^Content-Disposition: form-data; name="3";/, res.content)
      assert_match(/FIND_TAG_IN_THIS_FILE/, res.content)
    end
  end

  def test_post_with_file_without_size
    STDOUT.sync = true
    File.open(__FILE__) do |file|
      def file.size
        # Simulates some strange Windows behaviour
        raise SystemCallError.new "Unknown Error (20047)"
      end
      assert_nothing_raised do
        @client.post(serverurl + 'servlet', {1=>2, 3=>file})
      end
    end
  end

  def test_post_with_io # streaming, but not chunked
    myio = StringIO.new("X" * (HTTP::Message::Body::DEFAULT_CHUNK_SIZE + 1))
    def myio.read(*args)
      @called ||= 0
      @called += 1
      super
    end
    def myio.called
      @called
    end
    @client.debug_dev = str = StringIO.new
    res = @client.post(serverurl + 'servlet', {1=>2, 3=>myio})
    assert_match(/\r\nContent-Disposition: form-data; name="1"\r\n/m, res.content)
    assert_match(/\r\n2\r\n/m, res.content)
    assert_match(/\r\nContent-Disposition: form-data; name="3"; filename=""\r\n/m, res.content)
    assert_match(/\r\nContent-Length:/m, str.string)
    # HTTPClient reads from head to 'size'; CHUNK_SIZE bytes then 1 byte, that's all.
    assert_equal(2, myio.called)
  end

  def test_post_with_io_nosize # streaming + chunked post
    myio = StringIO.new("4")
    def myio.size
      nil
    end
    @client.debug_dev = str = StringIO.new
    res = @client.post(serverurl + 'servlet', {1=>2, 3=>myio})
    assert_match(/\r\nContent-Disposition: form-data; name="1"\r\n/m, res.content)
    assert_match(/\r\n2\r\n/m, res.content)
    assert_match(/\r\nContent-Disposition: form-data; name="3"; filename=""\r\n/m, res.content)
    assert_match(/\r\n4\r\n/m, res.content)
    assert_match(/\r\nTransfer-Encoding: chunked\r\n/m, str.string)
  end

  def test_post_with_sized_io
    myio = StringIO.new("45")
    def myio.size
      1
    end
    res = @client.post(serverurl + 'servlet', myio)
    assert_equal('post,4', res.content)
  end

  def test_post_with_sized_io_part
    myio = StringIO.new("45")
    def myio.size
      1
    end
    @client.debug_dev = str = StringIO.new
    _res = @client.post(serverurl + 'servlet', { :file => myio })
    assert_match(/\r\n4\r\n/, str.string, 'should send "4" not "45"')
  end

  def test_post_with_unknown_sized_io_part
    myio1 = StringIO.new("123")
    myio2 = StringIO.new("45")
    class << myio1
      undef :size
    end
    class << myio2
      # This does not work because other file is 'unknown sized'
      def size
        1
      end
    end
    @client.debug_dev = str = StringIO.new
    _res = @client.post(serverurl + 'servlet', { :file1 => myio1, :file2 => myio2 })
    assert_match(/\r\n45\r\n/, str.string)
  end

  def test_post_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.post_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_post_with_block
    called = false
    res = @client.post(serverurl + 'servlet', '') { |str|
      assert_equal('post,', str)
      called = true
    }
    assert(called)
    assert_nil(res.content)
    #
    called = false
    param = [['1', '2'], ['3', '4']]
    res = @client.post(serverurl + 'servlet', param) { |str|
      assert_equal('post,1=2&3=4', str)
      called = true
    }
    assert(called)
    assert_equal('1=2&3=4', res.header["x-query"][0])
    assert_nil(res.content)
  end

  def test_post_with_custom_multipart
    ext = {'content-type' => 'multipart/form-data'}
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4], ext)
    body = [{ 'Content-Disposition' => 'form-data; name="1"', :content => "2"},
            { 'Content-Disposition' => 'form-data; name="3"', :content => "4"}]
    res = @client.post(serverurl + 'servlet', body, ext)
    assert_match(/Content-Disposition: form-data; name="1"/, res.content)
    assert_match(/Content-Disposition: form-data; name="3"/, res.content)
    #
    ext = {'content-type' => 'multipart/form-data; boundary=hello'}
    assert_equal("post", @client.post(serverurl + 'servlet', '').content[0, 4], ext)
    res = @client.post(serverurl + 'servlet', body, ext)
    assert_match(/Content-Disposition: form-data; name="1"/, res.content)
    assert_match(/Content-Disposition: form-data; name="3"/, res.content)
    assert_equal("post,--hello\r\nContent-Disposition: form-data; name=\"1\"\r\n\r\n2\r\n--hello\r\nContent-Disposition: form-data; name=\"3\"\r\n\r\n4\r\n--hello--\r\n\r\n", res.content)
  end

  def test_post_with_custom_multipart_and_file
    STDOUT.sync = true
    File.open(__FILE__) do |file|
      def file.original_filename
        'file.txt'
      end

      ext = { 'Content-Type' => 'multipart/alternative' }
      body = [{ 'Content-Type' => 'text/plain', :content => "this is only a test" },
              { 'Content-Type' => 'application/x-ruby', :content => file }]
      res = @client.post(serverurl + 'servlet', body, ext)
      assert_match(/^Content-Type: text\/plain\r\n/m, res.content)
      assert_match(/^this is only a test\r\n/m, res.content)
      assert_match(/^Content-Type: application\/x-ruby\r\n/m, res.content)
      assert_match(/Content-Disposition: form-data; name="3"; filename="file.txt"/, res.content)
      assert_match(/FIND_TAG_IN_THIS_FILE/, res.content)
    end
  end

  def test_patch
    assert_equal("patch", @client.patch(serverurl + 'servlet', '').content)
    param = {'1'=>'2', '3'=>'4'}
    @client.debug_dev = str = ''
    res = @client.patch(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
    assert_equal('Content-Type: application/x-www-form-urlencoded', str.split(/\r?\n/)[5])
  end

  def test_patch_with_query_and_body
    res = @client.patch(serverurl + 'servlet', :query => {:query => 'query'}, :body => {:body => 'body'})
    assert_equal("patch", res.content)
    assert_equal("body=body", res.headers["X-Query"])
    assert_equal("query=query", res.headers["X-Request-Query"])
  end

  def test_patch_bytesize
    res = @client.patch(serverurl + 'servlet', 'txt' => 'あいうえお')
    assert_equal('txt=%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A', res.header["x-query"][0])
    assert_equal('15', res.header["x-size"][0])
  end

  def test_patch_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.patch_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_put
    assert_equal("put", @client.put(serverurl + 'servlet', '').content)
    param = {'1'=>'2', '3'=>'4'}
    @client.debug_dev = str = ''
    res = @client.put(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
    assert_equal('Content-Type: application/x-www-form-urlencoded', str.split(/\r?\n/)[5])
  end

  def test_put_with_query_and_body
    res = @client.put(serverurl + 'servlet', :query => {:query => 'query'}, :body => {:body => 'body'})
    assert_equal("put", res.content)
    assert_equal("body=body", res.headers["X-Query"])
    assert_equal("query=query", res.headers["X-Request-Query"])
  end

  def test_put_bytesize
    res = @client.put(serverurl + 'servlet', 'txt' => 'あいうえお')
    assert_equal('txt=%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A', res.header["x-query"][0])
    assert_equal('15', res.header["x-size"][0])
  end

  def test_put_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.put_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_delete
    assert_equal("delete", @client.delete(serverurl + 'servlet').content)
  end

  def test_delete_with_query
    res = @client.delete(serverurl + 'servlet', :query => {:query => 'query'})
    assert_equal("delete", res.content)
    assert_equal('query=query', res.headers['X-Request-Query'])
  end

  def test_delete_with_query_and_body
    res = @client.delete(serverurl + 'servlet', :query => {:query => 'query'}, :body => {:body => 'body'})
    assert_equal("delete", res.content)
    assert_equal('query=query', res.headers['X-Request-Query'])
    assert_equal('body=body', res.headers['X-Query'])
  end

  # Not prohibited by spec, but normally it's ignored
  def test_delete_with_body
    param = {'1'=>'2', '3'=>'4'}
    @client.debug_dev = str = ''
    assert_equal("delete", @client.delete(serverurl + 'servlet', param).content)
    assert_equal({'1' => ['2'], '3' => ['4']}, HTTP::Message.parse(str.split(/\r?\n\r?\n/)[2]))
  end

  def test_delete_async
    conn = @client.delete_async(serverurl + 'servlet')
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal('delete', res.content.read)
  end

  def test_options
    assert_equal('options', @client.options(serverurl + 'servlet').content)
  end

  def test_options_with_header
    res = @client.options(serverurl + 'servlet', {'x-header' => 'header'})
    assert_equal('header', res.headers['X-Header'])
  end

  def test_options_with_body
    res = @client.options(serverurl + 'servlet', :body => 'body')
    assert_equal('body', res.headers['X-Body'])
  end

  def test_options_with_body_and_header
    res = @client.options(serverurl + 'servlet', :body => 'body', :header => {'x-header' => 'header'})
    assert_equal('header', res.headers['X-Header'])
    assert_equal('body', res.headers['X-Body'])
  end

  def test_options_async
    conn = @client.options_async(serverurl + 'servlet')
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal('options', res.content.read)
  end

  def test_propfind
    assert_equal("propfind", @client.propfind(serverurl + 'servlet').content)
  end

  def test_propfind_async
    conn = @client.propfind_async(serverurl + 'servlet')
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal('propfind', res.content.read)
  end

  def test_proppatch
    assert_equal("proppatch", @client.proppatch(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.proppatch(serverurl + 'servlet', param)
    assert_equal('proppatch', res.content)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_proppatch_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.proppatch_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal('proppatch', res.content.read)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_trace
    assert_equal("trace", @client.trace(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.trace(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_trace_async
    param = {'1'=>'2', '3'=>'4'}
    conn = @client.trace_async(serverurl + 'servlet', param)
    Thread.pass while !conn.finished?
    res = conn.pop
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_chunked
    assert_equal('chunked', @client.get_content(serverurl + 'chunked', { 'msg' => 'chunked' }))
    assert_equal('あいうえお', @client.get_content(serverurl + 'chunked', { 'msg' => 'あいうえお' }))
  end

  def test_chunked_empty
    assert_equal('', @client.get_content(serverurl + 'chunked', { 'msg' => '' }))
  end

  def test_get_query
    assert_equal({'1'=>'2'}, check_query_get({1=>2}))
    assert_equal({'a'=>'A', 'B'=>'b'}, check_query_get({"a"=>"A", "B"=>"b"}))
    assert_equal({'&'=>'&'}, check_query_get({"&"=>"&"}))
    assert_equal({'= '=>' =+'}, check_query_get({"= "=>" =+"}))
    assert_equal(
      ['=', '&'].sort,
      check_query_get([["=", "="], ["=", "&"]])['='].to_ary.sort
    )
    assert_equal({'123'=>'45'}, check_query_get('123=45'))
    assert_equal({'12 3'=>'45', ' '=>' '}, check_query_get('12+3=45&+=+'))
    assert_equal({}, check_query_get(''))
    assert_equal({'1'=>'2'}, check_query_get({1=>StringIO.new('2')}))
    assert_equal({'1'=>'2', '3'=>'4'}, check_query_get(StringIO.new('3=4&1=2')))

    hash = check_query_get({"a"=>["A","a"], "B"=>"b"})
    assert_equal({'a'=>'A', 'B'=>'b'}, hash)
    assert_equal(['A','a'], hash['a'].to_ary)

    hash = check_query_get({"a"=>WEBrick::HTTPUtils::FormData.new("A","a"), "B"=>"b"})
    assert_equal({'a'=>'A', 'B'=>'b'}, hash)
    assert_equal(['A','a'], hash['a'].to_ary)

    hash = check_query_get({"a"=>[StringIO.new("A"),StringIO.new("a")], "B"=>StringIO.new("b")})
    assert_equal({'a'=>'A', 'B'=>'b'}, hash)
    assert_equal(['A','a'], hash['a'].to_ary)
  end

  def test_post_body
    assert_equal({'1'=>'2'}, check_query_post({1=>2}))
    assert_equal({'a'=>'A', 'B'=>'b'}, check_query_post({"a"=>"A", "B"=>"b"}))
    assert_equal({'&'=>'&'}, check_query_post({"&"=>"&"}))
    assert_equal({'= '=>' =+'}, check_query_post({"= "=>" =+"}))
    assert_equal(
      ['=', '&'].sort,
      check_query_post([["=", "="], ["=", "&"]])['='].to_ary.sort
    )
    assert_equal({'123'=>'45'}, check_query_post('123=45'))
    assert_equal({'12 3'=>'45', ' '=>' '}, check_query_post('12+3=45&+=+'))
    assert_equal({}, check_query_post(''))
    #
    post_body = StringIO.new("foo=bar&foo=baz")
    assert_equal(
      ["bar", "baz"],
      check_query_post(post_body)["foo"].to_ary.sort
    )
  end

  def test_extra_headers
    str = ""
    @client.debug_dev = str
    @client.head(serverurl, nil, {"ABC" => "DEF"})
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_match("ABC: DEF", lines[4])
    #
    str = ""
    @client.debug_dev = str
    @client.get(serverurl, nil, [["ABC", "DEF"], ["ABC", "DEF"]])
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_match("ABC: DEF", lines[4])
    assert_match("ABC: DEF", lines[5])
  end

  def test_http_custom_date_header
    @client.debug_dev = (str = "")
    _res = @client.get(serverurl + 'hello', :header => {'Date' => 'foo'})
    lines = str.split(/(?:\r?\n)+/)
    assert_equal('Date: foo', lines[4])
  end

  def test_timeout
    assert_equal(60, @client.connect_timeout)
    assert_equal(120, @client.send_timeout)
    assert_equal(60, @client.receive_timeout)
    #
    @client.connect_timeout = 1
    @client.send_timeout = 2
    @client.receive_timeout = 3
    assert_equal(1, @client.connect_timeout)
    assert_equal(2, @client.send_timeout)
    assert_equal(3, @client.receive_timeout)
  end

  def test_connect_timeout
    # ToDo
  end

  def test_send_timeout
    # ToDo
  end

  def test_receive_timeout
    # this test takes 2 sec
    assert_equal('hello?sec=2', @client.get_content(serverurl + 'sleep?sec=2'))
    @client.receive_timeout = 1
    @client.reset_all
    assert_equal('hello?sec=0', @client.get_content(serverurl + 'sleep?sec=0'))
    assert_raise(HTTPClient::ReceiveTimeoutError) do
      @client.get_content(serverurl + 'sleep?sec=2')
    end
    @client.receive_timeout = 3
    @client.reset_all
    assert_equal('hello?sec=2', @client.get_content(serverurl + 'sleep?sec=2'))
  end

  def test_receive_timeout_post
    # this test takes 2 sec
    assert_equal('hello', @client.post(serverurl + 'sleep', :sec => 2).content)
    @client.receive_timeout = 1
    @client.reset_all
    assert_equal('hello', @client.post(serverurl + 'sleep', :sec => 0).content)
    assert_raise(HTTPClient::ReceiveTimeoutError) do
      @client.post(serverurl + 'sleep', :sec => 2)
    end
    @client.receive_timeout = 3
    @client.reset_all
    assert_equal('hello', @client.post(serverurl + 'sleep', :sec => 2).content)
  end

  def test_reset
    url = serverurl + 'servlet'
    assert_nothing_raised do
      5.times do
        @client.get(url)
        @client.reset(url)
      end
    end
  end

  def test_reset_all
    assert_nothing_raised do
      5.times do
        @client.get(serverurl + 'servlet')
        @client.reset_all
      end
    end
  end

  def test_cookies
    cookiefile = Tempfile.new('test_cookies_file')
    File.open(cookiefile.path, "wb") do |f|
      f << "http://rubyforge.org/account/login.php\tsession_ser\tLjEwMy45Ni40Ni0q%2A-fa0537de8cc31\t2000000000\trubyforge.org\t/account/\t9\n"
    end
    @client.set_cookie_store(cookiefile.path)
    #
    @client.reset_all
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\nSet-Cookie: session_ser=bar; expires=#{Time.at(1924873200).gmtime.httpdate}\n\nOK"
    @client.get_content('http://rubyforge.org/account/login.php')
    @client.save_cookie_store
    str = File.read(cookiefile.path)
    assert_match(%r(http://rubyforge.org/account/login.php\tsession_ser\tbar\t1924873200\trubyforge.org\t/account/\t9), str)
  end

  def test_eof_error_length
    io = StringIO.new('')
    def io.gets(*arg)
      @buf ||= ["HTTP/1.0 200 OK\n", "content-length: 123\n", "\n"]
      @buf.shift
    end
    def io.readpartial(size, buf)
      @second ||= false
      if !@second
        @second = '1st'
        buf << "abc"
        buf
      elsif @second == '1st'
        @second = '2nd'
        raise EOFError.new
      else
        raise Exception.new
      end
    end
    def io.eof?
      true
    end
    @client.test_loopback_http_response << io
    assert_nothing_raised do
      @client.get('http://foo/bar')
    end
  end

  def test_eof_error_rest
    io = StringIO.new('')
    def io.gets(*arg)
      @buf ||= ["HTTP/1.0 200 OK\n", "\n"]
      @buf.shift
    end
    def io.readpartial(size, buf)
      @second ||= false
      if !@second
        @second = '1st'
        buf << "abc"
        buf
      elsif @second == '1st'
        @second = '2nd'
        raise EOFError.new
      else
        raise Exception.new
      end
    end
    def io.eof?
      true
    end
    @client.test_loopback_http_response << io
    assert_nothing_raised do
      @client.get('http://foo/bar')
    end
  end

  def test_urify
    extend HTTPClient::Util
    assert_nil(urify(nil))
    uri = 'http://foo'
    assert_equal(urify(uri), urify(uri))
    assert_equal(urify(uri), urify(urify(uri)))
  end

  def test_connection
    c = HTTPClient::Connection.new
    assert(c.finished?)
    assert_nil(c.join)
  end

  def test_site
    site = HTTPClient::Site.new
    assert_equal('tcp', site.scheme)
    assert_equal('0.0.0.0', site.host)
    assert_equal(0, site.port)
    assert_equal('tcp://0.0.0.0:0', site.addr)
    assert_equal('tcp://0.0.0.0:0', site.to_s)
    assert_nothing_raised do
      site.inspect
    end
    #
    site = HTTPClient::Site.new(urify('http://localhost:12345/foo'))
    assert_equal('http', site.scheme)
    assert_equal('localhost', site.host)
    assert_equal(12345, site.port)
    assert_equal('http://localhost:12345', site.addr)
    assert_equal('http://localhost:12345', site.to_s)
    assert_nothing_raised do
      site.inspect
    end
    #
    site1 = HTTPClient::Site.new(urify('http://localhost:12341/'))
    site2 = HTTPClient::Site.new(urify('http://localhost:12342/'))
    site3 = HTTPClient::Site.new(urify('http://localhost:12342/'))
    assert(!(site1 == site2))
    h = { site1 => 'site1', site2 => 'site2' }
    h[site3] = 'site3'
    assert_equal('site1', h[site1])
    assert_equal('site3', h[site2])
  end

  def test_http_header
    res = @client.get(serverurl + 'hello')
    assert_equal('text/html', res.contenttype)
    assert_equal(5, res.header.get(nil).size)
    #
    res.header.delete('connection')
    assert_equal(4, res.header.get(nil).size)
    #
    res.header['foo'] = 'bar'
    assert_equal(['bar'], res.header['foo'])
    #
    assert_equal([['foo', 'bar']], res.header.get('foo'))
    res.header['foo'] = ['bar', 'bar2']
    assert_equal([['foo', 'bar'], ['foo', 'bar2']], res.header.get('foo'))
  end

  def test_mime_type
    assert_equal('text/plain', HTTP::Message.mime_type('foo.txt'))
    assert_equal('text/html', HTTP::Message.mime_type('foo.html'))
    assert_equal('text/html', HTTP::Message.mime_type('foo.htm'))
    assert_equal('text/xml', HTTP::Message.mime_type('foo.xml'))
    assert_equal('application/msword', HTTP::Message.mime_type('foo.doc'))
    assert_equal('image/png', HTTP::Message.mime_type('foo.png'))
    assert_equal('image/gif', HTTP::Message.mime_type('foo.gif'))
    assert_equal('image/jpeg', HTTP::Message.mime_type('foo.jpg'))
    assert_equal('image/jpeg', HTTP::Message.mime_type('foo.jpeg'))
    assert_equal('application/octet-stream', HTTP::Message.mime_type('foo.unknown'))
    #
    handler = lambda { |path| 'hello/world' }
    assert_nil(HTTP::Message.mime_type_handler)
    assert_nil(HTTP::Message.get_mime_type_func)
    HTTP::Message.mime_type_handler = handler
    assert_not_nil(HTTP::Message.mime_type_handler)
    assert_not_nil(HTTP::Message.get_mime_type_func)
    assert_equal('hello/world', HTTP::Message.mime_type('foo.txt'))
    HTTP::Message.mime_type_handler = nil
    assert_equal('text/plain', HTTP::Message.mime_type('foo.txt'))
    HTTP::Message.set_mime_type_func(nil)
    assert_equal('text/plain', HTTP::Message.mime_type('foo.txt'))
    #
    handler = lambda { |path| nil }
    HTTP::Message.mime_type_handler = handler
    assert_equal('application/octet-stream', HTTP::Message.mime_type('foo.txt'))
  end

  def test_connect_request
    req = HTTP::Message.new_connect_request(urify('https://foo/bar'))
    assert_equal("CONNECT foo:443 HTTP/1.0\r\n\r\n", req.dump)
    req = HTTP::Message.new_connect_request(urify('https://example.com/'))
    assert_equal("CONNECT example.com:443 HTTP/1.0\r\n\r\n", req.dump)
  end

  def test_response
    res = HTTP::Message.new_response('response')
    res.contenttype = 'text/plain'
    res.header.body_date = Time.at(946652400)
    assert_equal(
      [
        "",
        "Content-Length: 8",
        "Content-Type: text/plain",
        "Last-Modified: Fri, 31 Dec 1999 15:00:00 GMT",
        "Status: 200 OK",
        "response"
      ],
      res.dump.split(/\r\n/).sort
    )
    assert_equal(['8'], res.header['Content-Length'])
    assert_equal('8', res.headers['Content-Length'])
    res.header.set('foo', 'bar')
    assert_equal(
      [
        "",
        "Content-Length: 8",
        "Content-Type: text/plain",
        "Last-Modified: Fri, 31 Dec 1999 15:00:00 GMT",
        "Status: 200 OK",
        "foo: bar",
        "response"
      ],
      res.dump.split(/\r\n/).sort
    )
    # nil body
    res = HTTP::Message.new_response(nil)
    assert_equal(
      [
        "Content-Length: 0",
        "Content-Type: text/html; charset=us-ascii",
        "Status: 200 OK"
      ],
      res.dump.split(/\r\n/).sort
    )
    # for mod_ruby env
    Object.const_set('Apache', nil)
    begin
      res = HTTP::Message.new_response('response')
      assert(res.dump.split(/\r\n/).any? { |line| /^Date/ =~ line })
      #
      res = HTTP::Message.new_response('response')
      res.contenttype = 'text/plain'
      res.header.body_date = Time.at(946652400)
      res.header['Date'] = Time.at(946652400).httpdate
      assert_equal(
        [
          "",
          "Content-Length: 8",
          "Content-Type: text/plain",
          "Date: Fri, 31 Dec 1999 15:00:00 GMT",
          "HTTP/1.1 200 OK",
          "Last-Modified: Fri, 31 Dec 1999 15:00:00 GMT",
          "response"
        ],
        res.dump.split(/\r\n/).sort
      )
    ensure
      Object.instance_eval { remove_const('Apache') }
    end
  end

  def test_response_cookies
    res = HTTP::Message.new_response('response')
    res.contenttype = 'text/plain'
    res.header.body_date = Time.at(946652400)
    res.header.request_uri = 'http://www.example.com/'
    assert_nil(res.cookies)
    #
    res.header['Set-Cookie'] = [
      'CUSTOMER=WILE_E_COYOTE; path=/; expires=Wednesday, 09-Nov-99 23:12:40 GMT',
      'PART_NUMBER=ROCKET_LAUNCHER_0001; path=/'
    ]
    assert_equal(
      [
        "",
        "Content-Length: 8",
        "Content-Type: text/plain",
        "Last-Modified: Fri, 31 Dec 1999 15:00:00 GMT",
        "Set-Cookie: CUSTOMER=WILE_E_COYOTE; path=/; expires=Wednesday, 09-Nov-99 23:12:40 GMT",
        "Set-Cookie: PART_NUMBER=ROCKET_LAUNCHER_0001; path=/",
        "Status: 200 OK",
        "response"
      ],
      res.dump.split(/\r\n/).sort
    )
    assert_equal(2, res.cookies.size)
    assert_equal('CUSTOMER', res.cookies[0].name)
    assert_equal('PART_NUMBER', res.cookies[1].name)
  end

  def test_ok_response_success
    res = HTTP::Message.new_response('response')
    assert_equal(true, res.ok?)
    res.status = 404
    assert_equal(false, res.ok?)
    res.status = 500
    assert_equal(false, res.ok?)
    res.status = 302
    assert_equal(false, res.ok?)
  end

  if !defined?(JRUBY_VERSION) and RUBY_VERSION < '1.9'
    def test_timeout_scheduler
      assert_equal('hello', @client.get_content(serverurl + 'hello'))
      status =  HTTPClient.timeout_scheduler.instance_eval { @thread.kill; @thread.join; @thread.status }
      assert(!status) # dead
      assert_equal('hello', @client.get_content(serverurl + 'hello'))
    end
  end

  def test_session_manager
    mgr = HTTPClient::SessionManager.new(@client)
    assert_nil(mgr.instance_eval { @proxy })
    assert_nil(mgr.debug_dev)
    @client.debug_dev = Object.new
    @client.proxy = 'http://myproxy:12345'
    mgr = HTTPClient::SessionManager.new(@client)
    assert_equal('http://myproxy:12345', mgr.instance_eval { @proxy }.to_s)
    assert_equal(@client.debug_dev, mgr.debug_dev)
  end

  def create_keepalive_disconnected_thread(idx, sock)
    Thread.new {
      # return "12345" for the first connection
      sock.gets
      sock.gets
      sock.write("HTTP/1.1 200 OK\r\n")
      sock.write("Content-Length: 5\r\n")
      sock.write("\r\n")
      sock.write("12345")
      # for the next connection, close while reading the request for emulating
      # KeepAliveDisconnected
      sock.gets
      sock.close
    }
  end

  def test_keepalive_disconnected
    client = HTTPClient.new
    server = TCPServer.open('127.0.0.1', 0)
    server.listen(30) # set enough backlogs
    endpoint = "http://127.0.0.1:#{server.addr[1]}/"
    queue = Queue.new
    Thread.new(queue) { |qs|
      Thread.abort_on_exception = true
      # want 5 requests issued
      5.times { qs.pop }
      # emulate 10 keep-alive connections
      10.times do |idx|
        sock = server.accept
        create_keepalive_disconnected_thread(idx, sock)
      end
      # return "23456" for the request which gets KeepAliveDisconnected
      5.times do
        sock = server.accept
        sock.gets
        sock.gets
        sock.write("HTTP/1.1 200 OK\r\n")
        sock.write("\r\n")
        sock.write("23456")
        sock.close
      end
      # return "34567" for the rest requests
      while true
        sock = server.accept
        sock.gets
        sock.gets
        sock.write("HTTP/1.1 200 OK\r\n")
        sock.write("Connection: close\r\n")
        sock.write("Content-Length: 5\r\n")
        sock.write("\r\n")
        sock.write("34567")
        sock.close
      end
    }
    # try to allocate 10 keep-alive connections; it's a race so some
    # threads can reuse the connection so actual number of keep-alive
    # connections should be smaller than 10.
    (0...10).to_a.map {
      Thread.new(queue) { |qc|
        Thread.abort_on_exception = true
        conn = client.get_async(endpoint)
        qc.push(true)
        assert_equal("12345", conn.pop.content.read)
      }
    }.each { |th| th.join }
    # send 5 requests, some of these should get KeepAliveDesconnected
    # but should retry with new connection.
    (0...5).to_a.map {
      Thread.new {
        Thread.abort_on_exception = true
        assert_equal("23456", client.get(endpoint).content)
      }
    }.each { |th| th.join }
    # rest requests won't get KeepAliveDisconnected
    (0...10).to_a.map {
      Thread.new {
        Thread.abort_on_exception = true
        assert_equal("34567", client.get(endpoint).content)
      }
    }.each { |th| th.join }
  end

  def create_keepalive_thread(count, sock)
    Thread.new {
      Thread.abort_on_exception = true
      count.times do
        req = sock.gets
        while line = sock.gets
          break if line.chomp.empty?
        end
        case req
        when /chunked/
          sock.write("HTTP/1.1 200 OK\r\n")
          sock.write("Transfer-Encoding: chunked\r\n")
          sock.write("\r\n")
          sock.write("1a\r\n")
          sock.write("abcdefghijklmnopqrstuvwxyz\r\n")
          sock.write("10\r\n")
          sock.write("1234567890abcdef\r\n")
          sock.write("0\r\n")
          sock.write("\r\n")
        else
          sock.write("HTTP/1.1 200 OK\r\n")
          sock.write("Content-Length: 5\r\n")
          sock.write("\r\n")
          sock.write("12345")
        end
      end
      sock.close
    }
  end

  def test_keepalive
    server = TCPServer.open('localhost', 0)
    server_thread = Thread.new {
      Thread.abort_on_exception = true
      sock = server.accept
      create_keepalive_thread(10, sock)
    }
    url = "http://localhost:#{server.addr[1]}/"
    begin
      # content-length
      5.times do
        assert_equal('12345', @client.get(url).body)
      end
      # chunked
      5.times do
        assert_equal('abcdefghijklmnopqrstuvwxyz1234567890abcdef', @client.get(url + 'chunked').body)
      end
    ensure
      server.close
      server_thread.join
    end
  end

  def test_strict_response_size_check
    @client.strict_response_size_check = false
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\nContent-Length: 12345\r\n\r\nhello world"
    assert_equal('hello world', @client.get_content('http://dummy'))

    @client.reset_all
    @client.strict_response_size_check = true
    @client.test_loopback_http_response << "HTTP/1.0 200 OK\r\nContent-Length: 12345\r\n\r\nhello world"
    assert_raise(HTTPClient::BadResponseError) do
      @client.get_content('http://dummy')
    end
  end

  def test_socket_local
    @client.socket_local.host = '127.0.0.1'
    assert_equal('hello', @client.get_content(serverurl + 'hello'))
    @client.reset_all
    @client.socket_local.port = serverport
    begin
      @client.get_content(serverurl + 'hello')
    rescue Errno::EADDRINUSE, SocketError
      assert(true)
    end
  end

  def test_body_param_order
    ary = ('b'..'d').map { |k| ['key2', k] } << ['key1', 'a'] << ['key3', 'z']
    assert_equal("key2=b&key2=c&key2=d&key1=a&key3=z", HTTP::Message.escape_query(ary))
  end

  if RUBY_VERSION > "1.9"
    def test_charset
      body = @client.get(serverurl + 'charset').body
      assert_equal(Encoding::EUC_JP, body.encoding)
      assert_equal('あいうえお'.encode(Encoding::EUC_JP), body)
    end
  end

  if RUBY_VERSION >= "1.9.3"
    def test_continue
      @client.debug_dev = str = ''
      res = @client.get(serverurl + 'continue', :header => {:Expect => '100-continue'})
      assert_equal(200, res.status)
      assert_equal('done!', res.body)
      assert_match(/Expect: 100-continue/, str)
    end
  end

  def test_ipv6literaladdress_in_uri
    server = TCPServer.open('::1', 0) rescue return # Skip if IPv6 is unavailable.
    server_thread = Thread.new {
      Thread.abort_on_exception = true
      sock = server.accept
      while line = sock.gets
        break if line.chomp.empty?
      end
      sock.write("HTTP/1.1 200 OK\r\n")
      sock.write("Content-Length: 5\r\n")
      sock.write("\r\n")
      sock.write("12345")
      sock.close
    }
    uri = "http://[::1]:#{server.addr[1]}/"
    begin
      assert_equal('12345', @client.get(uri).body)
    ensure
      server.close
      server_thread.kill
      server_thread.join
    end
  end

  def test_uri_no_schema
    assert_raise(ArgumentError) do
      @client.get_content("www.example.com")
    end
  end

  def test_tcp_keepalive
    @client.tcp_keepalive = true
    @client.get(serverurl)

    # expecting HTTP keepalive caches the socket
    session = @client.instance_variable_get(:@session_manager).send(:get_cached_session, HTTPClient::Site.new(URI.parse(serverurl)))
    socket = session.instance_variable_get(:@socket)

    assert_true(session.tcp_keepalive)
    assert_equal(Socket::SO_KEEPALIVE, socket.getsockopt(Socket::SOL_SOCKET, Socket::SO_KEEPALIVE).optname)
  end

private

  def check_query_get(query)
    WEBrick::HTTPUtils.parse_query(
      @client.get(serverurl + 'servlet', query).header["x-query"][0]
    )
  end

  def check_query_post(query)
    WEBrick::HTTPUtils.parse_query(
      @client.post(serverurl + 'servlet', query).header["x-query"][0]
    )
  end

  def setup_server
    @server = WEBrick::HTTPServer.new(
      :BindAddress => "localhost",
      :Logger => @logger,
      :Port => 0,
      :AccessLog => [],
      :DocumentRoot => File.dirname(File.expand_path(__FILE__))
    )
    @serverport = @server.config[:Port]
    [
      :hello, :sleep, :servlet_redirect, :redirect1, :redirect2, :redirect3,
      :redirect_self, :relative_redirect, :redirect_see_other, :chunked,
      :largebody, :status, :compressed, :charset, :continue
    ].each do |sym|
      @server.mount(
        "/#{sym}",
        WEBrick::HTTPServlet::ProcHandler.new(method("do_#{sym}").to_proc)
      )
    end
    @server.mount('/servlet', TestServlet.new(@server))
    @server_thread = start_server_thread(@server)
  end

  def add_query_string(req)
    if req.query_string
      '?' + req.query_string
    else
      ''
    end
  end

  def do_hello(req, res)
    res['content-type'] = 'text/html'
    res.body = "hello" + add_query_string(req)
  end

  def do_sleep(req, res)
    sec = req.query['sec'].to_i
    sleep sec
    res['content-type'] = 'text/html'
    res.body = "hello" + add_query_string(req)
  end

  def do_servlet_redirect(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, serverurl + "servlet" + add_query_string(req))
  end

  def do_redirect1(req, res)
    res.set_redirect(WEBrick::HTTPStatus::MovedPermanently, serverurl + "hello" + add_query_string(req))
  end

  def do_redirect2(req, res)
    res.set_redirect(WEBrick::HTTPStatus::TemporaryRedirect, serverurl + "redirect3" + add_query_string(req))
  end

  def do_redirect3(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, serverurl + "hello" + add_query_string(req))
  end

  def do_redirect_self(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, serverurl + "redirect_self" + add_query_string(req))
  end

  def do_relative_redirect(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, "hello" + add_query_string(req))
  end

  def do_redirect_see_other(req, res)
    if req.request_method == 'POST'
      res.set_redirect(WEBrick::HTTPStatus::SeeOther, serverurl + "redirect_see_other" + add_query_string(req)) # self
    else
      res.body = 'hello'
    end
  end

  def do_chunked(req, res)
    res.chunked = true
    res['content-type'] = 'text/plain; charset=UTF-8'
    piper, pipew = IO.pipe
    res.body = piper
    pipew << req.query['msg']
    pipew.close
  end

  def do_largebody(req, res)
    res['content-type'] = 'text/html'
    res.body = "a" * 1000 * 1000
  end

  def do_compressed(req, res)
    res['content-type'] = 'application/octet-stream'
    if req.query['enc'] == 'gzip'
      res['content-encoding'] = 'gzip'
      res.body = GZIP_CONTENT
    elsif req.query['enc'] == 'deflate'
      res['content-encoding'] = 'deflate'
      res.body = DEFLATE_CONTENT
    elsif req.query['enc'] == 'deflate_noheader'
      res['content-encoding'] = 'deflate'
      res.body = DEFLATE_NOHEADER_CONTENT
    end
  end

  def do_charset(req, res)
    if RUBY_VERSION > "1.9"
      res.body = 'あいうえお'.encode("euc-jp")
      res['Content-Type'] = 'text/plain; charset=euc-jp'
    else
      res.body = 'this endpoint is for 1.9 or later'
    end
  end

  def do_status(req, res)
    res.status = req.query['status'].to_i
  end

  def do_continue(req, res)
    req.continue
    res.body = 'done!'
  end

  class TestServlet < WEBrick::HTTPServlet::AbstractServlet
    def get_instance(*arg)
      self
    end

    def do_HEAD(req, res)
      res["x-head"] = 'head'    # use this for test purpose only.
      res["x-query"] = query_response(req)
    end

    def do_GET(req, res)
      res.body = 'get'
      res['x-header'] = req['X-Header']
      res["x-query"] = query_response(req)
    end

    def do_POST(req, res)
      res["content-type"] = "text/plain" # iso-8859-1, not US-ASCII
      res.body = 'post,' + req.body.to_s
      res["x-query"] = body_response(req)
      res["x-request-query"] = req.query_string
    end

    def do_PATCH(req, res)
      res["x-query"] = body_response(req)
      param = WEBrick::HTTPUtils.parse_query(req.body) || {}
      res["x-size"] = (param['txt'] || '').size
      res.body = param['txt'] || 'patch'
      res["x-request-query"] = req.query_string
    end

    def do_PUT(req, res)
      res["x-query"] = body_response(req)
      param = WEBrick::HTTPUtils.parse_query(req.body) || {}
      res["x-size"] = (param['txt'] || '').size
      res.body = param['txt'] || 'put'
      res["x-request-query"] = req.query_string
    end

    def do_DELETE(req, res)
      res.body = 'delete'
      res["x-query"] = body_response(req)
      res["x-request-query"] = req.query_string
    end

    def do_OPTIONS(req, res)
      res.body = 'options'
      res['x-header'] = req['X-Header']
      res['x-body'] = req.body
    end

    def do_PROPFIND(req, res)
      res.body = 'propfind'
    end

    def do_PROPPATCH(req, res)
      res.body = 'proppatch'
      res["x-query"] = body_response(req)
    end

    def do_TRACE(req, res)
      # client SHOULD reflect the message received back to the client as the
      # entity-body of a 200 (OK) response. [RFC2616]
      res.body = 'trace'
      res["x-query"] = query_response(req)
    end

  private

    def query_response(req)
      query_escape(WEBrick::HTTPUtils.parse_query(req.query_string))
    end

    def body_response(req)
      query_escape(WEBrick::HTTPUtils.parse_query(req.body))
    end

    def query_escape(query)
      escaped = []
      query.sort_by { |k, v| k }.collect do |k, v|
        v.to_ary.each do |ve|
          escaped << CGI.escape(k) + '=' + CGI.escape(ve)
        end
      end
      escaped.join('&')
    end
  end
end
