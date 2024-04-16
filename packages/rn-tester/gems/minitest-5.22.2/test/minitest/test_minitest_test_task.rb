require "minitest/autorun"
require "hoe"

require "minitest/test_task"

Hoe.load_plugins # make sure Hoe::Test is loaded

class TestHoeTest < Minitest::Test
  PATH = "test/minitest/test_minitest_test_task.rb"

  mt_path = %w[lib test .].join File::PATH_SEPARATOR

  MT_EXPECTED = %W[-I#{mt_path} -w
                   -e '%srequire "#{PATH}"'
                   --].join(" ") + " "

  def test_make_test_cmd_for_minitest
    skip "Using TESTOPTS... skipping" if ENV["TESTOPTS"]

    require "minitest/test_task"

    framework = %(require "minitest/autorun"; )

    @tester = Minitest::TestTask.create :test do |t|
      t.test_globs = [PATH]
    end

    assert_equal MT_EXPECTED % [framework].join("; "), @tester.make_test_cmd
  end

  def test_make_test_cmd_for_minitest_prelude
    skip "Using TESTOPTS... skipping" if ENV["TESTOPTS"]

    require "minitest/test_task"

    prelude = %(require "other/file")
    framework = %(require "minitest/autorun"; )

    @tester = Minitest::TestTask.create :test do |t|
      t.test_prelude = prelude
      t.test_globs = [PATH]
    end

    assert_equal MT_EXPECTED % [prelude, framework].join("; "), @tester.make_test_cmd
  end
end
