require 'test/unit'
require 'uri'
require 'tempfile'

# This testcase is located for reference, not for running.
if false

require 'httpclient/webagent-cookie'

class TestCookie < Test::Unit::TestCase
  include HTTPClient::Util

  def setup()
    @c = WebAgent::Cookie.new()
  end

  def test_s_new()
    assert_instance_of(WebAgent::Cookie, @c)
  end

  def test_discard?
    assert_equal(false, !!(@c.discard?))
    @c.discard = true
    assert_equal(true, !!(@c.discard?))
  end

  def test_match()
    url = urify('http://www.rubycolor.org/hoge/funi/#919191')

    @c.domain = 'www.rubycolor.org'
    assert_equal(true, @c.match?(url))

    @c.domain = '.rubycolor.org'
    assert_equal(true, @c.match?(url))

    @c.domain = 'aaa.www.rubycolor.org'
    assert_equal(false, @c.match?(url))

    @c.domain = 'aaa.www.rubycolor.org'
    assert_equal(false, @c.match?(url))

    @c.domain = 'www.rubycolor.org'
    @c.path = '/'
    assert_equal(true, @c.match?(url))

    @c.domain = 'www.rubycolor.org'
    @c.path = '/hoge'
    assert_equal(true, @c.match?(url))

    @c.domain = 'www.rubycolor.org'
    @c.path = '/hoge/hoge'
    assert_equal(false, @c.match?(url))

    @c.domain = 'www.rubycolor.org'
    @c.path = '/hoge'
    @c.secure = true
    assert_equal(false, @c.match?(url))

    url2 = urify('https://www.rubycolor.org/hoge/funi/#919191')
    @c.domain = 'www.rubycolor.org'
    @c.path = '/hoge'
    @c.secure = true
    assert_equal(true, @c.match?(url2))

    @c.domain = 'www.rubycolor.org'
    @c.path = '/hoge'
    @c.secure = nil
    assert_equal(true, @c.match?(url2)) ## not false!

    url.port = 80
    @c.domain = 'www.rubycolor.org'
    @c.path = '/hoge'
#    @c.port = [80,8080]
    assert_equal(true, @c.match?(url))

    url_nopath = URI.parse('http://www.rubycolor.org')
    @c.domain = 'www.rubycolor.org'
    @c.path = '/'
    assert_equal(true, @c.match?(url_nopath))

  end

  def test_head_match?()
    assert_equal(true, @c.head_match?("",""))
    assert_equal(false, @c.head_match?("a",""))
    assert_equal(true, @c.head_match?("","a"))
    assert_equal(true, @c.head_match?("abcde","abcde"))
    assert_equal(true, @c.head_match?("abcde","abcdef"))
    assert_equal(false, @c.head_match?("abcdef","abcde"))
    assert_equal(false, @c.head_match?("abcde","bcde"))
    assert_equal(false, @c.head_match?("bcde","abcde"))
  end

  def test_tail_match?()
    assert_equal(true, @c.tail_match?("",""))
    assert_equal(false, @c.tail_match?("a",""))
    assert_equal(true, @c.tail_match?("","a"))
    assert_equal(true, @c.tail_match?("abcde","abcde"))
    assert_equal(false, @c.tail_match?("abcde","abcdef"))
    assert_equal(false, @c.tail_match?("abcdef","abcde"))
    assert_equal(false, @c.tail_match?("abcde","bcde"))
    assert_equal(true, @c.tail_match?("bcde","abcde"))
  end


  def test_domain_match()
    extend WebAgent::CookieUtils
    assert_equal(true, !!domain_match("hoge.co.jp","."))
#    assert_equal(true, !!domain_match("locahost",".local"))
    assert_equal(true, !!domain_match("192.168.10.1","192.168.10.1"))
    assert_equal(false, !!domain_match("192.168.10.1","192.168.10.2"))
