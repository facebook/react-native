require 'httpclient'

c = HTTPClient.new
c.debug_dev = STDOUT

# for Proxy authentication: supports Basic, Negotiate and NTLM.
#c.set_proxy_auth("admin", "admin")

# for WWW authentication: supports Basic, Digest and Negotiate.
c.set_auth("http://dev.ctor.org/http-access2/", "user", "user")
p c.get("http://dev.ctor.org/http-access2/login")
