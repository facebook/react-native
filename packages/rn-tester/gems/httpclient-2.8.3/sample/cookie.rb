#!/usr/bin/env ruby

$:.unshift(File.join('..', 'lib'))
require 'httpclient'

proxy = ENV['HTTP_PROXY']
clnt = HTTPClient.new(proxy)
clnt.set_cookie_store("cookie.dat")
clnt.debug_dev = STDOUT if $DEBUG

while urlstr = ARGV.shift
  response = clnt.get(urlstr){ |data|
    print data
  }
  p response.contenttype
end

clnt.save_cookie_store