#    assert_equal(false, !!domain_match("hoge.co.jp",".hoge.co.jp"))
    # allows; host == rubyforge.org, domain == .rubyforge.org
    assert_equal(true, !!domain_match("hoge.co.jp",".hoge.co.jp"))
    assert_equal(true, !!domain_match("www.hoge.co.jp", "www.hoge.co.jp"))
    assert_equal(false, !!domain_match("www.hoge.co.jp", "www2.hoge.co.jp"))
    assert_equal(true, !!domain_match("www.hoge.co.jp", ".hoge.co.jp"))
    assert_equal(true, !!domain_match("www.aa.hoge.co.jp", ".hoge.co.jp"))
    assert_equal(false, !!domain_match("www.hoge.co.jp", "hoge.co.jp"))
  end

  def test_join_quotedstr()
    arr1 = ['hoge=funi', 'hoge2=funi2']
    assert_equal(arr1, @c.instance_eval{join_quotedstr(arr1,';')})
    arr2 = ['hoge="fu', 'ni"',  'funi=funi']
    assert_equal(['hoge="fu;ni"','funi=funi'],
		 @c.instance_eval{join_quotedstr(arr2,';')})
    arr3 = ['hoge="funi";hoge2="fu','ni2";hoge3="hoge"',  'funi="funi"']
    assert_equal(['hoge="funi";hoge2="fu,ni2";hoge3="hoge"',  'funi="funi"'],
		 @c.instance_eval{join_quotedstr(arr3,',')})
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
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; expires=Wed, 01-Dec-2010 00:00:00 GMT; path=/"
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(Time.gm(2010, 12, 1, 0,0,0), cookie.expires)
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
    assert_equal(".excite.co.jp", cookie.domain)
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
    assert_equal(".excite.co.jp", cookie.domain)
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
    assert_equal(".excite.co.jp", cookie.domain)
    assert_equal(Time.gm(2037,12,31,12,0,0), cookie.expires)
  end

