$VERBOSE = true
require 'minitest/autorun'
require 'fileutils'

require File.expand_path("#{File.dirname(__FILE__)}/../lib/netrc")
require "rbconfig"

class TestNetrc < Minitest::Test

  def setup
    Dir.glob('data/*.netrc').each{|f| File.chmod(0600, f)}
    File.chmod(0644, "data/permissive.netrc")
  end

  def teardown
    Dir.glob('data/*.netrc').each{|f| File.chmod(0644, f)}
  end

  def test_parse_empty
    pre, items = Netrc.parse(Netrc.lex([]))
    assert_equal("", pre)
    assert_equal([], items)
  end

  def test_parse_file
    pre, items = Netrc.parse(Netrc.lex(IO.readlines("data/sample.netrc")))
    assert_equal("# this is my netrc\n", pre)
    exp = [["machine ",
            "m",
            "\n  login ",
            "l",
            " # this is my username\n  password ",
            "p",
            "\n"]]
    assert_equal(exp, items)
  end

  def test_login_file
    pre, items = Netrc.parse(Netrc.lex(IO.readlines("data/login.netrc")))
    assert_equal("# this is my login netrc\n", pre)
    exp = [["machine ",
            "m",
            "\n  login ",
            "l",
            " # this is my username\n"]]
    assert_equal(exp, items)
  end

  def test_password_file
    pre, items = Netrc.parse(Netrc.lex(IO.readlines("data/password.netrc")))
    assert_equal("# this is my password netrc\n", pre)
    exp = [["machine ",
            "m",
            "\n  password ",
            "p",
            " # this is my password\n"]]
    assert_equal(exp, items)
  end

  def test_missing_file
    n = Netrc.read("data/nonexistent.netrc")
    assert_equal(0, n.length)
  end

  def test_permission_error
    original_windows = Netrc::WINDOWS
    Netrc.send(:remove_const, :WINDOWS)
    Netrc.const_set(:WINDOWS, false)
    Netrc.read("data/permissive.netrc")
    assert false, "Should raise an error if permissions are wrong on a non-windows system."
  rescue Netrc::Error
    assert true, ""
  ensure
    Netrc.send(:remove_const, :WINDOWS)
    Netrc.const_set(:WINDOWS, original_windows)
  end

  def test_allow_permissive_netrc_file_option
    Netrc.configure do |config|
      config[:allow_permissive_netrc_file] = true
    end
    original_windows = Netrc::WINDOWS
    Netrc.send(:remove_const, :WINDOWS)
    Netrc.const_set(:WINDOWS, false)
    Netrc.read("data/permissive.netrc")
    assert true, ""
  rescue Netrc::Error
    assert false, "Should not raise an error if allow_permissive_netrc_file option is set to true"
  ensure
    Netrc.send(:remove_const, :WINDOWS)
    Netrc.const_set(:WINDOWS, original_windows)
    Netrc.configure do |config|
      config[:allow_permissive_netrc_file] = false
    end
  end

  def test_permission_error_windows
    original_windows = Netrc::WINDOWS
    Netrc.send(:remove_const, :WINDOWS)
    Netrc.const_set(:WINDOWS, true)
    Netrc.read("data/permissive.netrc")
  rescue Netrc::Error
    assert false, "Should not raise an error if permissions are wrong on a non-windows system."
  ensure
    Netrc.send(:remove_const, :WINDOWS)
    Netrc.const_set(:WINDOWS, original_windows)
  end

  def test_round_trip
    n = Netrc.read("data/sample.netrc")
    assert_equal(IO.read("data/sample.netrc"), n.unparse)
  end

  def test_set
    n = Netrc.read("data/sample.netrc")
    n["m"] = "a", "b"
    exp = "# this is my netrc\n"+
          "machine m\n"+
          "  login a # this is my username\n"+
          "  password b\n"
    assert_equal(exp, n.unparse)
  end

  def test_set_get
    n = Netrc.read("data/sample.netrc")
    n["m"] = "a", "b"
    assert_equal(["a", "b"], n["m"].to_a)
  end

  def test_add
    n = Netrc.read("data/sample.netrc")
    n.new_item_prefix = "# added\n"
    n["x"] = "a", "b"
    exp = "# this is my netrc\n"+
          "machine m\n"+
          "  login l # this is my username\n"+
          "  password p\n"+
          "# added\n"+
          "machine x\n"+
          "  login a\n"+
          "  password b\n"
    assert_equal(exp, n.unparse)
  end

  def test_add_newlineless
    n = Netrc.read("data/newlineless.netrc")
    n.new_item_prefix = "# added\n"
    n["x"] = "a", "b"
    exp = "# this is my netrc\n"+
          "machine m\n"+
          "  login l # this is my username\n"+
          "  password p\n"+
          "# added\n"+
          "machine x\n"+
          "  login a\n"+
          "  password b\n"
    assert_equal(exp, n.unparse)
  end

  def test_add_get
    n = Netrc.read("data/sample.netrc")
    n.new_item_prefix = "# added\n"
    n["x"] = "a", "b"
    assert_equal(["a", "b"], n["x"].to_a)
  end

  def test_get_missing
    n = Netrc.read("data/sample.netrc")
    assert_equal(nil, n["x"])
  end

  def test_save
    n = Netrc.read("data/sample.netrc")
    n.save
    assert_equal(File.read("data/sample.netrc"), n.unparse)
  end

  def test_save_create
    FileUtils.rm_f("/tmp/created.netrc")
    n = Netrc.read("/tmp/created.netrc")
    n.save
    unless Netrc::WINDOWS
      assert_equal(0600, File.stat("/tmp/created.netrc").mode & 0777)
    end
  end

  def test_encrypted_roundtrip
    if `gpg --list-keys 2> /dev/null` != ""
      FileUtils.rm_f("/tmp/test.netrc.gpg")
      n = Netrc.read("/tmp/test.netrc.gpg")
      n["m"] = "a", "b"
      n.save
      assert_equal(0600, File.stat("/tmp/test.netrc.gpg").mode & 0777)
      netrc = Netrc.read("/tmp/test.netrc.gpg")["m"]
      assert_equal("a", netrc.login)
      assert_equal("b", netrc.password)
    end
  end

  def test_missing_environment
    nil_home = nil
    ENV["HOME"], nil_home = nil_home, ENV["HOME"]
    assert_equal File.join(Dir.pwd, '.netrc'), Netrc.default_path
  ensure
    ENV["HOME"], nil_home = nil_home, ENV["HOME"]
  end

  def test_netrc_environment_variable
    ENV["NETRC"] = File.join(Dir.pwd, 'data')
    assert_equal File.join(Dir.pwd, 'data', '.netrc'), Netrc.default_path
  ensure
    ENV.delete("NETRC")
  end

  def test_read_entry
    entry = Netrc.read("data/sample.netrc")['m']
    assert_equal 'l', entry.login
    assert_equal 'p', entry.password

    # hash-style
    assert_equal 'l', entry[:login]
    assert_equal 'p', entry[:password]
  end

  def test_write_entry
    n = Netrc.read("data/sample.netrc")
    entry = n['m']
    entry.login    = 'new_login'
    entry.password = 'new_password'
    n['m'] = entry
    assert_equal(['new_login', 'new_password'], n['m'].to_a)
  end

  def test_entry_splat
    e = Netrc::Entry.new("user", "pass")
    user, pass = *e
    assert_equal("user", user)
    assert_equal("pass", pass)
  end

  def test_entry_implicit_splat
    e = Netrc::Entry.new("user", "pass")
    user, pass = e
    assert_equal("user", user)
    assert_equal("pass", pass)
  end

  def test_with_default
    netrc = Netrc.read('data/sample_with_default.netrc')
    assert_equal(['l', 'p'], netrc['m'].to_a)
    assert_equal(['default_login', 'default_password'], netrc['unknown'].to_a)
  end

  def test_multi_without_default
    netrc = Netrc.read('data/sample_multi.netrc')
    assert_equal(['lm', 'pm'], netrc['m'].to_a)
    assert_equal(['ln', 'pn'], netrc['n'].to_a)
    assert_equal([], netrc['other'].to_a)
  end

  def test_multi_with_default
    netrc = Netrc.read('data/sample_multi_with_default.netrc')
    assert_equal(['lm', 'pm'], netrc['m'].to_a)
    assert_equal(['ln', 'pn'], netrc['n'].to_a)
    assert_equal(['ld', 'pd'], netrc['other'].to_a)
  end

  def test_default_only
    netrc = Netrc.read('data/default_only.netrc')
    assert_equal(['ld', 'pd'], netrc['m'].to_a)
    assert_equal(['ld', 'pd'], netrc['other'].to_a)
  end
end
