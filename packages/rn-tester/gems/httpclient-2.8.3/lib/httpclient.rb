# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


require 'stringio'
require 'digest/sha1'

# Extra library
require 'httpclient/version'
require 'httpclient/util'
require 'httpclient/ssl_config'
require 'httpclient/connection'
require 'httpclient/session'
require 'httpclient/http'
require 'httpclient/auth'
require 'httpclient/cookie'

# :main:HTTPClient
# The HTTPClient class provides several methods for accessing Web resources
# via HTTP.
#
# HTTPClient instance is designed to be MT-safe.  You can call a HTTPClient
# instance from several threads without synchronization after setting up an
# instance.
#
#   clnt = HTTPClient.new
#   clnt.set_cookie_store('/home/nahi/cookie.dat')
#   urls.each do |url|
#     Thread.new(url) do |u|
#       p clnt.head(u).status
#     end
#   end
#
# == How to use
#
# At first, how to create your client.  See initialize for more detail.
#
# 1. Create simple client.
#
#     clnt = HTTPClient.new
#
# 2. Accessing resources through HTTP proxy.  You can use environment
#    variable 'http_proxy' or 'HTTP_PROXY' instead.
#
#     clnt = HTTPClient.new('http://myproxy:8080')
#
# === How to retrieve web resources
#
# See get and get_content.
#
# 1. Get content of specified URL.  It returns HTTP::Message object and
#    calling 'body' method of it returns a content String.
#
#     puts clnt.get('http://dev.ctor.org/').body
#
# 2. For getting content directly, use get_content.  It follows redirect
#    response and returns a String of whole result.
#
#     puts clnt.get_content('http://dev.ctor.org/')
#
# 3. You can pass :follow_redirect option to follow redirect response in get.
#
#     puts clnt.get('http://dev.ctor.org/', :follow_redirect => true)
#
# 4. Get content as chunks of String.  It yields chunks of String.
#
#     clnt.get_content('http://dev.ctor.org/') do |chunk|
#       puts chunk
#     end
#
# === Invoking other HTTP methods
#
# See head, get, post, put, delete, options, propfind, proppatch and trace.  
# It returns a HTTP::Message instance as a response.
#
# 1. Do HEAD request.
#
#     res = clnt.head(uri)
#     p res.header['Last-Modified'][0]
#
# 2. Do GET request with query.
#
#     query = { 'keyword' => 'ruby', 'lang' => 'en' }
#     res = clnt.get(uri, query)
#     p res.status
#     p res.contenttype
#     p res.header['X-Custom']
#     puts res.body
#
#    You can also use keyword argument style.
#
#     res = clnt.get(uri, :query => { :keyword => 'ruby', :lang => 'en' })
#
# === How to POST
#
# See post.
#
# 1. Do POST a form data.
#
#     body = { 'keyword' => 'ruby', 'lang' => 'en' }
#     res = clnt.post(uri, body)
#
#    Keyword argument style.
#
#     res = clnt.post(uri, :body => ...)
#
# 2. Do multipart file upload with POST.  No need to set extra header by
#    yourself from httpclient/2.1.4.
#
#     File.open('/tmp/post_data') do |file|
#       body = { 'upload' => file, 'user' => 'nahi' }
#       res = clnt.post(uri, body)
#     end
#
# 3. Do multipart with custom body.
#
#     File.open('/tmp/post_data') do |file|
#       body = [{ 'Content-Type' => 'application/atom+xml; charset=UTF-8',
#                 :content => '<entry>...</entry>' },
#               { 'Content-Type' => 'video/mp4',
#                 'Content-Transfer-Encoding' => 'binary',
#                 :content => file }]
#       res = clnt.post(uri, body)
#     end
#
# === Accessing via SSL
#
# Ruby needs to be compiled with OpenSSL.
#
# 1. Get content of specified URL via SSL.
#    Just pass an URL which starts with 'https://'.
#
#     https_url = 'https://www.rsa.com'
#     clnt.get(https_url)
#
# 2. Getting peer certificate from response.
#
#     res = clnt.get(https_url)
#     p res.peer_cert #=> returns OpenSSL::X509::Certificate
#
# 3. Configuring OpenSSL options.  See HTTPClient::SSLConfig for more details.
#
#     user_cert_file = 'cert.pem'
#     user_key_file = 'privkey.pem'
#     clnt.ssl_config.set_client_cert_file(user_cert_file, user_key_file)
#     clnt.get(https_url)
#
# 4. Revocation check. On JRuby you can set following options to let
#    HTTPClient to perform revocation check with CRL and OCSP:
#
#     -J-Dcom.sun.security.enableCRLDP=true -J-Dcom.sun.net.ssl.checkRevocation=true
#     ex. jruby -J-Dcom.sun.security.enableCRLDP=true -J-Dcom.sun.net.ssl.checkRevocation=true app.rb
#     Revoked cert example: https://test-sspev.verisign.com:2443/test-SSPEV-revoked-verisign.html
#
#    On other platform you can download CRL by yourself and set it via
#    SSLConfig#add_crl.
#
# === Handling Cookies
#
# 1. Using volatile Cookies.  Nothing to do.  HTTPClient handles Cookies.
#
#     clnt = HTTPClient.new
#     res = clnt.get(url1) # receives Cookies.
#     res = clnt.get(url2) # sends Cookies if needed.
#     p res.cookies
#
# 2. Saving non volatile Cookies to a specified file.  Need to set a file at
#    first and invoke save method at last.
#
#     clnt = HTTPClient.new
#     clnt.set_cookie_store('/home/nahi/cookie.dat')
#     clnt.get(url)
#     ...
#     clnt.save_cookie_store
#
# 3. Disabling Cookies.
#
#     clnt = HTTPClient.new
#     clnt.cookie_manager = nil
#
# === Configuring authentication credentials
#
# 1. Authentication with Web server.  Supports BasicAuth, DigestAuth, and
#    Negotiate/NTLM (requires ruby/ntlm module).
#
#     clnt = HTTPClient.new
#     domain = 'http://dev.ctor.org/http-access2/'
#     user = 'user'
#     password = 'user'
#     clnt.set_auth(domain, user, password)
#     p clnt.get('http://dev.ctor.org/http-access2/login').status
#
# 2. Authentication with Proxy server.  Supports BasicAuth and NTLM
#    (requires win32/sspi)
#
#     clnt = HTTPClient.new(proxy)
#     user = 'proxy'
#     password = 'proxy'
#     clnt.set_proxy_auth(user, password)
#     p clnt.get(url)
#
# === Invoking HTTP methods with custom header
#
# Pass a Hash or an Array for header argument.
#
#     header = { 'Accept' => 'text/html' }
#     clnt.get(uri, query, header)
#
#     header = [['Accept', 'image/jpeg'], ['Accept', 'image/png']]
#     clnt.get_content(uri, query, header)
#
# === Invoking HTTP methods asynchronously
#
# See head_async, get_async, post_async, put_async, delete_async,
# options_async, propfind_async, proppatch_async, and trace_async.
# It immediately returns a HTTPClient::Connection instance as a returning value.
#
#     connection = clnt.post_async(url, body)
#     print 'posting.'
#     while true
#       break if connection.finished?
#       print '.'
#       sleep 1
#     end
#     puts '.'
#     res = connection.pop
#     p res.status
#     p res.body.read # res.body is an IO for the res of async method.
#
# === Shortcut methods
#
# You can invoke get_content, get, etc. without creating HTTPClient instance.
#
#   ruby -rhttpclient -e 'puts HTTPClient.get_content(ARGV.shift)' http://dev.ctor.org/
#   ruby -rhttpclient -e 'p HTTPClient.head(ARGV.shift).header["last-modified"]' http://dev.ctor.org/
#
class HTTPClient
  RUBY_VERSION_STRING = "ruby #{RUBY_VERSION} (#{RUBY_RELEASE_DATE})"
  LIB_NAME = "(#{VERSION}, #{RUBY_VERSION_STRING})"

  include Util

  # Raised for indicating running environment configuration error for example
  # accessing via SSL under the ruby which is not compiled with OpenSSL.
  class ConfigurationError < StandardError
  end

  # Raised for indicating HTTP response error.
  class BadResponseError < RuntimeError
    # HTTP::Message:: a response
    attr_reader :res

    def initialize(msg, res = nil) # :nodoc:
      super(msg)
      @res = res
    end
  end

  # Raised for indicating a timeout error.
  class TimeoutError < RuntimeError
  end

  # Raised for indicating a connection timeout error.
  # You can configure connection timeout via HTTPClient#connect_timeout=.
  class ConnectTimeoutError < TimeoutError
  end

  # Raised for indicating a request sending timeout error.
  # You can configure request sending timeout via HTTPClient#send_timeout=.
  class SendTimeoutError < TimeoutError
  end

  # Raised for indicating a response receiving timeout error.
  # You can configure response receiving timeout via
  # HTTPClient#receive_timeout=.
  class ReceiveTimeoutError < TimeoutError
  end

  # Deprecated.  just for backward compatibility
  class Session
    BadResponse = ::HTTPClient::BadResponseError
  end

  class << self
    %w(get_content post_content head get post put delete options propfind proppatch trace).each do |name|
      eval <<-EOD
        def #{name}(*arg, &block)
          clnt = new
          begin
            clnt.#{name}(*arg, &block)
          ensure
            clnt.reset_all
          end
        end
      EOD
    end

  private

    def attr_proxy(symbol, assignable = false)
      name = symbol.to_s
      define_method(name) {
        @session_manager.__send__(name)
      }
      if assignable
        aname = name + '='
        define_method(aname) { |rhs|
          @session_manager.__send__(aname, rhs)
        }
      end
    end
  end

  # HTTPClient::SSLConfig:: SSL configurator.
  attr_reader :ssl_config
  # HTTPClient::CookieManager:: Cookies configurator.
  attr_accessor :cookie_manager
  # An array of response HTTP message body String which is used for loop-back
  # test.  See test/* to see how to use it.  If you want to do loop-back test
  # of HTTP header, use test_loopback_http_response instead.
  attr_reader :test_loopback_response
  # An array of request filter which can trap HTTP request/response.
  # See HTTPClient::WWWAuth to see how to use it.
  attr_reader :request_filter
  # HTTPClient::ProxyAuth:: Proxy authentication handler.
  attr_reader :proxy_auth
  # HTTPClient::WWWAuth:: WWW authentication handler.
  attr_reader :www_auth
  # How many times get_content and post_content follows HTTP redirect.
  # 10 by default.
  attr_accessor :follow_redirect_count
  # Base url of resources.
  attr_accessor :base_url
  # Default request header.
  attr_accessor :default_header

  # Set HTTP version as a String:: 'HTTP/1.0' or 'HTTP/1.1'
  attr_proxy(:protocol_version, true)
  # Connect timeout in sec.
  attr_proxy(:connect_timeout, true)
  # Request sending timeout in sec.
  attr_proxy(:send_timeout, true)
  # Response receiving timeout in sec.
  attr_proxy(:receive_timeout, true)
  # Reuse the same connection within this timeout in sec. from last used.
  attr_proxy(:keep_alive_timeout, true)
  # Size of reading block for non-chunked response.
  attr_proxy(:read_block_size, true)
  # Negotiation retry count for authentication.  5 by default.
  attr_proxy(:protocol_retry_count, true)
  # if your ruby is older than 2005-09-06, do not set socket_sync = false to
  # avoid an SSL socket blocking bug in openssl/buffering.rb.
  attr_proxy(:socket_sync, true)
  # Enables TCP keepalive; no timing settings exist at present
  attr_proxy(:tcp_keepalive, true)
  # User-Agent header in HTTP request.
  attr_proxy(:agent_name, true)
  # From header in HTTP request.
  attr_proxy(:from, true)
  # An array of response HTTP String (not a HTTP message body) which is used
  # for loopback test.  See test/* to see how to use it.
  attr_proxy(:test_loopback_http_response)
  # Decompress a compressed (with gzip or deflate) content body transparently. false by default.
  attr_proxy(:transparent_gzip_decompression, true)
  # Raise BadResponseError if response size does not match with Content-Length header in response. false by default.
  # TODO: enable by default
  attr_proxy(:strict_response_size_check, true)
  # Local socket address. Set HTTPClient#socket_local.host and HTTPClient#socket_local.port to specify local binding hostname and port of TCP socket.
  attr_proxy(:socket_local, true)

  # Default header for PROPFIND request.
  PROPFIND_DEFAULT_EXTHEADER = { 'Depth' => '0' }

  # Default User-Agent header
  DEFAULT_AGENT_NAME = 'HTTPClient/1.0'

  # Creates a HTTPClient instance which manages sessions, cookies, etc.
  #
  # HTTPClient.new takes optional arguments as a Hash.
  #  * :proxy - proxy url string
  #  * :agent_name - User-Agent String
  #  * :from - from header String
  #  * :base_url - base URL of resources
  #  * :default_header - header Hash all HTTP requests should have
  #  * :force_basic_auth - flag for sending Authorization header w/o gettin 401 first
  # User-Agent and From are embedded in HTTP request Header if given.
  # From header is not set without setting it explicitly.
  #
  #   proxy = 'http://myproxy:8080'
  #   agent_name = 'MyAgent/0.1'
  #   from = 'from@example.com'
  #   HTTPClient.new(proxy, agent_name, from)
  #
  # After you set :base_url, all resources you pass to get, post and other
  # methods are recognized to be prefixed with base_url. Say base_url is
  # 'https://api.example.com/v1/, get('users') is the same as
  # get('https://api.example.com/v1/users') internally. You can also pass
  # full URL from 'http://' even after setting base_url.
  #
  # The expected base_url and path behavior is the following. Please take
  # care of '/' in base_url and path.
  #
  # The last '/' is important for base_url:
  #   1. http://foo/bar/baz/ + path -> http://foo/bar/baz/path
  #   2. http://foo/bar/baz + path -> http://foo/bar/path
  # Relative path handling:
  #   3. http://foo/bar/baz/ + ../path -> http://foo/bar/path
  #   4. http://foo/bar/baz + ../path -> http://foo/path
  #   5. http://foo/bar/baz/ + ./path -> http://foo/bar/baz/path
  #   6. http://foo/bar/baz + ./path -> http://foo/bar/path
  # The leading '/' of path means absolute path:
  #   7. http://foo/bar/baz/ + /path -> http://foo/path
  #   8. http://foo/bar/baz + /path -> http://foo/path
  #
  # :default_header is for providing default headers Hash that all HTTP
  # requests should have, such as custom 'Authorization' header in API.
  # You can override :default_header with :header Hash parameter in HTTP
  # request methods.
  #
  # :force_basic_auth turns on/off the BasicAuth force flag. Generally
  # HTTP client must send Authorization header after it gets 401 error
  # from server from security reason. But in some situation (e.g. API
  # client) you might want to send Authorization from the beginning.
  def initialize(*args, &block)
    proxy, agent_name, from, base_url, default_header, force_basic_auth =
      keyword_argument(args, :proxy, :agent_name, :from, :base_url, :default_header, :force_basic_auth)
    @proxy = nil        # assigned later.
    @no_proxy = nil
    @no_proxy_regexps = []
    @base_url = base_url
    @default_header = default_header || {}
    @www_auth = WWWAuth.new
    @proxy_auth = ProxyAuth.new
    @www_auth.basic_auth.force_auth = @proxy_auth.basic_auth.force_auth = force_basic_auth
    @request_filter = [@proxy_auth, @www_auth]
    @debug_dev = nil
    @redirect_uri_callback = method(:default_redirect_uri_callback)
    @test_loopback_response = []
    @session_manager = SessionManager.new(self)
    @session_manager.agent_name = agent_name || DEFAULT_AGENT_NAME
    @session_manager.from = from
    @session_manager.ssl_config = @ssl_config = SSLConfig.new(self)
    @cookie_manager = CookieManager.new
    @follow_redirect_count = 10
    load_environment
    self.proxy = proxy if proxy
    keep_webmock_compat
    instance_eval(&block) if block
  end

  # webmock 1.6.2 depends on HTTP::Message#body.content to work.
  # let's keep it work iif webmock is loaded for a while.
  def keep_webmock_compat
    if respond_to?(:do_get_block_with_webmock)
      ::HTTP::Message.module_eval do
        def body
          def (o = self.content).content
            self
          end
          o
        end
      end
    end
  end

  # Returns debug device if exists.  See debug_dev=.
  def debug_dev
    @debug_dev
  end

  # Sets debug device.  Once debug device is set, all HTTP requests and
  # responses are dumped to given device.  dev must respond to << for dump.
  #
  # Calling this method resets all existing sessions.
  def debug_dev=(dev)
    @debug_dev = dev
    reset_all
    @session_manager.debug_dev = dev
  end

  # Returns URI object of HTTP proxy if exists.
  def proxy
    @proxy
  end

  # Sets HTTP proxy used for HTTP connection.  Given proxy can be an URI,
  # a String or nil.  You can set user/password for proxy authentication like
  # HTTPClient#proxy = 'http://user:passwd@myproxy:8080'
  #
  # You can use environment variable 'http_proxy' or 'HTTP_PROXY' for it.
  # You need to use 'cgi_http_proxy' or 'CGI_HTTP_PROXY' instead if you run
  # HTTPClient from CGI environment from security reason. (HTTPClient checks
  # 'REQUEST_METHOD' environment variable whether it's CGI or not)
  #
  # Calling this method resets all existing sessions.
  def proxy=(proxy)
    if proxy.nil? || proxy.to_s.empty?
      @proxy = nil
      @proxy_auth.reset_challenge
    else
      @proxy = urify(proxy)
      if @proxy.scheme == nil or @proxy.scheme.downcase != 'http' or
          @proxy.host == nil or @proxy.port == nil
        raise ArgumentError.new("unsupported proxy #{proxy}")
      end
      @proxy_auth.reset_challenge
      if @proxy.user || @proxy.password
        @proxy_auth.set_auth(@proxy.user, @proxy.password)
      end
    end
    reset_all
    @session_manager.proxy = @proxy
    @proxy
  end

  # Returns NO_PROXY setting String if given.
  def no_proxy
    @no_proxy
  end

  # Sets NO_PROXY setting String.  no_proxy must be a comma separated String.
  # Each entry must be 'host' or 'host:port' such as;
  # HTTPClient#no_proxy = 'example.com,example.co.jp:443'
  #
  # 'localhost' is treated as a no_proxy site regardless of explicitly listed.
  # HTTPClient checks given URI objects before accessing it.
  # 'host' is tail string match.  No IP-addr conversion.
  #
  # You can use environment variable 'no_proxy' or 'NO_PROXY' for it.
  #
  # Calling this method resets all existing sessions.
  def no_proxy=(no_proxy)
    @no_proxy = no_proxy
    @no_proxy_regexps.clear
    if @no_proxy
      @no_proxy.scan(/([^\s:,]+)(?::(\d+))?/) do |host, port|
        if host[0] == ?.
          regexp = /#{Regexp.quote(host)}\z/i
        else
          regexp = /(\A|\.)#{Regexp.quote(host)}\z/i
        end
        @no_proxy_regexps << [regexp, port]
      end
    end
    reset_all
  end

  # Sets credential for Web server authentication.
  # domain:: a String or an URI to specify where HTTPClient should use this
  #       credential.  If you set uri to nil, HTTPClient uses this credential
  #       wherever a server requires it.
  # user:: username String.
  # passwd:: password String.
  #
  # You can set multiple credentials for each uri.
  #
  #   clnt.set_auth('http://www.example.com/foo/', 'foo_user', 'passwd')
  #   clnt.set_auth('http://www.example.com/bar/', 'bar_user', 'passwd')
  #
  # Calling this method resets all existing sessions.
  def set_auth(domain, user, passwd)
    uri = to_resource_url(domain)
    @www_auth.set_auth(uri, user, passwd)
    reset_all
  end

  # Deprecated.  Use set_auth instead.
  def set_basic_auth(domain, user, passwd)
    uri = to_resource_url(domain)
    @www_auth.basic_auth.set(uri, user, passwd)
    reset_all
  end

  # Sets credential for Proxy authentication.
  # user:: username String.
  # passwd:: password String.
  #
  # Calling this method resets all existing sessions.
  def set_proxy_auth(user, passwd)
    @proxy_auth.set_auth(user, passwd)
    reset_all
  end

  # Turn on/off the BasicAuth force flag. Generally HTTP client must
  # send Authorization header after it gets 401 error from server from
  # security reason. But in some situation (e.g. API client) you might
  # want to send Authorization from the beginning.
  def force_basic_auth=(force_basic_auth)
    @www_auth.basic_auth.force_auth = @proxy_auth.basic_auth.force_auth = force_basic_auth
  end

  # Sets the filename where non-volatile Cookies be saved by calling
  # save_cookie_store.
  # This method tries to load and managing Cookies from the specified file.
  #
  # Calling this method resets all existing sessions.
  def set_cookie_store(filename)
    @cookie_manager.cookies_file = filename
    @cookie_manager.load_cookies if filename
    reset_all
  end

  # Try to save Cookies to the file specified in set_cookie_store.  Unexpected
  # error will be raised if you don't call set_cookie_store first.
  def save_cookie_store
    @cookie_manager.save_cookies
  end

  # Returns stored cookies.
  def cookies
    if @cookie_manager
      @cookie_manager.cookies
    end
  end

  # Sets callback proc when HTTP redirect status is returned for get_content
  # and post_content.  default_redirect_uri_callback is used by default.
  #
  # If you need strict implementation which does not allow relative URI
  # redirection, set strict_redirect_uri_callback instead.
  #
  #   clnt.redirect_uri_callback = clnt.method(:strict_redirect_uri_callback)
  #
  def redirect_uri_callback=(redirect_uri_callback)
    @redirect_uri_callback = redirect_uri_callback
  end

  # Retrieves a web resource.
  #
  # uri:: a String or an URI object which represents an URL of web resource.
  # query:: a Hash or an Array of query part of URL.
  #         e.g. { "a" => "b" } => 'http://host/part?a=b'.
  #         Give an array to pass multiple value like
  #         [["a", "b"], ["a", "c"]] => 'http://host/part?a=b&a=c'.
  # header:: a Hash or an Array of extra headers.  e.g.
  #          { 'Accept' => 'text/html' } or
  #          [['Accept', 'image/jpeg'], ['Accept', 'image/png']].
  # &block:: Give a block to get chunked message-body of response like
  #          get_content(uri) { |chunked_body| ... }.
  #          Size of each chunk may not be the same.
  #
  # get_content follows HTTP redirect status (see HTTP::Status.redirect?)
  # internally and try to retrieve content from redirected URL.  See
  # redirect_uri_callback= how HTTP redirection is handled.
  #
  # If you need to get full HTTP response including HTTP status and headers,
  # use get method.  get returns HTTP::Message as a response and you need to
  # follow HTTP redirect by yourself if you need.
  def get_content(uri, *args, &block)
    query, header = keyword_argument(args, :query, :header)
    success_content(follow_redirect(:get, uri, query, nil, header || {}, &block))
  end

  # Posts a content.
  #
  # uri:: a String or an URI object which represents an URL of web resource.
  # body:: a Hash or an Array of body part. e.g.
  #          { "a" => "b" } => 'a=b'
  #        Give an array to pass multiple value like
  #          [["a", "b"], ["a", "c"]] => 'a=b&a=c'
  #        When you pass a File as a value, it will be posted as a
  #        multipart/form-data.  e.g.
  #          { 'upload' => file }
  #        You can also send custom multipart by passing an array of hashes.
  #        Each part must have a :content attribute which can be a file, all
  #        other keys will become headers.
  #          [{ 'Content-Type' => 'text/plain', :content => "some text" },
  #           { 'Content-Type' => 'video/mp4', :content => File.new('video.mp4') }]
  #          => <Two parts with custom Content-Type header>
  # header:: a Hash or an Array of extra headers. e.g.
  #            { 'Accept' => 'text/html' }
  #          or
  #            [['Accept', 'image/jpeg'], ['Accept', 'image/png']].
  # &block:: Give a block to get chunked message-body of response like
  #            post_content(uri) { |chunked_body| ... }.
  #          Size of each chunk may not be the same.
  #
  # post_content follows HTTP redirect status (see HTTP::Status.redirect?)
  # internally and try to post the content to redirected URL.  See
  # redirect_uri_callback= how HTTP redirection is handled.
  # Bear in mind that you should not depend on post_content because it sends
  # the same POST method to the new location which is prohibited in HTTP spec.
  #
  # If you need to get full HTTP response including HTTP status and headers,
  # use post method.
  def post_content(uri, *args, &block)
    if hashy_argument_has_keys(args, :query, :body)
      query, body, header = keyword_argument(args, :query, :body, :header)
    else
      query = nil
      body, header = keyword_argument(args, :body, :header)
    end
    success_content(follow_redirect(:post, uri, query, body, header || {}, &block))
  end

  # A method for redirect uri callback.  How to use:
  #   clnt.redirect_uri_callback = clnt.method(:strict_redirect_uri_callback)
  # This callback does not allow relative redirect such as
  #   Location: ../foo/
  # in HTTP header. (raises BadResponseError instead)
  def strict_redirect_uri_callback(uri, res)
    newuri = urify(res.header['location'][0])
    if https?(uri) && !https?(newuri)
      raise BadResponseError.new("redirecting to non-https resource")
    end
    if !http?(newuri) && !https?(newuri)
      raise BadResponseError.new("unexpected location: #{newuri}", res)
    end
    puts "redirect to: #{newuri}" if $DEBUG
    newuri
  end

  # A default method for redirect uri callback.  This method is used by
  # HTTPClient instance by default.
  # This callback allows relative redirect such as
  #   Location: ../foo/
  # in HTTP header.
  def default_redirect_uri_callback(uri, res)
    newuri = urify(res.header['location'][0])
    if !http?(newuri) && !https?(newuri)
      warn("#{newuri}: a relative URI in location header which is not recommended")
      warn("'The field value consists of a single absolute URI' in HTTP spec")
      newuri = uri + newuri
    end
    if https?(uri) && !https?(newuri)
      raise BadResponseError.new("redirecting to non-https resource")
    end
    puts "redirect to: #{newuri}" if $DEBUG
    newuri
  end

  # Sends HEAD request to the specified URL.  See request for arguments.
  def head(uri, *args)
    request(:head, uri, argument_to_hash(args, :query, :header, :follow_redirect))
  end

  # Sends GET request to the specified URL.  See request for arguments.
  def get(uri, *args, &block)
    request(:get, uri, argument_to_hash(args, :query, :header, :follow_redirect), &block)
  end

  # Sends PATCH request to the specified URL.  See request for arguments.
  def patch(uri, *args, &block)
    if hashy_argument_has_keys(args, :query, :body)
      new_args = args[0]
    else
      new_args = argument_to_hash(args, :body, :header)
    end
    request(:patch, uri, new_args, &block)
  end

  # Sends POST request to the specified URL.  See request for arguments.
  # You should not depend on :follow_redirect => true for POST method.  It
  # sends the same POST method to the new location which is prohibited in HTTP spec.
  def post(uri, *args, &block)
    if hashy_argument_has_keys(args, :query, :body)
      new_args = args[0]
    else
      new_args = argument_to_hash(args, :body, :header, :follow_redirect)
    end
    request(:post, uri, new_args, &block)
  end

  # Sends PUT request to the specified URL.  See request for arguments.
  def put(uri, *args, &block)
    if hashy_argument_has_keys(args, :query, :body)
      new_args = args[0]
    else
      new_args = argument_to_hash(args, :body, :header)
    end
    request(:put, uri, new_args, &block)
  end

  # Sends DELETE request to the specified URL.  See request for arguments.
  def delete(uri, *args, &block)
    request(:delete, uri, argument_to_hash(args, :body, :header, :query), &block)
  end

  # Sends OPTIONS request to the specified URL.  See request for arguments.
  def options(uri, *args, &block)
    new_args = argument_to_hash(args, :header, :query, :body)
    request(:options, uri, new_args, &block)
  end

  # Sends PROPFIND request to the specified URL.  See request for arguments.
  def propfind(uri, *args, &block)
    request(:propfind, uri, argument_to_hash(args, :header), &block)
  end
  
  # Sends PROPPATCH request to the specified URL.  See request for arguments.
  def proppatch(uri, *args, &block)
    request(:proppatch, uri, argument_to_hash(args, :body, :header), &block)
  end
  
  # Sends TRACE request to the specified URL.  See request for arguments.
  def trace(uri, *args, &block)
    request('TRACE', uri, argument_to_hash(args, :query, :header), &block)
  end

  # Sends a request to the specified URL.
  #
  # method:: HTTP method to be sent.  method.to_s.upcase is used.
  # uri:: a String or an URI object which represents an URL of web resource.
  # query:: a Hash or an Array of query part of URL.
  #         e.g. { "a" => "b" } => 'http://host/part?a=b'
  #         Give an array to pass multiple value like
  #         [["a", "b"], ["a", "c"]] => 'http://host/part?a=b&a=c'
  # body:: a Hash or an Array of body part. e.g.
  #          { "a" => "b" }
  #          => 'a=b'
  #        Give an array to pass multiple value like
  #          [["a", "b"], ["a", "c"]]
  #          => 'a=b&a=c'.
  #        When the given method is 'POST' and the given body contains a file
  #        as a value, it will be posted as a multipart/form-data. e.g.
  #          { 'upload' => file }
  #        You can also send custom multipart by passing an array of hashes.
  #        Each part must have a :content attribute which can be a file, all
  #        other keys will become headers.
  #          [{ 'Content-Type' => 'text/plain', :content => "some text" },
  #           { 'Content-Type' => 'video/mp4', :content => File.new('video.mp4') }]
  #          => <Two parts with custom Content-Type header>
  #        See HTTP::Message.file? for actual condition of 'a file'.
  # header:: a Hash or an Array of extra headers.  e.g.
  #          { 'Accept' => 'text/html' } or
  #          [['Accept', 'image/jpeg'], ['Accept', 'image/png']].
  # &block:: Give a block to get chunked message-body of response like
  #          get(uri) { |chunked_body| ... }.
  #          Size of each chunk may not be the same.
  #
  # You can also pass a String as a body.  HTTPClient just sends a String as
  # a HTTP request message body.
  #
  # When you pass an IO as a body, HTTPClient sends it as a HTTP request with
  # chunked encoding (Transfer-Encoding: chunked in HTTP header) if IO does not
  # respond to :size. Bear in mind that some server application does not support
  # chunked request.  At least cgi.rb does not support it.
  def request(method, uri, *args, &block)
    query, body, header, follow_redirect = keyword_argument(args, :query, :body, :header, :follow_redirect)
    if method == :propfind
      header ||= PROPFIND_DEFAULT_EXTHEADER
    else
      header ||= {}
    end
    uri = to_resource_url(uri)
    if block
      filtered_block = adapt_block(&block)
    end
    if follow_redirect
      follow_redirect(method, uri, query, body, header, &block)
    else
      do_request(method, uri, query, body, header, &filtered_block)
    end
  end

  # Sends HEAD request in async style.  See request_async for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def head_async(uri, *args)
    request_async2(:head, uri, argument_to_hash(args, :query, :header))
  end

  # Sends GET request in async style.  See request_async for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def get_async(uri, *args)
    request_async2(:get, uri, argument_to_hash(args, :query, :header))
  end

  # Sends PATCH request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def patch_async(uri, *args)
    if hashy_argument_has_keys(args, :query, :body)
      new_args = args[0]
    else
      new_args = argument_to_hash(args, :body, :header)
    end
    request_async2(:patch, uri, new_args)
  end

  # Sends POST request in async style.  See request_async for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def post_async(uri, *args)
    if hashy_argument_has_keys(args, :query, :body)
      new_args = args[0]
    else
      new_args = argument_to_hash(args, :body, :header)
    end
    request_async2(:post, uri, new_args)
  end

  # Sends PUT request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def put_async(uri, *args)
    if hashy_argument_has_keys(args, :query, :body)
      new_args = args[0]
    else
      new_args = argument_to_hash(args, :body, :header)
    end
    request_async2(:put, uri, new_args)
  end

  # Sends DELETE request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def delete_async(uri, *args)
    request_async2(:delete, uri, argument_to_hash(args, :body, :header, :query))
  end

  # Sends OPTIONS request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def options_async(uri, *args)
    request_async2(:options, uri, argument_to_hash(args, :header, :query, :body))
  end

  # Sends PROPFIND request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def propfind_async(uri, *args)
    request_async2(:propfind, uri, argument_to_hash(args, :body, :header))
  end
  
  # Sends PROPPATCH request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def proppatch_async(uri, *args)
    request_async2(:proppatch, uri, argument_to_hash(args, :body, :header))
  end
  
  # Sends TRACE request in async style.  See request_async2 for arguments.
  # It immediately returns a HTTPClient::Connection instance as a result.
  def trace_async(uri, *args)
    request_async2(:trace, uri, argument_to_hash(args, :query, :header))
  end

  # Sends a request in async style.  request method creates new Thread for
  # HTTP connection and returns a HTTPClient::Connection instance immediately.
  #
  # Arguments definition is the same as request.
  def request_async(method, uri, query = nil, body = nil, header = {})
    uri = to_resource_url(uri)
    do_request_async(method, uri, query, body, header)
  end

  # new method that has same signature as 'request'
  def request_async2(method, uri, *args)
    query, body, header = keyword_argument(args, :query, :body, :header)
    if [:post, :put].include?(method)
      body ||= ''
    end
    if method == :propfind
      header ||= PROPFIND_DEFAULT_EXTHEADER
    else
      header ||= {}
    end
    uri = to_resource_url(uri)
    do_request_async(method, uri, query, body, header)
  end

  # Resets internal session for the given URL.  Keep-alive connection for the
  # site (host-port pair) is disconnected if exists.
  def reset(uri)
    uri = to_resource_url(uri)
    @session_manager.reset(uri)
  end

  # Resets all of internal sessions.  Keep-alive connections are disconnected.
  def reset_all
    @session_manager.reset_all
  end

