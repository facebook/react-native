require File.expand_path('helper', File.dirname(__FILE__))
require 'digest/md5'
require 'rack'
require 'rack/lint'
require 'rack-ntlm'

class TestAuth < Test::Unit::TestCase
  include Helper

  def setup
    super
    setup_server
  end

  def teardown
    super
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
    @server.mount(
      '/basic_auth',
      WEBrick::HTTPServlet::ProcHandler.new(method(:do_basic_auth).to_proc)
    )
    @server.mount(
      '/digest_auth',
      WEBrick::HTTPServlet::ProcHandler.new(method(:do_digest_auth).to_proc)
    )
    @server.mount(
      '/digest_sess_auth',
      WEBrick::HTTPServlet::ProcHandler.new(method(:do_digest_sess_auth).to_proc)
    )
    # NTLM endpoint
    ntlm_handler = Rack::Handler::WEBrick.new(@server,
      Rack::Builder.app do
        use Rack::ShowExceptions
        use Rack::ContentLength
        use Rack::Ntlm, {:uri_pattern => /.*/, :auth => {:username => "admin", :password => "admin"}}
        run lambda { |env| [200, { 'Content-Type' => 'text/html' }, ['ntlm_auth OK']] }
      end
    )
    @server.mount(
      '/ntlm_auth',
      WEBrick::HTTPServlet::ProcHandler.new(Proc.new do |req, res|
        ntlm_handler.service(req, res)
      end)
    )
    # Htpasswd
    htpasswd = File.join(File.dirname(__FILE__), 'htpasswd')
    htpasswd_userdb = WEBrick::HTTPAuth::Htpasswd.new(htpasswd)
    htdigest = File.join(File.dirname(__FILE__), 'htdigest')
    htdigest_userdb = WEBrick::HTTPAuth::Htdigest.new(htdigest)
    @basic_auth = WEBrick::HTTPAuth::BasicAuth.new(
      :Logger => @logger,
      :Realm => 'auth',
      :UserDB => htpasswd_userdb
    )
    @digest_auth = WEBrick::HTTPAuth::DigestAuth.new(
      :Logger => @logger,
      :Algorithm => 'MD5',
      :Realm => 'auth',
      :UserDB => htdigest_userdb
    )
    @digest_sess_auth = WEBrick::HTTPAuth::DigestAuth.new(
      :Logger => @logger,
      :Algorithm => 'MD5-sess',
      :Realm => 'auth',
      :UserDB => htdigest_userdb
    )
    @server_thread = start_server_thread(@server)

    @proxy_digest_auth = WEBrick::HTTPAuth::ProxyDigestAuth.new(
      :Logger => @proxylogger,
      :Algorithm => 'MD5',
      :Realm => 'auth',
      :UserDB => htdigest_userdb
    )

    @proxyserver = WEBrick::HTTPProxyServer.new(
      :ProxyAuthProc => @proxy_digest_auth.method(:authenticate).to_proc,
      :BindAddress => "localhost",
      :Logger => @proxylogger,
      :Port => 0,
      :AccessLog => []
    )
    @proxyport = @proxyserver.config[:Port]
    @proxyserver_thread = start_server_thread(@proxyserver)
  end

  def do_basic_auth(req, res)
    @basic_auth.authenticate(req, res)
    res['content-type'] = 'text/plain'
    res.body = 'basic_auth OK'
  end

  def do_digest_auth(req, res)
    @digest_auth.authenticate(req, res)
    res['content-type'] = 'text/plain'
    res['x-query'] = req.body
    res.body = 'digest_auth OK' + req.query_string.to_s
  end

  def do_digest_sess_auth(req, res)
    @digest_sess_auth.authenticate(req, res)
    res['content-type'] = 'text/plain'
    res['x-query'] = req.body
    res.body = 'digest_sess_auth OK' + req.query_string.to_s
  end

  # TODO: monkey patching for rack-ntlm-test-services's incompat.
  module ::Net
    module NTLM
      # ruby-ntlm 0.3.0 -> 0.4.0
      def self.decode_utf16le(*arg)
        EncodeUtil.decode_utf16le(*arg)
      end
      # Make it work if @value == nil
      class SecurityBuffer < FieldSet
        remove_method(:data_size) if method_defined?(:data_size)
        def data_size
          @active && @value ? @value.size : 0
        end
      end
    end
  end
  def test_ntlm_auth
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/ntlm_auth", 'admin', 'admin')
    assert_equal('ntlm_auth OK', c.get_content("http://localhost:#{serverport}/ntlm_auth"))
  end

  def test_basic_auth
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('basic_auth OK', c.get_content("http://localhost:#{serverport}/basic_auth"))
  end

  def test_basic_auth_compat
    c = HTTPClient.new
    c.set_basic_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('basic_auth OK', c.get_content("http://localhost:#{serverport}/basic_auth"))
  end

  def test_BASIC_auth
    c = HTTPClient.new
    webrick_backup = @basic_auth.instance_eval { @auth_scheme }
    begin
      # WEBrick in ruby 1.8.7 uses 'BASIC' instead of 'Basic'
      @basic_auth.instance_eval { @auth_scheme = "BASIC" }
      c.www_auth.basic_auth.instance_eval { @scheme = "BASIC" }
      #
      c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
      res = c.get("http://localhost:#{serverport}/basic_auth")
      assert_equal('basic_auth OK', res.content)
      assert_equal(200, res.status)
      assert_equal(401, res.previous.status)
      assert_equal(nil, res.previous.previous)
    ensure
      @basic_auth.instance_eval { @auth_scheme = webrick_backup }
    end
  end

  def test_BASIC_auth_force
    c = HTTPClient.new
    webrick_backup = @basic_auth.instance_eval { @auth_scheme }
    begin
      # WEBrick in ruby 1.8.7 uses 'BASIC' instead of 'Basic'
      @basic_auth.instance_eval { @auth_scheme = "BASIC" }
      c.www_auth.basic_auth.instance_eval { @scheme = "BASIC" }
      #
      c.force_basic_auth = true
      c.debug_dev = str = ''
      c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
      assert_equal('basic_auth OK', c.get_content("http://localhost:#{serverport}/basic_auth"))
      assert_equal('Authorization: Basic YWRtaW46YWRtaW4='.upcase, str.split(/\r?\n/)[5].upcase)
    ensure
      @basic_auth.instance_eval { @auth_scheme = webrick_backup }
    end
  end

  def test_BASIC_auth_async
    # async methods don't issure retry call so for successful authentication you need to set force_basic_auth flag
    c = HTTPClient.new(:force_basic_auth => true)
    webrick_backup = @basic_auth.instance_eval { @auth_scheme }
    begin
      # WEBrick in ruby 1.8.7 uses 'BASIC' instead of 'Basic'
      @basic_auth.instance_eval { @auth_scheme = "BASIC" }
      c.www_auth.basic_auth.instance_eval { @scheme = "BASIC" }
      #
      c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
      conn = c.get_async("http://localhost:#{serverport}/basic_auth")
      assert_equal('basic_auth OK', conn.pop.body.read)
    ensure
      @basic_auth.instance_eval { @auth_scheme = webrick_backup }
    end
  end

  def test_BASIC_auth_nil_uri
    c = HTTPClient.new
    webrick_backup = @basic_auth.instance_eval { @auth_scheme }
    begin
      @basic_auth.instance_eval { @auth_scheme = "BASIC" }
      c.www_auth.basic_auth.instance_eval { @scheme = "BASIC" }
      c.set_auth(nil, 'admin', 'admin')
      assert_equal('basic_auth OK', c.get_content("http://localhost:#{serverport}/basic_auth"))
    ensure
      @basic_auth.instance_eval { @auth_scheme = webrick_backup }
    end
  end

  # To work this test consistently on CRuby you can to add 'Thread.pass' in
  # @challenge iteration at BasicAuth#get like;
  #
  # return nil unless @challenge.find { |uri, ok|
  #   Thread.pass
  #   Util.uri_part_of(target_uri, uri) and ok
  # }
  def test_BASIC_auth_multi_thread
    c = HTTPClient.new
    webrick_backup = @basic_auth.instance_eval { @auth_scheme }
    begin
      @basic_auth.instance_eval { @auth_scheme = "BASIC" }
      c.www_auth.basic_auth.instance_eval { @scheme = "BASIC" }
      c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')

      100.times.map { |idx|
        Thread.new(idx) { |idx2|
          Thread.abort_on_exception = true
          Thread.pass
          c.get("http://localhost:#{serverport}/basic_auth?#{idx2}")
        }
      }.map { |t|
        t.join
      }
    ensure
      @basic_auth.instance_eval { @auth_scheme = webrick_backup }
    end
  end

  def test_basic_auth_reuses_credentials
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('basic_auth OK', c.get_content("http://localhost:#{serverport}/basic_auth/"))
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content("http://localhost:#{serverport}/basic_auth/sub/dir/")
    assert_match(/Authorization: Basic YWRtaW46YWRtaW4=/, str)
  end

  def test_digest_auth
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('digest_auth OK', c.get_content("http://localhost:#{serverport}/digest_auth"))
  end

  def test_digest_auth_reuses_credentials
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('digest_auth OK', c.get_content("http://localhost:#{serverport}/digest_auth/"))
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content("http://localhost:#{serverport}/digest_auth/sub/dir/")
    assert_match(/Authorization: Digest/, str)
  end

  def test_digest_auth_with_block
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    called = false
    c.get_content("http://localhost:#{serverport}/digest_auth") do |str|
      assert_equal('digest_auth OK', str)
      called = true
    end
    assert(called)
    #
    called = false
    c.get("http://localhost:#{serverport}/digest_auth") do |str|
      assert_equal('digest_auth OK', str)
      called = true
    end
    assert(called)
  end

  def test_digest_auth_with_post_io
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    post_body = StringIO.new("1234567890")
    assert_equal('1234567890', c.post("http://localhost:#{serverport}/digest_auth", post_body).header['x-query'][0])
    #
    post_body = StringIO.new("1234567890")
    post_body.read(5)
    assert_equal('67890', c.post("http://localhost:#{serverport}/digest_auth", post_body).header['x-query'][0])
  end

  def test_digest_auth_with_querystring
    c = HTTPClient.new
    c.debug_dev = STDERR if $DEBUG
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('digest_auth OKbar=baz', c.get_content("http://localhost:#{serverport}/digest_auth/foo?bar=baz"))
  end

  def test_perfer_digest
    c = HTTPClient.new
    c.set_auth('http://example.com/', 'admin', 'admin')
    c.test_loopback_http_response << "HTTP/1.0 401 Unauthorized\nWWW-Authenticate: Basic realm=\"foo\"\nWWW-Authenticate: Digest realm=\"foo\", nonce=\"nonce\", stale=false\nContent-Length: 2\n\nNG"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content('http://example.com/')
    assert_match(/^Authorization: Digest/, str)
  end

  def test_digest_sess_auth
    c = HTTPClient.new
    c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
    assert_equal('digest_sess_auth OK', c.get_content("http://localhost:#{serverport}/digest_sess_auth"))
  end

  def test_proxy_auth
    c = HTTPClient.new
    c.set_proxy_auth('admin', 'admin')
    c.test_loopback_http_response << "HTTP/1.0 407 Unauthorized\nProxy-Authenticate: Basic realm=\"foo\"\nContent-Length: 2\n\nNG"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content('http://example.com/')
    assert_match(/Proxy-Authorization: Basic YWRtaW46YWRtaW4=/, str)
  end

  def test_proxy_auth_force
    c = HTTPClient.new
    c.set_proxy_auth('admin', 'admin')
    c.force_basic_auth = true
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content('http://example.com/')
    assert_match(/Proxy-Authorization: Basic YWRtaW46YWRtaW4=/, str)
  end

  def test_proxy_auth_reuses_credentials
    c = HTTPClient.new
    c.set_proxy_auth('admin', 'admin')
    c.test_loopback_http_response << "HTTP/1.0 407 Unauthorized\nProxy-Authenticate: Basic realm=\"foo\"\nContent-Length: 2\n\nNG"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.get_content('http://www1.example.com/')
    c.debug_dev = str = ''
    c.get_content('http://www2.example.com/')
    assert_match(/Proxy-Authorization: Basic YWRtaW46YWRtaW4=/, str)
  end

  def test_digest_proxy_auth_loop
    c = HTTPClient.new
    c.set_proxy_auth('admin', 'admin')
    c.test_loopback_http_response << "HTTP/1.0 407 Unauthorized\nProxy-Authenticate: Digest realm=\"foo\", nonce=\"nonce\", stale=false\nContent-Length: 2\n\nNG"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    md5 = Digest::MD5.new
    ha1 = md5.hexdigest("admin:foo:admin")
    ha2 = md5.hexdigest("GET:/")
    response = md5.hexdigest("#{ha1}:nonce:#{ha2}")
    c.debug_dev = str = ''
    c.get_content('http://example.com/')
    assert_match(/Proxy-Authorization: Digest/, str)
    assert_match(%r"response=\"#{response}\"", str)
  end

  def test_digest_proxy_auth
    c=HTTPClient.new("http://localhost:#{proxyport}/")
    c.set_proxy_auth('admin', 'admin')
    c.set_auth("http://127.0.0.1:#{serverport}/", 'admin', 'admin')
    assert_equal('basic_auth OK', c.get_content("http://127.0.0.1:#{serverport}/basic_auth"))
  end

  def test_digest_proxy_invalid_auth
    c=HTTPClient.new("http://localhost:#{proxyport}/")
    c.set_proxy_auth('admin', 'wrong')
    c.set_auth("http://127.0.0.1:#{serverport}/", 'admin', 'admin')
    assert_raises(HTTPClient::BadResponseError) do
      c.get_content("http://127.0.0.1:#{serverport}/basic_auth")
    end
  end

  def test_prefer_digest_to_basic_proxy_auth
    c = HTTPClient.new
    c.set_proxy_auth('admin', 'admin')
    c.test_loopback_http_response << "HTTP/1.0 407 Unauthorized\nProxy-Authenticate: Digest realm=\"foo\", nonce=\"nonce\", stale=false\nProxy-Authenticate: Basic realm=\"bar\"\nContent-Length: 2\n\nNG"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    md5 = Digest::MD5.new
    ha1 = md5.hexdigest("admin:foo:admin")
    ha2 = md5.hexdigest("GET:/")
    response = md5.hexdigest("#{ha1}:nonce:#{ha2}")
    c.debug_dev = str = ''
    c.get_content('http://example.com/')
    assert_match(/Proxy-Authorization: Digest/, str)
    assert_match(%r"response=\"#{response}\"", str)
  end

  def test_digest_proxy_auth_reuses_credentials
    c = HTTPClient.new
    c.set_proxy_auth('admin', 'admin')
    c.test_loopback_http_response << "HTTP/1.0 407 Unauthorized\nProxy-Authenticate: Digest realm=\"foo\", nonce=\"nonce\", stale=false\nContent-Length: 2\n\nNG"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    md5 = Digest::MD5.new
    ha1 = md5.hexdigest("admin:foo:admin")
    ha2 = md5.hexdigest("GET:/")
    response = md5.hexdigest("#{ha1}:nonce:#{ha2}")
    c.get_content('http://www1.example.com/')
    c.debug_dev = str = ''
    c.get_content('http://www2.example.com/')
    assert_match(/Proxy-Authorization: Digest/, str)
    assert_match(%r"response=\"#{response}\"", str)
  end

  def test_oauth
    c = HTTPClient.new
    config = HTTPClient::OAuth::Config.new(
      :realm => 'http://photos.example.net/',
      :consumer_key => 'dpf43f3p2l4k3l03',
      :consumer_secret => 'kd94hf93k423kf44',
      :token => 'nnch734d00sl2jdk',
      :secret => 'pfkkdhi9sl3r4s00',
      :version => '1.0',
      :signature_method => 'HMAC-SHA1'
    )
    config.debug_timestamp = '1191242096'
    config.debug_nonce = 'kllo9940pd9333jh'
    c.www_auth.oauth.set_config('http://photos.example.net/', config)
    c.www_auth.oauth.challenge('http://photos.example.net/')
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content('http://photos.example.net/photos', [[:file, 'vacation.jpg'], [:size, 'original']])
    assert(str.index(%q(GET /photos?file=vacation.jpg&size=original)))
    assert(str.index(%q(Authorization: OAuth realm="http://photos.example.net/", oauth_consumer_key="dpf43f3p2l4k3l03", oauth_nonce="kllo9940pd9333jh", oauth_signature="tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1191242096", oauth_token="nnch734d00sl2jdk", oauth_version="1.0")))
    #
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.get_content('http://photos.example.net/photos?file=vacation.jpg&size=original')
    assert(str.index(%q(GET /photos?file=vacation.jpg&size=original)))
    assert(str.index(%q(Authorization: OAuth realm="http://photos.example.net/", oauth_consumer_key="dpf43f3p2l4k3l03", oauth_nonce="kllo9940pd9333jh", oauth_signature="tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1191242096", oauth_token="nnch734d00sl2jdk", oauth_version="1.0")))
    #
    c.test_loopback_http_response << "HTTP/1.0 200 OK\nContent-Length: 2\n\nOK"
    c.debug_dev = str = ''
    c.post_content('http://photos.example.net/photos', [[:file, 'vacation.jpg'], [:size, 'original']])
    assert(str.index(%q(POST /photos)))
    assert(str.index(%q(Authorization: OAuth realm="http://photos.example.net/", oauth_consumer_key="dpf43f3p2l4k3l03", oauth_nonce="kllo9940pd9333jh", oauth_signature="wPkvxykrw%2BBTdCcGqKr%2B3I%2BPsiM%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1191242096", oauth_token="nnch734d00sl2jdk", oauth_version="1.0")))
  end

  def test_basic_auth_post_with_multipart
    retry_times = 0
    begin
      c = HTTPClient.new
      c.set_auth("http://localhost:#{serverport}/", 'admin', 'admin')
      File.open(__FILE__) do |f|
        # read 'f' twice for authorization negotiation
        assert_equal('basic_auth OK', c.post("http://localhost:#{serverport}/basic_auth", :file => f).content)
      end
    rescue Errno::ECONNRESET, HTTPClient::KeepAliveDisconnected
      # TODO: WEBrick server returns ECONNRESET/EPIPE before sending Unauthorized response to client?
      raise if retry_times > 5
      retry_times += 1
      sleep 1
      retry 
    end
  end

  def test_negotiate_and_basic
    c = HTTPClient.new
    c.test_loopback_http_response << %Q(HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: NTLM\r\nWWW-Authenticate: Basic realm="foo"\r\nConnection: Keep-Alive\r\nContent-Length: 0\r\n\r\n)
    c.test_loopback_http_response << %Q(HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: NTLM TlRMTVNTUAACAAAAAAAAACgAAAABAAAAAAAAAAAAAAA=\r\nConnection: Keep-Alive\r\nContent-Length: 0\r\n\r\n)
    c.test_loopback_http_response << %Q(HTTP/1.0 200 OK\r\nConnection: Keep-Alive\r\nContent-Length: 1\r\n\r\na)
    c.test_loopback_http_response << %Q(HTTP/1.0 200 OK\r\nConnection: Keep-Alive\r\nContent-Length: 1\r\n\r\nb)
    c.debug_dev = str = ''
    c.set_auth('http://www.example.org/', 'admin', 'admin')
    # Do NTLM negotiation
    c.get('http://www.example.org/foo')
    # BasicAuth authenticator should not respond to it because NTLM
    # negotiation has been finished.
    assert_match(%r(Authorization: NTLM), str)
    assert_not_match(%r(Authorization: Basic), str)
    # ditto for other resource that is protected with NTLM
    c.debug_dev = str = ''
    c.get('http://www.example.org/foo/subdir')
    assert_not_match(%r(Authorization: NTLM), str)
    assert_not_match(%r(Authorization: Basic), str)
  end
end
