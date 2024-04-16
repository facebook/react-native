# encoding: utf-8
# frozen_string_literal: true
require 'ethon'
require 'open-uri'
require 'patron'
require 'curb'
require 'net/http'
require 'cgi'
require 'benchmark/ips'

require_relative '../spec/support/server'
require_relative '../spec/support/localhost_server'

LocalhostServer.new(TESTSERVER.new, 3000)
LocalhostServer.new(TESTSERVER.new, 3001)
LocalhostServer.new(TESTSERVER.new, 3002)

url = 'http://localhost:3000/'.freeze
uri = URI.parse('http://localhost:3000/').freeze
ethon = Ethon::Easy.new(url: url)
patron = Patron::Session.new
patron_url = Patron::Session.new(base_url: url)
curb = Curl::Easy.new(url)

puts '[Creation]'
Benchmark.ips do |x|
  x.report('String.new') { '' }
  x.report('Easy.new') { Ethon::Easy.new }
end

puts '[Escape]'
Benchmark.ips do |x|
  x.report('CGI.escape') { CGI.escape("まつもと") }
  x.report('Easy.escape') { ethon.escape("まつもと") }
end

puts '[Requests]'
Benchmark.ips do |x|
  x.report('net/http') { Net::HTTP.get_response(uri) }
  x.report('open-uri') { open url }

  x.report('patron') do
    patron.base_url = url
    patron.get('/')
  end

  x.report('patron reuse') { patron_url.get('/') }

  x.report('curb') do
    curb.url = url
    curb.perform
  end

  x.report('curb reuse') { curb.perform }

  x.report('Easy.perform') do
    ethon.url = url
    ethon.perform
  end

  x.report('Easy.perform reuse') { ethon.perform }
end

puts "[ 4 delayed Requests ]"
Benchmark.ips do |x|
  x.report('net/http') do
    3.times do |i|
      uri = URI.parse("http://localhost:300#{i}/?delay=1")
      Net::HTTP.get_response(uri)
    end
  end

  x.report("open-uri") do
    3.times do |i|
      open("http://localhost:300#{i}/?delay=1")
    end
  end

  x.report("patron") do
    sess = Patron::Session.new
    3.times do |i|
      sess.base_url = "http://localhost:300#{i}/?delay=1"
      sess.get("/")
    end
  end

  x.report("Easy.perform") do
    easy = Ethon::Easy.new
    3.times do |i|
      easy.url = "http://localhost:300#{i}/?delay=1"
      easy.perform
    end
  end

  x.report("Multi.perform") do
    multi = Ethon::Multi.new
    3.times do |i|
      easy = Ethon::Easy.new
      easy.url = "http://localhost:300#{i}/?delay=1"
      multi.add(easy)
    end
    multi.perform
  end
end
