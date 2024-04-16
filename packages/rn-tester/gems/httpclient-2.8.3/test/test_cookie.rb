require 'test/unit'
require 'uri'
require 'tempfile'

require 'httpclient/util'
require 'httpclient/cookie'

class TestCookie < Test::Unit::TestCase
  include HTTPClient::Util

  def setup()
    @c = WebAgent::Cookie.new('hoge', 'funi')
  end

  def test_s_new()
    assert_instance_of(WebAgent::Cookie, @c)
  end
end

class TestCookieManager < Test::Unit::TestCase
  include HTTPClient::Util

  def setup()
    @cm = WebAgent::CookieManager.new()
  end

  def teardown()
  end
  
  def test_parse()
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; expires=Wed, 01-Dec-2999 00:00:00 GMT; path=/"
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(Time.gm(2999, 12, 1, 0,0,0), cookie.expires)
    assert_equal("/", cookie.path)
  end

  def test_parse2()
    str = "xmen=off,0,0,1; path=/; domain=.excite.co.jp; expires=Wednesday, 31-Dec-2037 12:00:00 GMT"
    @cm.parse(str, urify('http://www.excite.co.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("xmen", cookie.name)
    assert_equal("off,0,0,1", cookie.value)
    assert_equal("/", cookie.path)
    assert_equal("excite.co.jp", cookie.domain)
    assert_equal(".excite.co.jp", cookie.dot_domain)
    assert_equal(Time.gm(2037,12,31,12,0,0), cookie.expires)
  end

  def test_parse3()
    str = "xmen=off,0,0,1; path=/; domain=.excite.co.jp; expires=Wednesday, 31-Dec-2037 12:00:00 GMT;Secure;HTTPOnly"
    @cm.parse(str, urify('http://www.excite.co.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("xmen", cookie.name)
    assert_equal("off,0,0,1", cookie.value)
    assert_equal("/", cookie.path)
    assert_equal("excite.co.jp", cookie.domain)
    assert_equal(".excite.co.jp", cookie.dot_domain)
    assert_equal(Time.gm(2037,12,31,12,0,0), cookie.expires)
    assert_equal(true, cookie.secure?)
    assert_equal(true, cookie.http_only?)
  end
  
  def test_parse_double_semicolon()
    str = "xmen=off,0,0,1;; path=\"/;;\"; domain=.excite.co.jp; expires=Wednesday, 31-Dec-2037 12:00:00 GMT"
    @cm.parse(str, urify('http://www.excite.co.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("xmen", cookie.name)
    assert_equal("off,0,0,1", cookie.value)
    assert_equal("/;;", cookie.path)
    assert_equal("excite.co.jp", cookie.domain)
    assert_equal(".excite.co.jp", cookie.dot_domain)
    assert_equal(Time.gm(2037,12,31,12,0,0), cookie.expires)
  end

#  def test_make_portlist()
#    assert_equal([80,8080], @cm.instance_eval{make_portlist("80,8080")})
#    assert_equal([80], @cm.instance_eval{make_portlist("80")})
#    assert_equal([80,8080,10080], @cm.instance_eval{make_portlist(" 80, 8080, 10080 \n")})
#  end

  def test_check_expired_cookies()
    format = "%a, %d-%b-%Y %H:%M:%S GMT"
    c1 = WebAgent::Cookie.new('hoge1', 'funi', :domain => 'http://www.example.com/', :path => '/')
    c2 = WebAgent::Cookie.new('hoge2', 'funi', :domain => 'http://www.example.com/', :path => '/')
    c3 = WebAgent::Cookie.new('hoge3', 'funi', :domain => 'http://www.example.com/', :path => '/')
    c4 = WebAgent::Cookie.new('hoge4', 'funi', :domain => 'http://www.example.com/', :path => '/')
    c1.expires = (Time.now - 100).gmtime.strftime(format)
    c2.expires = (Time.now + 100).gmtime.strftime(format)
    c3.expires = (Time.now - 10).gmtime.strftime(format)
    c4.expires = nil
    cookies = [c1,c2,c3,c4]
    @cm.cookies = cookies
    assert_equal(c2.name, @cm.cookies[0].name)
    assert_equal(c2.expires, @cm.cookies[0].expires)
    assert_equal(c4.name, @cm.cookies[1].name)
    assert_equal(c4.expires, @cm.cookies[1].expires)
  end

  def test_parse_expires
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; expires=; path=/"
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(nil, cookie.expires)
    assert_equal("/", cookie.path)
    #
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; path=/; expires="
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(nil, cookie.expires)
    assert_equal("/", cookie.path)
    #
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; path=/; expires=\"\""
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(nil, cookie.expires)
    assert_equal("/", cookie.path)
  end

  def test_parse_after_expiration
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; expires=Wed, 01-Dec-2999 00:00:00 GMT; path=/"
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(Time.gm(2999, 12, 1, 0,0,0), cookie.expires)
    assert_equal("/", cookie.path)

    time = Time.at(Time.now.to_i + 60).utc
    expires = time.strftime("%a, %d-%b-%Y %H:%M:%S GMT")
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; expires=#{expires}; path=/"
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(time, cookie.expires)
    assert_equal("/", cookie.path)
  end

  def test_find_cookie()
    str = "xmen=off,0,0,1; path=/; domain=.excite2.co.jp; expires=Wednesday, 31-Dec-2037 12:00:00 GMT"
    @cm.parse(str, urify("http://www.excite2.co.jp/"))

    str = "xmen=off,0,0,2; path=/; domain=.excite.co.jp; expires=Wednesday, 31-Dec-2037 12:00:00 GMT"
    @cm.parse(str, urify("http://www.excite.co.jp/"))

    url = urify('http://www.excite.co.jp/hoge/funi/')
    cookie_str = @cm.find(url)
    assert_equal("xmen=\"off,0,0,2\"", cookie_str)
  end

  def test_load_cookies()
    cookiefile = Tempfile.new('test_cookie')
    File.open(cookiefile.path, 'w') do |f|
      f.write <<EOF
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	NGUserID	d29b8f49-10875-992421294-1	2145801600	www.zdnet.co.jp	/	9	0			
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	PACK	zd3-992421294-7436	2293839999	.zdnet.co.jp	/	13	0			
http://example.org/	key	value	0	.example.org	/	13	0			
http://example.org/	key	value		.example.org	/	13	0			
EOF
    end

    @cm.cookies_file = cookiefile.path
    @cm.load_cookies()
    c0, c1, c2 = @cm.cookies
    assert_equal('http://www.zdnet.co.jp/news/0106/08/e_gibson.html', c0.url.to_s)
    assert_equal('NGUserID', c0.name)
    assert_equal('d29b8f49-10875-992421294-1', c0.value)
    assert_equal(Time.at(2145801600), c0.expires)
    assert_equal('www.zdnet.co.jp', c0.domain)
    assert_equal('/', c0.path)
    assert_equal(9, c0.flag)
    #
    assert_equal('http://www.zdnet.co.jp/news/0106/08/e_gibson.html', c1.url.to_s)
    assert_equal('PACK', c1.name)
    assert_equal('zd3-992421294-7436', c1.value)
    assert_equal(Time.at(2293839999), c1.expires)
    assert_equal('zdnet.co.jp', c1.domain)
    assert_equal('.zdnet.co.jp', c1.dot_domain)
    assert_equal('/', c1.path)
    assert_equal(13, c1.flag)
    #
    assert_equal(nil, c2.expires)
  end

  def test_save_cookie()
    str = <<EOF
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	NGUserID	d29b8f49-10875-992421294-1	2145801600	www.zdnet.co.jp	/	9
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	PACK	zd3-992421294-7436	2145801600	.zdnet.co.jp	/	13
EOF
    cookiefile = Tempfile.new('test_cookie')
    cookiefile2 = Tempfile.new('test_cookie2')
    File.open(cookiefile.path, 'w') do |f|
      f.write str
    end

    @cm.cookies_file = cookiefile.path
    @cm.load_cookies()
    @cm.instance_eval{@is_saved = false}
    @cm.cookies_file = cookiefile2.path
    @cm.save_cookies()
    str2 = ''
    File.open(cookiefile2.path, 'r') do |f|
      str2 = f.read
    end
    assert_equal(str.split.sort, str2.split.sort)
    assert(File.exist?(cookiefile2.path))
    File.unlink(cookiefile2.path)
    @cm.save_cookies()
    assert(File.exist?(cookiefile2.path))
  end

  def test_not_saved_expired_cookies
    cookiefile = Tempfile.new('test_cookie')
    @cm.cookies_file = cookiefile.path
    uri = urify('http://www.example.org')
    @cm.parse("foo=1; path=/", uri)
    @cm.parse("bar=2; path=/; expires=", uri)
    @cm.parse("baz=3; path=/; expires=\"\"", uri)
    @cm.parse("qux=4; path=/; expires=#{(Time.now.gmtime + 10).asctime}", uri)
    @cm.parse("quxx=5; path=/; expires=#{(Time.now.gmtime - 10).asctime}", uri)
    @cm.save_cookies
    @cm.load_cookies
    assert_equal(1, @cm.cookies.size) # +10 cookies only
  end

  def test_add()
    c = WebAgent::Cookie.new('hoge', 'funi')
    c.url = urify("http://www.inac.co.jp/hoge")
    @cm.add(c)
    c = @cm.cookies[0]
    assert_equal('hoge', c.name)
    assert_equal('funi', c.value)
    assert_equal(nil, c.expires)
  end

  def test_add2()
    c = WebAgent::Cookie.new('hoge', 'funi')
    c.path = ''
    c.url = urify("http://www.inac.co.jp/hoge/hoge2/hoge3")
    @cm.add(c)
    #
    c = WebAgent::Cookie.new('hoge', 'funi')
    #c.path = '' NO path given -> same as URL
    c.url = urify("http://www.inac.co.jp/hoge/hoge2/hoge3")
    @cm.add(c)
    #
    c1, c2 = @cm.cookies
    assert_equal('/hoge/hoge2/', c1.path)
    assert_equal('/', c2.path)
  end

  def test_keep_escaped
    uri = urify('http://www.example.org')

    @cm.parse("bar=2; path=/", uri)
    c = @cm.cookies.first
    assert_equal('2', c.value)
    assert_equal('bar=2', @cm.find(uri))

    @cm.parse("bar=\"2\"; path=/", uri)
    c = @cm.cookies.first
    assert_equal('2', c.value)
    assert_equal('bar=2', @cm.find(uri))

    @cm.parse("bar=; path=/", uri)
    c = @cm.cookies.first
    assert_equal('', c.value)
    assert_equal('bar=', @cm.find(uri))

    @cm.parse("bar=\"\"; path=/", uri)
    c = @cm.cookies.first
    assert_equal('', c.value)
    assert_equal('bar=', @cm.find(uri))
  end

  def test_load_cookies_escaped
    uri = urify('http://example.org/')
    f = Tempfile.new('test_cookie')
    File.open(f.path, 'w') do |out|
      out.write <<EOF
http://example.org/	key1	"value"	0	.example.org	/	13	0			
http://example.org/	key2	""	0	.example.org	/	13	0			
http://example.org/	key3		0	.example.org	/	13	0			
EOF
    end
    @cm.cookies_file = f.path
    @cm.load_cookies
    c0, c1, c2 = @cm.cookies
    assert_equal('"value"', c0.value)
    assert_equal('""', c1.value)
    assert_equal('', c2.value)
    assert_equal('key1="\\"value\\""; key2="\\"\\""; key3=', @cm.find(uri))
  end

end
