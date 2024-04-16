# HTTPClient - HTTP client library.
# Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.
#
# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.


require 'httpclient'

module HTTP
  class Message
    attr_accessor :oauth_params
  end
end


# OAuthClient provides OAuth related methods in addition to HTTPClient.
#
# See sample/ dir how to use OAuthClient. There are sample clients for Twitter,
# FriendFeed and Google Buzz.
class OAuthClient < HTTPClient

  # HTTPClient::OAuth::Config:: OAuth configurator.
  attr_accessor :oauth_config

  # Creates a OAuthClient instance which provides OAuth related methods in
  # addition to HTTPClient.
  #
  # Method signature is as same as HTTPClient.  See HTTPClient.new
  def initialize(*arg)
    super
    @oauth_config = HTTPClient::OAuth::Config.new
    self.www_auth.oauth.set_config(nil, @oauth_config)
    self.www_auth.oauth.challenge(nil)
    self.strict_response_size_check = true
  end

  # Get request token.
  # uri:: URI for request token.
  # callback:: callback String. This can be nil for OAuth 1.0a
  # param:: Additional query parameter Hash.
  #
  # It returns a HTTP::Message instance as a response. When the request is made
  # successfully, you can retrieve a pair of request token and secret like
  # following;
  #   res = client.get_request_token(...)
  #   token = res.oauth_params['oauth_token']
  #   secret = res.oauth_params['oauth_token_secret']
  def get_request_token(uri, callback = nil, param = nil)
    oauth_config.token = nil
    oauth_config.secret = nil
    oauth_config.callback = callback
    oauth_config.verifier = nil
    res = request(oauth_config.http_method, uri, param)
    filter_response(res)
    res
  end

  # Get access token.
  # uri:: URI for request token.
  # request_token:: a request token String. See get_access_token.
  # request_token_secret:: a request secret String. See get_access_token.
  # verifier:: a verifier tag String.
  #
  # When the request succeeds and the server returns a pair of access token
  # and secret, oauth_config.token and oauth_token.secret are updated with
  # the access token. Then you can call OAuthClient#get, #post, #delete, etc.
  # All requests are signed.
  def get_access_token(uri, request_token, request_token_secret, verifier = nil)
    oauth_config.token = request_token
    oauth_config.secret = request_token_secret
    oauth_config.callback = nil
    oauth_config.verifier = verifier
    res = request(oauth_config.http_method, uri)
    filter_response(res)
    oauth_config.verifier = nil
    res
  end

  # Parse response and returns a Hash.
  def get_oauth_response(res)
    enc = res.header['content-encoding']
    body = nil
    if enc and enc[0] and enc[0].downcase == 'gzip'
      body = Zlib::GzipReader.wrap(StringIO.new(res.content)) { |gz| gz.read }
    else
      body = res.content
    end
    body.split('&').inject({}) { |r, e|
      key, value = e.split('=', 2)
      r[unescape(key)] = unescape(value)
      r
    }
  end

private

  def unescape(escaped)
    escaped ? ::HTTP::Message.unescape(escaped) : nil
  end

  def filter_response(res)
    if res.status == 200
      if res.oauth_params = get_oauth_response(res)
        oauth_config.token = res.oauth_params['oauth_token']
        oauth_config.secret = res.oauth_params['oauth_token_secret']
      end
    end
  end
end
