# -*- encoding: utf-8 -*-
require 'http-access2'
require File.expand_path('helper', File.dirname(__FILE__))
require 'tempfile'


module HTTPAccess2


class TestClient < Test::Unit::TestCase
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
      @client = HTTPAccess2::Client.new(proxyurl)
      assert_equal(urify(proxyurl), @client.proxy)
      assert_equal(200, @client.head(serverurl).status)
      assert(!@proxyio.string.empty?)
    end
  end

  def test_agent_name
    @client = HTTPAccess2::Client.new(nil, "agent_name_foo")
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_match(/^User-Agent: agent_name_foo/, lines[4])
  end

  def test_from
    @client = HTTPAccess2::Client.new(nil, nil, "from_bar")
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
    assert(str.empty?)
    @client.get(serverurl)
    assert(!str.empty?)
  end

  def _test_protocol_version_http09
    @client.protocol_version = 'HTTP/0.9'
    str = ""
    @client.debug_dev = str
    @client.get(serverurl + 'hello')
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET /hello HTTP/0.9", lines[3])
    assert_equal("Connection: close", lines[5])
    assert_equal("= Response", lines[6])
    assert_match(/^hello/, lines[7])
  end

  def test_protocol_version_http10
    @client.protocol_version = 'HTTP/1.0'
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

  def test_protocol_version_http11
    str = ""
    @client.debug_dev = str
    @client.get(serverurl)
    lines = str.split(/(?:\r?\n)+/)
    assert_equal("= Request", lines[0])
    assert_equal("! CONNECTION ESTABLISHED", lines[2])
    assert_equal("GET / HTTP/1.1", lines[3])
    assert_equal("Host: localhost:#{serverport}", lines[7])
    @client.protocol_version = 'HTTP/1.1'
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
      @client.proxy = "http://foo:1234"
      assert_equal(urify("http://foo:1234"), @client.proxy)
      uri = urify("http://bar:2345")
      @client.proxy = uri
      assert_equal(uri, @client.proxy)
      #
      @proxyio.string = ""
      @client.proxy = nil
      assert_equal(200, @client.head(serverurl).status)
      assert(@proxyio.string.empty?)
      #
      @proxyio.string = ""
      @client.proxy = proxyurl
      assert_equal(200, @client.head(serverurl).status)
      assert(!@proxyio.string.empty?)
    end
  end

  def test_noproxy_for_localhost
    @proxyio.string = ""
    @client.proxy = proxyurl
    assert_equal(200, @client.head(serverurl).status)
    assert(@proxyio.string.empty?)
  end

  def test_no_proxy
    setup_proxyserver
    escape_noproxy do
      # proxy is not set.
      @client.no_proxy = 'localhost'
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

  def test_get_content
    assert_equal('hello', @client.get_content(serverurl + 'hello'))
    assert_equal('hello', @client.get_content(serverurl + 'redirect1'))
    assert_equal('hello', @client.get_content(serverurl + 'redirect2'))
    assert_raises(HTTPClient::Session::BadResponse) do
      @client.get_content(serverurl + 'notfound')
    end
    assert_raises(HTTPClient::Session::BadResponse) do
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

  def test_post_content
    assert_equal('hello', @client.post_content(serverurl + 'hello'))
    assert_equal('hello', @client.post_content(serverurl + 'redirect1'))
    assert_equal('hello', @client.post_content(serverurl + 'redirect2'))
    assert_raises(HTTPClient::Session::BadResponse) do
      @client.post_content(serverurl + 'notfound')
    end
    assert_raises(HTTPClient::Session::BadResponse) do
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

  def test_head
    assert_equal("head", @client.head(serverurl + 'servlet').header["x-head"][0])
    param = {'1'=>'2', '3'=>'4'}
    res = @client.head(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_get
    assert_equal("get", @client.get(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_post
    assert_equal("post", @client.post(serverurl + 'servlet', '').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_put
    assert_equal("put", @client.put(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_delete
    assert_equal("delete", @client.delete(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_options
    assert_equal("options", @client.options(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
  end

  def test_trace
    assert_equal("trace", @client.trace(serverurl + 'servlet').content)
    param = {'1'=>'2', '3'=>'4'}
    res = @client.get(serverurl + 'servlet', param)
    assert_equal(param, params(res.header["x-query"][0]))
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

  def test_timeout
    assert_equal(60, @client.connect_timeout)
    assert_equal(120, @client.send_timeout)
    assert_equal(60, @client.receive_timeout)
  end

  def test_connect_timeout
    # ToDo
  end

  def test_send_timeout
    # ToDo
  end

  def test_receive_timeout
    # this test takes 2 sec
    assert_equal('hello', @client.get_content(serverurl + 'sleep?sec=2'))
    @client.reset_all
    @client.receive_timeout = 1
    assert_equal('hello', @client.get_content(serverurl + 'sleep?sec=0'))
    assert_raise(HTTPClient::ReceiveTimeoutError) do
      @client.get_content(serverurl + 'sleep?sec=2')
    end
    @client.reset_all
    @client.receive_timeout = 3
    assert_equal('hello', @client.get_content(serverurl + 'sleep?sec=2'))
  end

  def test_cookies
    cookiefile = Tempfile.new('test_cookies_file')
    # from [ruby-talk:164079]
    File.open(cookiefile.path, "wb") do |f|
      f << "http://rubyforge.org//account/login.php	session_ser	LjEwMy45Ni40Ni0q%2A-fa0537de8cc31	2131676286	.rubyforge.org	/	13\n"
    end
    cm = WebAgent::CookieManager::new(cookiefile.path)
    cm.load_cookies
    assert_equal(1, cm.cookies.size)
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
    [:hello, :sleep, :redirect1, :redirect2, :redirect3, :redirect_self, :relative_redirect].each do |sym|
      @server.mount(
	"/#{sym}",
	WEBrick::HTTPServlet::ProcHandler.new(method("do_#{sym}").to_proc)
      )
    end
    @server.mount('/servlet', TestServlet.new(@server))
    @server_thread = start_server_thread(@server)
  end

  def escape_noproxy
    backup = HTTPAccess2::Client::NO_PROXY_HOSTS.dup
    HTTPAccess2::Client::NO_PROXY_HOSTS.clear
    yield
  ensure
    HTTPAccess2::Client::NO_PROXY_HOSTS.replace(backup)
  end

  def do_hello(req, res)
    res['content-type'] = 'text/html'
    res.body = "hello"
  end

  def do_sleep(req, res)
    sec = req.query['sec'].to_i
    sleep sec
    res['content-type'] = 'text/html'
    res.body = "hello"
  end

  def do_redirect1(req, res)
    res.set_redirect(WEBrick::HTTPStatus::MovedPermanently, serverurl + "hello") 
  end

  def do_redirect2(req, res)
    res.set_redirect(WEBrick::HTTPStatus::TemporaryRedirect, serverurl + "redirect3")
  end

  def do_redirect3(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, serverurl + "hello") 
  end

  def do_redirect_self(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, serverurl + "redirect_self") 
  end

  def do_relative_redirect(req, res)
    res.set_redirect(WEBrick::HTTPStatus::Found, "hello") 
  end

  class TestServlet < WEBrick::HTTPServlet::AbstractServlet
    def get_instance(*arg)
      self
    end

    def do_HEAD(req, res)
      res["x-head"] = 'head'	# use this for test purpose only.
      res["x-query"] = query_response(req)
    end

    def do_GET(req, res)
      res.body = 'get'
      res["x-query"] = query_response(req)
    end

    def do_POST(req, res)
      res.body = 'post'
      res["x-query"] = body_response(req)
    end

    def do_PUT(req, res)
      res.body = 'put'
    end

    def do_DELETE(req, res)
      res.body = 'delete'
    end

    def do_OPTIONS(req, res)
      # check RFC for legal response.
      res.body = 'options'
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
      query.collect do |k, v|
	v.to_ary.each do |ve|
	  escaped << CGI.escape(k) + '=' + CGI.escape(ve)
	end
      end
      escaped.join('&')
    end
  end
end


end
