$VERBOSE = true
require 'minitest/autorun'

require File.expand_path("#{File.dirname(__FILE__)}/../lib/netrc")

class TestParse < Minitest::Test
  def test_parse_empty
    pre, items = Netrc.parse([])
    assert_equal("", pre)
    assert_equal([], items)
  end

  def test_parse_comment
    pre, items = Netrc.parse(["# foo\n"])
    assert_equal("# foo\n", pre)
    assert_equal([], items)
  end

  def test_parse_item
    t = ["machine", " ", "m", " ", "login", " ", "l", " ", "password", " ", "p", "\n"]
    pre, items = Netrc.parse(t)
    assert_equal("", pre)
    e = [["machine ", "m", " login ", "l", " password ", "p", "\n"]]
    assert_equal(e, items)
  end

  def test_parse_two_items
    t = ["machine", " ", "m", " ", "login", " ", "l", " ", "password", " ", "p", "\n"] * 2
    pre, items = Netrc.parse(t)
    assert_equal("", pre)
    e = [["machine ", "m", " login ", "l", " password ", "p", "\n"]] * 2
    assert_equal(e, items)
  end
end
