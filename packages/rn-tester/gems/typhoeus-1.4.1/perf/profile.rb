require 'typhoeus'
require 'ruby-prof'

calls = 50
base_url = "http://127.0.0.1:3000/"

RubyProf.start
calls.times do |i|
  Typhoeus::Request.get(base_url+i.to_s)
end
result = RubyProf.stop

printer = RubyProf::FlatPrinter.new(result)
printer.print(STDOUT)
