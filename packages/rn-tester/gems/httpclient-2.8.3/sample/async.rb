require 'httpclient'

c = HTTPClient.new
conn = c.get_async("http://dev.ctor.org/")
io = conn.pop.content
while str = io.read(40)
  p str
end
