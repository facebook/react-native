require 'webrick/https'
require 'logger'
require 'rbconfig'

PORT = 17171
DIR = File.dirname(File.expand_path(__FILE__))

def cert(filename)
  OpenSSL::X509::Certificate.new(File.open(File.join(DIR, filename)) { |f|
    f.read
  })
end

def key(filename)
  OpenSSL::PKey::RSA.new(File.open(File.join(DIR, filename)) { |f|
    f.read
  })
end

def do_hello(req, res)
  res['content-type'] = 'text/html'
  res.body = "hello"
end

logger = Logger.new(STDERR)
logger.level = Logger::Severity::FATAL	# avoid logging SSLError (ERROR level)

server = WEBrick::HTTPServer.new(
  :BindAddress => "localhost",
  :Logger => logger,
  :Port => PORT,
  :AccessLog => [],
  :DocumentRoot => DIR,
  :SSLEnable => true,
  :SSLCACertificateFile => File.join(DIR, 'ca.cert'),
  :SSLCertificate => cert('server.cert'),
  :SSLPrivateKey => key('server.key'),
  :SSLVerifyClient => nil, #OpenSSL::SSL::VERIFY_FAIL_IF_NO_PEER_CERT|OpenSSL::SSL::VERIFY_PEER,
  :SSLClientCA => cert('ca.cert'),
  :SSLCertName => nil
)
trap(:INT) do
  server.shutdown
end
[:hello].each do |sym|
  server.mount(
    "/#{sym}",
    WEBrick::HTTPServlet::ProcHandler.new(method("do_#{sym}").to_proc)
  )
end

t = Thread.new {
  Thread.current.abort_on_exception = true
  server.start
}
while server.status != :Running
  sleep 0.1
  unless t.alive?
    t.join
    raise
  end
end
STDOUT.sync = true
puts $$
t.join
