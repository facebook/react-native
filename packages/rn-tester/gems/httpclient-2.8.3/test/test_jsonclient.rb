# -*- encoding: utf-8 -*-
require File.expand_path('helper', File.dirname(__FILE__))
require 'jsonclient'


class TestJSONClient < Test::Unit::TestCase
  include Helper

  def setup
    super
    setup_server
    @client = JSONClient.new
  end

  def teardown
    super
  end

  def test_post
    res = @client.post(serverurl + 'json', {'a' => 1, 'b' => {'c' => 2}})
    assert_equal(2, res.content['b']['c'])
    assert_equal('application/json; charset=utf-8', res.content_type)
    # #previous contains the original response
    assert_equal(1, JSON.parse(res.previous.content)['a'])
  end

  def test_post_with_header
    res = @client.post(serverurl + 'json', :header => {'X-foo' => 'bar'}, :body => {'a' => 1, 'b' => {'c' => 2}})
    assert_equal(2, res.content['b']['c'])
    assert_equal('application/json; charset=utf-8', res.content_type)
  end

  def test_post_with_array_header
    res = @client.post(serverurl + 'json', :header => [['X-foo', 'bar']], :body => {'a' => 1, 'b' => {'c' => 2}})
    assert_equal(2, res.content['b']['c'])
    assert_equal('application/json; charset=utf-8', res.content_type)
  end

  def test_post_non_json_body
    res = @client.post(serverurl + 'json', 'a=b&c=d')
    assert_equal('a=b&c=d', res.content)
    assert_equal('application/x-www-form-urlencoded', res.content_type)
  end

  def test_put
    res = @client.put(serverurl + 'json', {'a' => 1, 'b' => {'c' => 2}})
    assert_equal(2, res.content['b']['c'])
    assert_equal('application/json; charset=utf-8', res.content_type)
  end

  def test_get_not_affected
    res = @client.get(serverurl + 'json', {'a' => 1, 'b' => {'c' => 2}})
    assert_equal('', res.content)
    assert_equal('', res.content_type)
  end

  class JSONServlet < WEBrick::HTTPServlet::AbstractServlet
    def get_instance(*arg)
      self
    end

    def service(req, res)
      res['content-type'] = req['content-type']
      res.body = req.body
    end
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
    @server.mount('/json', JSONServlet.new(@server))
    @server_thread = start_server_thread(@server)
  end
end
