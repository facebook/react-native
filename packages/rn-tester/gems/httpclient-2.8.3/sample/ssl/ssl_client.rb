#!/usr/bin/env ruby

$:.unshift(File.join('..', '..', 'lib'))
require 'httpclient'

url = ARGV.shift || 'https://localhost:8808/'
uri = URI.parse(url)

#ca_file = "0cert.pem"
#crl_file = '0crl.pem'

# create CA's cert in pem format and run 'c_rehash' in trust_certs dir. before
# using this.
ca_path = File.join(File.dirname(File.expand_path(__FILE__)), "trust_certs")

proxy = ENV['HTTP_PROXY'] || ENV['http_proxy'] || nil
h = HTTPClient.new(proxy)
#h.ssl_config.add_trust_ca(ca_file)
#h.ssl_config.add_crl(crl_file)
h.ssl_config.add_trust_ca(ca_path)

print h.get_content(url)