private

  class RetryableResponse < StandardError # :nodoc:
    attr_reader :res

    def initialize(res = nil)
      @res = res
    end
  end

  class KeepAliveDisconnected < StandardError # :nodoc:
    attr_reader :sess
    attr_reader :cause
    def initialize(sess = nil, cause = nil)
      super("#{self.class.name}: #{cause ? cause.message : nil}")
      @sess = sess
      @cause = cause
    end
  end

  def hashy_argument_has_keys(args, *key)
    # if the given arg is a single Hash and...
    args.size == 1 and Hash === args[0] and
      # it has any one of the key
      key.all? { |e| args[0].key?(e) }
  end

  def do_request(method, uri, query, body, header, &block)
    res = nil
    if HTTP::Message.file?(body)
      pos = body.pos rescue nil
    end
    retry_count = @session_manager.protocol_retry_count
    proxy = no_proxy?(uri) ? nil : @proxy
    previous_request = previous_response = nil
    while retry_count > 0
      body.pos = pos if pos
      req = create_request(method, uri, query, body, header)
      if previous_request
        # to remember IO positions to read
        req.http_body.positions = previous_request.http_body.positions
      end
      begin
        protect_keep_alive_disconnected do
          # TODO: remove Connection.new
          # We want to delete Connection usage in do_get_block but Newrelic gem depends on it.
          # https://github.com/newrelic/rpm/blob/master/lib/new_relic/agent/instrumentation/httpclient.rb#L34-L36
          conn = Connection.new
          res = do_get_block(req, proxy, conn, &block)
          # Webmock's do_get_block returns ConditionVariable
          if !res.respond_to?(:previous)
            res = conn.pop
          end
        end
        res.previous = previous_response
        break
      rescue RetryableResponse => e
        previous_request = req
        previous_response = res = e.res
        retry_count -= 1
      end
    end
    res
  end

  def do_request_async(method, uri, query, body, header)
    conn = Connection.new
    t = Thread.new(conn) { |tconn|
      begin
        if HTTP::Message.file?(body)
          pos = body.pos rescue nil
        end
        retry_count = @session_manager.protocol_retry_count
        proxy = no_proxy?(uri) ? nil : @proxy
        while retry_count > 0
          body.pos = pos if pos
          req = create_request(method, uri, query, body, header)
          begin
            protect_keep_alive_disconnected do
              do_get_stream(req, proxy, tconn)
            end
            break
          rescue RetryableResponse
            retry_count -= 1
          end
        end
      rescue Exception => e
        conn.push e
      end
    }
    conn.async_thread = t
    conn
  end

  def load_environment
    # http_proxy
    if getenv('REQUEST_METHOD')
      # HTTP_PROXY conflicts with the environment variable usage in CGI where
      # HTTP_* is used for HTTP header information.  Unlike open-uri, we
      # simply ignore http_proxy in CGI env and use cgi_http_proxy instead.
      self.proxy = getenv('cgi_http_proxy')
    else
      self.proxy = getenv('http_proxy')
    end
    # no_proxy
    self.no_proxy = getenv('no_proxy')
  end

  def getenv(name)
    ENV[name.downcase] || ENV[name.upcase]
  end

  def adapt_block(&block)
    return block if block.arity == 2
    proc { |r, str| block.call(str) }
  end

  def follow_redirect(method, uri, query, body, header, &block)
    uri = to_resource_url(uri)
    if block
      b = adapt_block(&block)
      filtered_block = proc { |r, str|
        b.call(r, str) if r.ok?
      }
    end
    if HTTP::Message.file?(body)
      pos = body.pos rescue nil
    end
    retry_number = 0
    previous = nil
    request_query = query
    while retry_number < @follow_redirect_count
      body.pos = pos if pos
      res = do_request(method, uri, request_query, body, header, &filtered_block)
      res.previous = previous
      if res.redirect?
        if res.header['location'].empty?
          raise BadResponseError.new("Missing Location header for redirect", res)
        end
        method = :get if res.see_other? # See RFC2616 10.3.4
        uri = urify(@redirect_uri_callback.call(uri, res))
        # To avoid duped query parameter. 'location' must include query part.
        request_query = nil
        previous = res
        retry_number += 1
      else
        return res
      end
    end
    raise BadResponseError.new("retry count exceeded", res)
  end

  def success_content(res)
    if res.ok?
      return res.content
    else
      raise BadResponseError.new("unexpected response: #{res.header.inspect}", res)
    end
  end

  def protect_keep_alive_disconnected
    begin
      yield
    rescue KeepAliveDisconnected
      # Force to create new connection
      Thread.current[:HTTPClient_AcquireNewConnection] = true
      begin
        yield
      ensure
        Thread.current[:HTTPClient_AcquireNewConnection] = false
      end
    end
  end

  def create_request(method, uri, query, body, header)
    method = method.to_s.upcase
    if header.is_a?(Hash)
      header = @default_header.merge(header).to_a
    else
      header = @default_header.to_a + header.dup
    end
    boundary = nil
    if body
      _, content_type = header.find { |key, value|
        key.to_s.downcase == 'content-type'
      }
      if content_type
        if /\Amultipart/ =~ content_type
          if content_type =~ /boundary=(.+)\z/
            boundary = $1
          else
            boundary = create_boundary
            content_type = "#{content_type}; boundary=#{boundary}"
            header = override_header(header, 'content-type', content_type)
          end
        end
      else
        if file_in_form_data?(body)
          boundary = create_boundary
          content_type = "multipart/form-data; boundary=#{boundary}"
        else
          content_type = 'application/x-www-form-urlencoded'
        end
        header << ['Content-Type', content_type]
      end
    end
    req = HTTP::Message.new_request(method, uri, query, body, boundary)
    header.each do |key, value|
      req.header.add(key.to_s, value)
    end
    if @cookie_manager
      cookie_value = @cookie_manager.cookie_value(uri)
      if cookie_value
        req.header.add('Cookie', cookie_value)
      end
    end
    req
  end

  def create_boundary
    Digest::SHA1.hexdigest(Time.now.to_s)
  end

  def file_in_form_data?(body)
    HTTP::Message.multiparam_query?(body) &&
      body.any? { |k, v| HTTP::Message.file?(v) }
  end

  def override_header(header, key, value)
    result = []
    header.each do |k, v|
      if k.to_s.downcase == key
        result << [key, value]
      else
        result << [k, v]
      end
    end
    result
  end

  NO_PROXY_HOSTS = ['localhost']

  def no_proxy?(uri)
    if !@proxy or NO_PROXY_HOSTS.include?(uri.host)
      return true
    end
    @no_proxy_regexps.each do |regexp, port|
      if !port || uri.port == port.to_i
        if regexp =~ uri.host
          return true
        end
      end
    end
    false
  end

  # !! CAUTION !!
  #   Method 'do_get*' runs under MT conditon. Be careful to change.
  def do_get_block(req, proxy, conn, &block)
    @request_filter.each do |filter|
      filter.filter_request(req)
    end
    if str = @test_loopback_response.shift
      dump_dummy_request_response(req.http_body.dump, str) if @debug_dev
      res = HTTP::Message.new_response(str, req.header)
      conn.push(res)
      return res
    end
    content = block ? nil : ''
    res = HTTP::Message.new_response(content, req.header)
    @debug_dev << "= Request\n\n" if @debug_dev
    sess = @session_manager.query(req, proxy)
    res.peer_cert = sess.ssl_peer_cert
    @debug_dev << "\n\n= Response\n\n" if @debug_dev
    do_get_header(req, res, sess)
    conn.push(res)
    sess.get_body do |part|
      set_encoding(part, res.body_encoding)
      if block
        block.call(res, part.dup)
      else
        content << part
      end
    end
    # there could be a race condition but it's OK to cache unreusable
    # connection because we do retry for that case.
    @session_manager.keep(sess) unless sess.closed?
    commands = @request_filter.collect { |filter|
      filter.filter_response(req, res)
    }
    if commands.find { |command| command == :retry }
      raise RetryableResponse.new(res)
    end
    res
  end

  def do_get_stream(req, proxy, conn)
    @request_filter.each do |filter|
      filter.filter_request(req)
    end
    if str = @test_loopback_response.shift
      dump_dummy_request_response(req.http_body.dump, str) if @debug_dev
      conn.push(HTTP::Message.new_response(StringIO.new(str), req.header))
      return
    end
    piper, pipew = IO.pipe
    pipew.binmode
    res = HTTP::Message.new_response(piper, req.header)
    @debug_dev << "= Request\n\n" if @debug_dev
    sess = @session_manager.query(req, proxy)
    res.peer_cert = sess.ssl_peer_cert
    @debug_dev << "\n\n= Response\n\n" if @debug_dev
    do_get_header(req, res, sess)
    conn.push(res)
    sess.get_body do |part|
      set_encoding(part, res.body_encoding)
      pipew.write(part)
    end
    pipew.close
    @session_manager.keep(sess) unless sess.closed?
    _ = @request_filter.collect { |filter|
      filter.filter_response(req, res)
    }
    # ignore commands (not retryable in async mode)
    res
  end

  def do_get_header(req, res, sess)
    res.http_version, res.status, res.reason, headers = sess.get_header
    res.header.set_headers(headers)
    if @cookie_manager
      res.header['set-cookie'].each do |cookie|
        @cookie_manager.parse(cookie, req.header.request_uri)
      end
    end
  end

  def dump_dummy_request_response(req, res)
    @debug_dev << "= Dummy Request\n\n"
    @debug_dev << req
    @debug_dev << "\n\n= Dummy Response\n\n"
    @debug_dev << res
  end

  def set_encoding(str, encoding)
    str.force_encoding(encoding) if encoding
  end

  def to_resource_url(uri)
    u = urify(uri)
    if @base_url && u.scheme.nil? && u.host.nil?
      urify(@base_url) + uri
    else
      u
    end
  end
end
