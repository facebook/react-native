#!/usr/bin/env ruby

$:.unshift(File.join('..', 'lib'))
require 'httpclient'

proxy = ENV['HTTP_PROXY']
clnt = HTTPClient.new(proxy)
clnt.set_cookie_store("cookie.dat")
target = ARGV.shift || "http://localhost/foo.cgi"

puts
puts '= GET content directly'
puts clnt.get_content(target)

puts '= GET result object'
result = clnt.get(target)
puts '== Header object'
p result.header
puts "== Content-type"
p result.contenttype
puts '== Body object'
p result.body
puts '== Content'
print result.content
puts '== GET with Block'
clnt.get(target) do |str|
  puts str
end

puts
puts '= GET with query'
puts clnt.get(target, { "foo" => "bar", "baz" => "quz" }).content

puts
puts '= GET with query 2'
puts clnt.get(target, [["foo", "bar1"], ["foo", "bar2"]]).content

clnt.debug_dev = STDERR
puts
puts '= GET with extra header'
puts clnt.get(target, nil, { "SOAPAction" => "HelloWorld" }).content

puts
puts '= GET with extra header 2'
puts clnt.get(target, nil, [["Accept", "text/plain"], ["Accept", "text/html"]]).content

clnt.debug_dev = nil

clnt.save_cookie_store
