# -*- encoding: utf-8 -*-
begin
  require 'simplecov'
  require 'simplecov-rcov'
  SimpleCov.formatter = SimpleCov::Formatter::RcovFormatter
  SimpleCov.start
rescue LoadError
end
require 'test/unit'

require 'httpclient'
require 'webrick'
require 'webrick/httpproxy.rb'
require 'logger'
require 'stringio'
require 'cgi'
require 'webrick/httputils'


module Helper
  Port = 17171
  ProxyPort = 17172

  def serverport
    @serverport
  end

  def proxyport
    @proxyport
  end

  def serverurl
    "http://localhost:#{serverport}/"
  end

  def proxyurl
    "http://localhost:#{proxyport}/"
  end

  def setup
    @logger = Logger.new(STDERR)
    @logger.level = Logger::Severity::FATAL
    @proxyio = StringIO.new
    @proxylogger = Logger.new(@proxyio)
    @proxylogger.level = Logger::Severity::DEBUG
    @server = @proxyserver = @client = nil
    @server_thread = @proxyserver_thread = nil
    @serverport = Port
    @proxyport = ProxyPort
  end

  def teardown
    teardown_client if @client
    teardown_proxyserver if @proxyserver
    teardown_server if @server
  end

  def setup_client
    @client = HTTPClient.new
  end

  def escape_noproxy
    backup = HTTPClient::NO_PROXY_HOSTS.dup
    HTTPClient::NO_PROXY_HOSTS.clear
    yield
  ensure
    HTTPClient::NO_PROXY_HOSTS.replace(backup)
  end

  def setup_proxyserver
    @proxyserver = WEBrick::HTTPProxyServer.new(
      :BindAddress => "localhost",
      :Logger => @proxylogger,
      :Port => 0,
      :AccessLog => []
    )
    @proxyport = @proxyserver.config[:Port]
    @proxyserver_thread = start_server_thread(@proxyserver)
  end

  def teardown_client
    @client.reset_all
  end

  def teardown_server
    @server.shutdown
    #@server_thread.kill
  end

  def teardown_proxyserver
    @proxyserver.shutdown
    #@proxyserver_thread.kill
  end

  def start_server_thread(server)
    t = Thread.new {
      Thread.current.abort_on_exception = true
      server.start
    }
    while server.status != :Running
      Thread.pass
      unless t.alive?
        t.join
        raise
      end
    end
    t
  end

  def params(str)
    HTTP::Message.parse(str).inject({}) { |r, (k, v)| r[k] = v.first; r }
  end

  def silent
    begin
      back, $VERBOSE = $VERBOSE, nil
      yield
    ensure
      $VERBOSE = back
    end
  end

  def escape_env
    env = {}
    env.update(ENV)
    yield
  ensure
    ENV.clear
    ENV.update(env)
  end
end
