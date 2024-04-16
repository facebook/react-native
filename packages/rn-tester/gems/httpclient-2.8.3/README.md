httpclient - HTTP accessing library.  [![Gem Version](https://badge.fury.io/rb/httpclient.svg)](http://badge.fury.io/rb/httpclient)

Copyright (C) 2000-2015  NAKAMURA, Hiroshi  <nahi@ruby-lang.org>.

'httpclient' gives something like the functionality of libwww-perl (LWP) in
Ruby.  'httpclient' formerly known as 'http-access2'.

See [HTTPClient](http://www.rubydoc.info/gems/httpclient/frames) for documentation.


## Features

* methods like GET/HEAD/POST/* via HTTP/1.1.
* HTTPS(SSL), Cookies, proxy, authentication(Digest, NTLM, Basic), etc.
* asynchronous HTTP request, streaming HTTP request.
* debug mode CLI.
* by contrast with net/http in standard distribution;
  * Cookies support
  * MT-safe
  * streaming POST (POST with File/IO)
  * Digest auth
  * Negotiate/NTLM auth for WWW-Authenticate (requires net/ntlm module; rubyntlm gem)
  * NTLM auth for Proxy-Authenticate (requires 'win32/sspi' module; rubysspi gem)
  * extensible with filter interface
  * you don't have to care HTTP/1.1 persistent connection
    (httpclient cares instead of you)
* Not supported now
  * Cache
  * Rather advanced HTTP/1.1 usage such as Range, deflate, etc.
    (of course you can set it in header by yourself)

## httpclient command

Usage: 1) `httpclient get https://www.google.co.jp/?q=ruby`  
Usage: 2) `httpclient`

For 1) it issues a GET request to the given URI and shows the wiredump and
the parsed result.  For 2) it invokes irb shell with the binding that has a
HTTPClient as 'self'.  You can call HTTPClient instance methods like;

```ruby
get "https://www.google.co.jp/", :q => :ruby
```

## Author

 * Name:: Hiroshi Nakamura
 * E-mail:: nahi@ruby-lang.org
 * Project web site:: http://github.com/nahi/httpclient


## License

This program is copyrighted free software by NAKAMURA, Hiroshi.  You can
redistribute it and/or modify it under the same terms of Ruby's license;
either the dual license version in 2003, or any later version.

httpclient/session.rb is based on http-access.rb in http-access/0.0.4.  Some
part of it is copyrighted by Maebashi-san who made and published
http-access/0.0.4.  http-access/0.0.4 did not include license notice but when
I asked Maebashi-san he agreed that I can redistribute it under the same terms
of Ruby.  Many thanks to Maebashi-san.


## Install

You can install httpclient via rubygems: `gem install httpclient`


## Usage

See [HTTPClient](http://www.rubydoc.info/gems/httpclient/frames) for documentation.
You can also check sample/howto.rb how to use APIs.

## Bug report or Feature request

Please file a ticket at the project web site.

1. find a similar ticket from https://github.com/nahi/httpclient/issues
2. create a new ticket by clicking 'Create Issue' button.
3. you can use github features such as pull-request if you like.

## Changes

See [ChangeLog](https://github.com/nahi/httpclient/blob/master/CHANGELOG.md)
