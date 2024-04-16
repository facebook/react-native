#!/usr/bin/env ruby

require 'webrick/https'
require 'getopts'

getopts nil, 'r:', 'p:8808'

dir = File::dirname(File::expand_path(__FILE__))

# Pass phrase of '1000key.pem' is '1000'.
data = open(File::join(dir, "1000key.pem")){|io| io.read }
pkey = OpenSSL::PKey::RSA.new(data)
data = open(File::join(dir, "1000cert.pem")){|io| io.read }
cert = OpenSSL::X509::Certificate.new(data)

s = WEBrick::HTTPServer.new(
  :BindAddress      => "localhost",
  :Port             => $OPT_p.to_i, 
  :Logger           => nil,
  :DocumentRoot     => $OPT_r || File::join(dir, "/htdocs"),
  :SSLEnable        => true,
  :SSLVerifyClient  => ::OpenSSL::SSL::VERIFY_NONE,
  :SSLCertificate   => cert,
  :SSLPrivateKey    => pkey,
  :SSLCertName      => nil,
  :SSLCACertificateFile => "all.pem"
)
trap("INT"){ s.shutdown }
s.start
