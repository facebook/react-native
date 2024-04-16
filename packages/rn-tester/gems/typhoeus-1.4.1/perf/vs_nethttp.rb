require 'typhoeus'
require 'net/http'
require 'open-uri'
require 'benchmark'

URL = "http://localhost:300"
hydra = Typhoeus::Hydra.new(max_concurrency: 3)

if defined? require_relative
  require_relative '../spec/support/localhost_server.rb'
  require_relative '../spec/support/server.rb'
else
  require '../spec/support/localhost_server.rb'
  require '../spec/support/server.rb'
end
LocalhostServer.new(TESTSERVER.new, 3000)
LocalhostServer.new(TESTSERVER.new, 3001)
LocalhostServer.new(TESTSERVER.new, 3002)

def url_for(i)
  "#{URL}#{i%3}/"
end

Benchmark.bm do |bm|

  [1000].each do |calls|
    puts "[ #{calls} requests ]"

    bm.report("net/http        ") do
      calls.times do |i|
        uri = URI.parse(url_for(i))
        Net::HTTP.get_response(uri)
      end
    end

    bm.report("open            ") do
      calls.times do |i|
        open(url_for(i))
      end
    end

    bm.report("request         ") do
      calls.times do |i|
        Typhoeus::Request.get(url_for(i))
      end
    end

    bm.report("hydra           ") do
      calls.times do |i|
        hydra.queue(Typhoeus::Request.new(url_for(i)))
      end
      hydra.run
    end

    bm.report("hydra memoize   ") do
      Typhoeus::Config.memoize = true
      calls.times do |i|
        hydra.queue(Typhoeus::Request.new(url_for(i)))
      end
      hydra.run
      Typhoeus::Config.memoize = false
    end
  end
end
