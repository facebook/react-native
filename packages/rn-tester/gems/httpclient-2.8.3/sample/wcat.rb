#!/usr/bin/env ruby

# wcat for http-access2
# Copyright (C) 2001 TAKAHASHI Masayoshi

$:.unshift(File.join('..', 'lib'))
require 'httpclient'

if ENV['HTTP_PROXY']
  h = HTTPClient.new(ENV['HTTP_PROXY'])
else
  h = HTTPClient.new()
end

while urlstr = ARGV.shift
  response = h.get(urlstr){ |data|
    print data
  }
  p response.contenttype
  p response.peer_cert if /^https/i =~ urlstr
end
