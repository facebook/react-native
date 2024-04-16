$VERBOSE = true
require 'minitest/autorun'

require File.expand_path("#{File.dirname(__FILE__)}/../lib/netrc")

class TestLex < Minitest::Test
  def test_lex_empty
    t = Netrc.lex([])
    assert_equal([], t)
  end

  def test_lex_comment
    t = Netrc.lex(["# foo\n"])
    assert_equal(["# foo\n"], t)
  end

  def test_lex_comment_after_space
    t = Netrc.lex([" # foo\n"])
    assert_equal([" # foo\n"], t)
  end

  def test_lex_comment_after_word
    t = Netrc.lex(["x # foo\n"])
    assert_equal(["x", " # foo\n"], t)
  end

  def test_lex_comment_with_hash
    t = Netrc.lex(["x # foo # bar\n"])
    assert_equal(["x", " # foo # bar\n"], t)
  end

  def test_lex_word
    t = Netrc.lex(["x"])
    assert_equal(["x"], t)
  end

  def test_lex_two_lines
    t = Netrc.lex(["x\ny\n"])
    assert_equal(["x", "\n", "y", "\n"], t)
  end

  def test_lex_word_and_comment
    t = Netrc.lex(["x\n", "# foo\n"])
    assert_equal(["x", "\n", "# foo\n"], t)
  end

  def test_lex_six_words
    t = Netrc.lex(["machine m login l password p\n"])
    e = ["machine", " ", "m", " ", "login", " ", "l", " ", "password", " ", "p", "\n"]
    assert_equal(e, t)
  end

  def test_lex_complex
    t = Netrc.lex(["machine sub.domain.com  login email@domain.com  password pass\n"])
    e = ["machine", " ", "sub.domain.com", "  ", "login", " ", "email@domain.com", "  ", "password", " ", "pass", "\n"]
    assert_equal(e, t)
  end
end
