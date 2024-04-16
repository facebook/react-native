# HTTPAccess2 - HTTP accessing library.
# Copyright (C) 2000-2007  NAKAMURA, Hiroshi  <nakahiro@sarion.co.jp>.

# This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
# redistribute it and/or modify it under the same terms of Ruby's license;
# either the dual license version in 2003, or any later version.

# http-access2.rb is based on http-access.rb in http-access/0.0.4.  Some
# part of it is copyrighted by Maebashi-san who made and published
# http-access/0.0.4.  http-access/0.0.4 did not include license notice but
# when I asked Maebashi-san he agreed that I can redistribute it under the
# same terms of Ruby.  Many thanks to Maebashi-san.


require 'httpclient'


module HTTPAccess2
  VERSION = ::HTTPClient::VERSION
  RUBY_VERSION_STRING = ::HTTPClient::RUBY_VERSION_STRING
  SSLEnabled = ::HTTPClient::SSLEnabled
  SSPIEnabled = ::HTTPClient::SSPIEnabled
  DEBUG_SSL = true

  Util = ::HTTPClient::Util

  class Client < ::HTTPClient
    class RetryableResponse < StandardError
    end
  end

  SSLConfig = ::HTTPClient::SSLConfig
  BasicAuth = ::HTTPClient::BasicAuth
  DigestAuth = ::HTTPClient::DigestAuth
  NegotiateAuth = ::HTTPClient::NegotiateAuth
  AuthFilterBase = ::HTTPClient::AuthFilterBase
  WWWAuth = ::HTTPClient::WWWAuth
  ProxyAuth = ::HTTPClient::ProxyAuth
  Site = ::HTTPClient::Site
  Connection = ::HTTPClient::Connection
  SessionManager = ::HTTPClient::SessionManager
  SSLSocketWrap = ::HTTPClient::SSLSocket
  DebugSocket = ::HTTPClient::DebugSocket

  class Session < ::HTTPClient::Session
    class Error < StandardError
    end
    class InvalidState < Error
    end
    class BadResponse < Error
    end
    class KeepAliveDisconnected < Error
    end
  end
end
