# encoding: utf-8

module I18n
  module Tests
    module Localization
      module Time
        def setup
          super
          setup_time_translations
          @time = ::Time.utc(2008, 3, 1, 6, 0)
          @other_time = ::Time.utc(2008, 3, 1, 18, 0)
        end

        test "localize Time: given the short format it uses it" do
          assert_equal '01. Mär 06:00', I18n.l(@time, :format => :short, :locale => :de)
        end

        test "localize Time: given the long format it uses it" do
          assert_equal '01. März 2008 06:00', I18n.l(@time, :format => :long, :locale => :de)
        end

        # TODO Seems to break on Windows because ENV['TZ'] is ignored. What's a better way to do this?
        # def test_localize_given_the_default_format_it_uses_it
        #   assert_equal 'Sa, 01. Mar 2008 06:00:00 +0000', I18n.l(@time, :format => :default, :locale => :de)
        # end

        test "localize Time: given a day name format it returns the correct day name" do
          assert_equal 'Samstag', I18n.l(@time, :format => '%A', :locale => :de)
        end

        test "localize Time: given a uppercased day name format it returns the correct day name in upcase" do
          assert_equal 'samstag'.upcase, I18n.l(@time, :format => '%^A', :locale => :de)
        end

        test "localize Time: given an abbreviated day name format it returns the correct abbreviated day name" do
          assert_equal 'Sa', I18n.l(@time, :format => '%a', :locale => :de)
        end

        test "localize Time: given an abbreviated and uppercased day name format it returns the correct abbreviated day name in upcase" do
          assert_equal 'sa'.upcase, I18n.l(@time, :format => '%^a', :locale => :de)
        end

        test "localize Time: given a month name format it returns the correct month name" do
          assert_equal 'März', I18n.l(@time, :format => '%B', :locale => :de)
        end

        test "localize Time: given a uppercased month name format it returns the correct month name in upcase" do
          assert_equal 'märz'.upcase, I18n.l(@time, :format => '%^B', :locale => :de)
        end

        test "localize Time: given an abbreviated month name format it returns the correct abbreviated month name" do
          assert_equal 'Mär', I18n.l(@time, :format => '%b', :locale => :de)
        end

        test "localize Time: given an abbreviated and uppercased month name format it returns the correct abbreviated month name in upcase" do
          assert_equal 'mär'.upcase, I18n.l(@time, :format => '%^b', :locale => :de)
        end

        test "localize Time: given a date format with the month name upcased it returns the correct value" do
          assert_equal '1. FEBRUAR 2008', I18n.l(::Time.utc(2008, 2, 1, 6, 0), :format => "%-d. %^B %Y", :locale => :de)
        end

        test "localize Time: given missing translations it returns the correct error message" do
          assert_equal 'Translation missing: fr.date.abbr_month_names', I18n.l(@time, :format => '%b', :locale => :fr)
        end

        test "localize Time: given a meridian indicator format it returns the correct meridian indicator" do
          assert_equal 'AM', I18n.l(@time, :format => '%p', :locale => :de)
          assert_equal 'PM', I18n.l(@other_time, :format => '%p', :locale => :de)
        end

        test "localize Time: given a meridian indicator format it returns the correct meridian indicator in upcase" do
          assert_equal 'am', I18n.l(@time, :format => '%P', :locale => :de)
          assert_equal 'pm', I18n.l(@other_time, :format => '%P', :locale => :de)
        end

        test "localize Time: given an unknown format it does not fail" do
          assert_nothing_raised { I18n.l(@time, :format => '%x') }
        end

        test "localize Time: given a format is missing it raises I18n::MissingTranslationData" do
          assert_raises(I18n::MissingTranslationData) { I18n.l(@time, :format => :missing) }
        end

        protected

          def setup_time_translations
            I18n.backend.store_translations :de, {
              :time => {
                :formats => {
                  :default => "%a, %d. %b %Y %H:%M:%S %z",
                  :short => "%d. %b %H:%M",
                  :long => "%d. %B %Y %H:%M",
                },
                :am => 'am',
                :pm => 'pm'
              }
            }
          end
      end
    end
  end
end
