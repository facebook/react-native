# do not override if httpclient/webagent-cookie is loaded already
unless defined?(HTTPClient::CookieManager)
begin # for catching LoadError and load webagent-cookie instead

require 'http-cookie'
require 'httpclient/util'

class HTTPClient
  class CookieManager
    include HTTPClient::Util

    attr_reader :format, :jar
    attr_accessor :cookies_file

    def initialize(cookies_file = nil, format = WebAgentSaver, jar = HTTP::CookieJar.new)
      @cookies_file = cookies_file
      @format = format
      @jar = jar
      load_cookies if @cookies_file
    end

    def load_cookies
      check_cookies_file
      @jar.clear
      @jar.load(@cookies_file, :format => @format)
    end

    def save_cookies(session = false)
      check_cookies_file
      @jar.save(@cookies_file, :format => @format, :session => session)
    end

    def cookies(uri = nil)
      cookies = @jar.cookies(uri)
      # TODO: return HTTP::Cookie in the future
      cookies.map { |cookie|
        WebAgent::Cookie.new(
          :name => cookie.name,
          :value => cookie.value,
          :domain => cookie.domain,
          :path => cookie.path,
          :origin => cookie.origin,
          :for_domain => cookie.for_domain,
          :expires => cookie.expires,
          :httponly => cookie.httponly,
          :secure => cookie.secure
        )
      }
    end

    def cookie_value(uri)
      cookies = self.cookies(uri)
      unless cookies.empty?
        HTTP::Cookie.cookie_value(cookies)
      end
    end

    def parse(value, uri)
      @jar.parse(value, uri)
    end

    def cookies=(cookies)
      @jar.clear
      cookies.each do |cookie|
        add(cookie)
      end
    end

    def add(cookie)
      @jar.add(cookie)
    end

    def find(uri)
      warning('CookieManager#find is deprecated and will be removed in near future. Use HTTP::Cookie.cookie_value(CookieManager#cookies) instead')
      if cookie = cookies(uri)
        HTTP::Cookie.cookie_value(cookie)
      end
    end

  private

    def check_cookies_file
      unless @cookies_file
        raise ArgumentError.new('Cookies file not specified')
      end
    end
  end

  class WebAgentSaver < HTTP::CookieJar::AbstractSaver
    # no option
    def default_options
      {}
    end

    # same as HTTP::CookieJar::CookiestxtSaver
    def save(io, jar)
      jar.each { |cookie|
        next if !@session && cookie.session?
        io.print cookie_to_record(cookie)
      }
    end

    # same as HTTP::CookieJar::CookiestxtSaver
    def load(io, jar)
      io.each_line { |line|
        cookie = parse_record(line) and jar.add(cookie)
      }
    end

  private

    def cookie_to_record(cookie)
      [
        cookie.origin,
        cookie.name, 
        cookie.value,
        cookie.expires.to_i,
        cookie.dot_domain,
        cookie.path,
        self.class.flag(cookie)
      ].join("\t") + "\n"
    end

    def parse_record(line)
      return nil if /\A#/ =~ line
      col = line.chomp.split(/\t/)

      origin = col[0]
      name = col[1]
      value = col[2]
      value.chomp!
      if col[3].empty? or col[3] == '0'
        expires = nil
      else
        expires = Time.at(col[3].to_i)
        return nil if expires < Time.now
      end
      domain = col[4]
      path = col[5]

      cookie = WebAgent::Cookie.new(name, value,
        :origin => origin,
        :domain => domain,
        :path => path,
        :expires => expires
      )
      self.class.set_flag(cookie, col[6].to_i)
      cookie
    end

    USE = 1
    SECURE = 2
    DOMAIN = 4
    PATH = 8
    HTTP_ONLY = 64

    def self.flag(cookie)
      flg = 0
      flg += USE # not used
      flg += SECURE  if cookie.secure?
      flg += DOMAIN  if cookie.for_domain?
      flg += HTTP_ONLY  if cookie.httponly?
      flg += PATH  if cookie.path # not used
      flg
    end

    def self.set_flag(cookie, flag)
      cookie.secure = true if flag & SECURE > 0
      cookie.for_domain = true if flag & DOMAIN > 0
      cookie.httponly = true if flag & HTTP_ONLY > 0
    end
  end
end

# for backward compatibility
class WebAgent
  CookieManager = ::HTTPClient::CookieManager

  class Cookie < HTTP::Cookie
    include HTTPClient::Util

    def url
      deprecated('url', 'origin')
      self.origin
    end

    def url=(url)
      deprecated('url=', 'origin=')
      self.origin = url
    end

    def http_only?
      deprecated('http_only?', 'httponly?')
      self.httponly?
    end

    alias original_domain domain

    def domain
      warning('Cookie#domain returns dot-less domain name now. Use Cookie#dot_domain if you need "." at the beginning.')
      self.original_domain
    end

    def flag
      deprecated('flag', 'secure, for_domain, etc.')
      HTTPClient::WebAgentSaver.flag(self)
    end

  private

    def deprecated(old, new)
      warning("WebAgent::Cookie is deprecated and will be replaced with HTTP::Cookie in the near future. Please use Cookie##{new} instead of Cookie##{old} for the replacement.")
    end
  end
end

rescue LoadError
  require 'httpclient/webagent-cookie'
end
end