#  def test_make_portlist()
#    assert_equal([80,8080], @cm.instance_eval{make_portlist("80,8080")})
#    assert_equal([80], @cm.instance_eval{make_portlist("80")})
#    assert_equal([80,8080,10080], @cm.instance_eval{make_portlist(" 80, 8080, 10080 \n")})
#  end

  def test_check_expired_cookies()
    c1 = WebAgent::Cookie.new()
    c2 = c1.dup
    c3 = c1.dup
    c4 = c1.dup
    c1.expires = Time.now - 100
    c2.expires = Time.now + 100
    c3.expires = Time.now - 10
    c4.expires = nil
    cookies = [c1,c2,c3,c4]
    @cm.cookies = cookies
    @cm.check_expired_cookies()
    # expires == nil cookies (session cookie) exists.
    assert_equal([c2,c4], @cm.cookies)
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
    str = "inkid=n92b0ADOgACIgUb9lsjHqAAAHu2a; expires=Wed, 01-Dec-2010 00:00:00 GMT; path=/"
    @cm.parse(str, urify('http://www.test.jp'))
    cookie = @cm.cookies[0]
    assert_instance_of(WebAgent::Cookie, cookie)
    assert_equal("inkid", cookie.name)
    assert_equal("n92b0ADOgACIgUb9lsjHqAAAHu2a", cookie.value)
    assert_equal(Time.gm(2010, 12, 1, 0,0,0), cookie.expires)
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

    @cm.cookies[0].use = true
    @cm.cookies[1].use = true

    url = urify('http://www.excite.co.jp/hoge/funi/')
    cookie_str = @cm.find(url)
    assert_equal("xmen=off,0,0,2", cookie_str)
  end

  def test_load_cookies()
    begin
      File.open("tmp_test.tmp","w") {|f|
	f.write <<EOF
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	NGUserID	d29b8f49-10875-992421294-1	2145801600	www.zdnet.co.jp	/	9	0			
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	PACK	zd3-992421294-7436	1293839999	.zdnet.co.jp	/	13	0			
http://example.org/	key	value	0	.example.org	/	13	0			
http://example.org/	key	value		.example.org	/	13	0			
EOF
      }

      @cm.cookies_file = 'tmp_test.tmp'
      @cm.load_cookies()
      c0, c1, c2, c3 = @cm.cookies
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
      assert_equal(Time.at(1293839999), c1.expires)
      assert_equal('.zdnet.co.jp', c1.domain)
      assert_equal('/', c1.path)
      assert_equal(13, c1.flag)
      #
      assert_equal(nil, c2.expires)
      assert_equal(nil, c3.expires) # allow empty 'expires' (should not happen)
    ensure
      File.unlink("tmp_test.tmp")
    end
  end

  def test_save_cookie()
    str = <<EOF
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	NGUserID	d29b8f49-10875-992421294-1	2145801600	www.zdnet.co.jp	/	9
http://www.zdnet.co.jp/news/0106/08/e_gibson.html	PACK	zd3-992421294-7436	2145801600	.zdnet.co.jp	/	13
EOF
    begin
      File.open("tmp_test.tmp","w") {|f|
	f.write str
      }
      @cm.cookies_file = 'tmp_test.tmp'
      @cm.load_cookies()
      @cm.instance_eval{@is_saved = false}
      @cm.cookies_file = 'tmp_test2.tmp'
      @cm.save_cookies()
      str2 = ''
      File.open("tmp_test2.tmp","r") {|f|
	str2 = f.read()
      }
      assert_equal(str, str2)
      #
      assert(File.exist?('tmp_test2.tmp'))
      File.unlink("tmp_test2.tmp")
      @cm.save_cookies()
      assert(!File.exist?('tmp_test2.tmp'))
      @cm.save_cookies(true)
      assert(File.exist?('tmp_test2.tmp'))
    ensure
      File.unlink("tmp_test.tmp")
      if FileTest.exist?("tmp_test2.tmp")
	File.unlink("tmp_test2.tmp")
      end
    end
  end

  def test_not_saved_expired_cookies
    begin
      @cm.cookies_file = 'tmp_test.tmp'
      uri = urify('http://www.example.org')
      @cm.parse("foo=1; path=/", uri)
      @cm.parse("bar=2; path=/; expires=", uri)
      @cm.parse("baz=3; path=/; expires=\"\"", uri)
      @cm.parse("qux=4; path=/; expires=#{(Time.now + 10).asctime}", uri)
      @cm.parse("quxx=5; path=/; expires=#{(Time.now - 10).asctime}", uri)
      @cm.save_cookies()
      @cm.load_cookies
      assert_equal(1, @cm.cookies.size) # +10 cookies only
    ensure
      File.unlink("tmp_test.tmp") if File.exist?("tmp_test.tmp")
    end
  end

  def test_add()
    c = WebAgent::Cookie.new()
    c.name = "hoge"
    c.value = "funi"
    c.url = urify("http://www.inac.co.jp/hoge")
    @cm.add(c)
    c = @cm.cookies[0]
    assert_equal('hoge', c.name)
    assert_equal('funi', c.value)
    assert_equal(nil, c.expires)
  end

  def test_add2()
    c = WebAgent::Cookie.new()
    c.name = "hoge"
    c.value = "funi"
    c.path = ''
    c.url = urify("http://www.inac.co.jp/hoge/hoge2/hoge3")
    @cm.add(c)
    #
    c = WebAgent::Cookie.new()
    c.name = "hoge"
    c.value = "funi"
    #c.path = '' NO path given -> same as URL
    c.url = urify("http://www.inac.co.jp/hoge/hoge2/hoge3")
    @cm.add(c)
    #
    c1, c2 = @cm.cookies
    assert_equal('', c1.path)
    assert_equal('/hoge/hoge2', c2.path)
  end

  def test_check_cookie_accept_domain()
    @cm.accept_domains = [".example1.co.jp", "www1.example.jp"]
    @cm.reject_domains = [".example2.co.jp", "www2.example.jp"]
    check1 = @cm.check_cookie_accept_domain("www.example1.co.jp")
    assert_equal(true, check1)
    check2 = @cm.check_cookie_accept_domain("www.example2.co.jp")
    assert_equal(false, check2)
    check3 = @cm.check_cookie_accept_domain("www1.example.jp")
    assert_equal(true, check3)
    check4 = @cm.check_cookie_accept_domain("www2.example.jp")
    assert_equal(false, check4)
    check5 = @cm.check_cookie_accept_domain("aa.www2.example.jp")
    assert_equal(true, check5)
    check6 = @cm.check_cookie_accept_domain("aa.www2.example.jp")
    assert_equal(true, check6)
    assert_equal(false, @cm.check_cookie_accept_domain(nil))
  end

  def test_escaped
    uri = urify('http://www.example.org')

    @cm.parse("bar=2; path=/", uri)
    c = @cm.cookies.first
    assert_equal('2', c.value)
    assert_equal('bar=2', @cm.find(uri))

    @cm.parse("bar=2; path=/", uri)
    c = @cm.cookies.first
    assert_equal('2', c.value)
    assert_equal('bar=2', @cm.find(uri))

    @cm.parse("bar=; path=/", uri)
    c = @cm.cookies.first
    assert_equal(nil, c.value)
    assert_equal('bar=', @cm.find(uri))

    @cm.parse("bar=; path=/", uri)
    c = @cm.cookies.first
    assert_equal(nil, c.value)
    assert_equal('bar=', @cm.find(uri))
  end

  def test_load_cookies_escaped
    uri = urify('http://example.org/')
    f = Tempfile.new('test_cookie')
    File.open(f.path, 'w') do |out|
      out.write <<EOF
http://example.org/	key	"value"	0	.example.org	/	13	0			
http://example.org/	key	""		.example.org	/	13	0			
http://example.org/	key			.example.org	/	13	0			
EOF
    end
    @cm.cookies_file = f.path
    @cm.load_cookies
    c0, c1, c2 = @cm.cookies
    assert_equal('"value"', c0.value)
    assert_equal('""', c1.value)
    assert_equal('', c2.value)
    assert_equal('key="value"', @cm.find(uri))
    c0.value = ''
    assert_equal('key=', @cm.find(uri))
    c0.value = '""'
    assert_equal('key=""', @cm.find(uri))
  end

end

end
