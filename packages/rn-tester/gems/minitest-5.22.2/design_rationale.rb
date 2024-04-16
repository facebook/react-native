# Specs:                               # Equivalent Unit Tests:
###############################################################################
describe Thingy do                     # class TestThingy < Minitest::Test
  before do                            #   def setup
    do_some_setup                      #     super
  end                                  #     do_some_setup
                                       #   end
  it "should do the first thing" do    #
    1.must_equal 1                     #   def test_first_thing
  end                                  #     assert_equal 1, 1
                                       #   end
  describe SubThingy do                # end
    before do                          #
      do_more_setup                    # class TestSubThingy < TestThingy
    end                                #   def setup
                                       #     super
    it "should do the second thing" do #     do_more_setup
      2.must_equal 2                   #   end
    end                                #
  end                                  #   def test_second_thing
end                                    #     assert_equal 2, 2
                                       #   end
                                       # end
###############################################################################
# runs 2 specs                         # runs 3 tests
###############################################################################
# The specs generate:

class ThingySpec < Minitest::Spec
  def setup
    super
    do_some_setup
  end

  def test_should_do_the_first_thing
    assert_equal 1, 1
  end
end

class SubThingySpec < ThingySpec
  def setup
    super
    do_more_setup
  end

  # because only setup/teardown is inherited, not specs
  remove_method :test_should_do_the_first_thing

  def test_should_do_the_second_thing
    assert_equal 2, 2
  end
end
