# encoding: utf-8

module I18n
  module Tests
    module Localization
      module Procs
        test "localize: using day names from lambdas" do
          setup_time_proc_translations
          time = ::Time.utc(2008, 3, 1, 6, 0)
          assert_match(/Суббота/, I18n.l(time, :format => "%A, %d %B", :locale => :ru))
          assert_match(/суббота/, I18n.l(time, :format => "%d %B (%A)", :locale => :ru))
        end

        test "localize: using month names from lambdas" do
          setup_time_proc_translations
          time = ::Time.utc(2008, 3, 1, 6, 0)
          assert_match(/марта/, I18n.l(time, :format => "%d %B %Y", :locale => :ru))
          assert_match(/Март /, I18n.l(time, :format => "%B %Y", :locale => :ru))
        end

        test "localize: using abbreviated day names from lambdas" do
          setup_time_proc_translations
          time = ::Time.utc(2008, 3, 1, 6, 0)
          assert_match(/марта/, I18n.l(time, :format => "%d %b %Y", :locale => :ru))
          assert_match(/март /, I18n.l(time, :format => "%b %Y", :locale => :ru))
        end

        test "localize Date: given a format that resolves to a Proc it calls the Proc with the object" do
          setup_time_proc_translations
          date = ::Date.new(2008, 3, 1)
          assert_equal '[Sat, 01 Mar 2008, {}]', I18n.l(date, :format => :proc, :locale => :ru)
        end

        test "localize Date: given a format that resolves to a Proc it calls the Proc with the object and extra options" do
          setup_time_proc_translations
          date = ::Date.new(2008, 3, 1)
          assert_equal '[Sat, 01 Mar 2008, {:foo=>"foo"}]', I18n.l(date, :format => :proc, :foo => 'foo', :locale => :ru)
        end

        test "localize DateTime: given a format that resolves to a Proc it calls the Proc with the object" do
          setup_time_proc_translations
          datetime = ::DateTime.new(2008, 3, 1, 6)
          assert_equal '[Sat, 01 Mar 2008 06:00:00 +00:00, {}]', I18n.l(datetime, :format => :proc, :locale => :ru)
        end

        test "localize DateTime: given a format that resolves to a Proc it calls the Proc with the object and extra options" do
          setup_time_proc_translations
          datetime = ::DateTime.new(2008, 3, 1, 6)
          assert_equal '[Sat, 01 Mar 2008 06:00:00 +00:00, {:foo=>"foo"}]', I18n.l(datetime, :format => :proc, :foo => 'foo', :locale => :ru)
        end

        test "localize Time: given a format that resolves to a Proc it calls the Proc with the object" do
          setup_time_proc_translations
          time = ::Time.utc(2008, 3, 1, 6, 0)
          assert_equal I18n::Tests::Localization::Procs.inspect_args([time], {}), I18n.l(time, :format => :proc, :locale => :ru)
        end

        test "localize Time: given a format that resolves to a Proc it calls the Proc with the object and extra options" do
          setup_time_proc_translations
          time = ::Time.utc(2008, 3, 1, 6, 0)
          options = { :foo => 'foo' }
          assert_equal I18n::Tests::Localization::Procs.inspect_args([time], options), I18n.l(time, **options.merge(:format => :proc, :locale => :ru))
        end

        protected

          def self.inspect_args(args, kwargs)
            args << kwargs
            args = args.map do |arg|
              case arg
              when ::Time, ::DateTime
                arg.strftime('%a, %d %b %Y %H:%M:%S %Z').sub('+0000', '+00:00')
              when ::Date
                arg.strftime('%a, %d %b %Y')
              when Hash
                arg.delete(:fallback_in_progress)
                arg.delete(:fallback_original_locale)
                arg.inspect
              else
                arg.inspect
              end
            end
            "[#{args.join(', ')}]"
          end

          def setup_time_proc_translations
            I18n.backend.store_translations :ru, {
              :time => {
                :formats => {
                  :proc => lambda { |*args, **kwargs| I18n::Tests::Localization::Procs.inspect_args(args, kwargs) }
                }
              },
              :date => {
                :formats => {
                  :proc => lambda { |*args, **kwargs| I18n::Tests::Localization::Procs.inspect_args(args, kwargs) }
                },
                :'day_names' => lambda { |key, options|
                  (options[:format] =~ /^%A/) ?
                  %w(Воскресенье Понедельник Вторник Среда Четверг Пятница Суббота) :
                  %w(воскресенье понедельник вторник среда четверг пятница суббота)
                },
                :'month_names' => lambda { |key, options|
                  (options[:format] =~ /(%d|%e)(\s*)?(%B)/) ?
                  %w(января февраля марта апреля мая июня июля августа сентября октября ноября декабря).unshift(nil) :
                  %w(Январь Февраль Март Апрель Май Июнь Июль Август Сентябрь Октябрь Ноябрь Декабрь).unshift(nil)
                },
                :'abbr_month_names' => lambda { |key, options|
                  (options[:format] =~ /(%d|%e)(\s*)(%b)/) ?
                  %w(янв. февр. марта апр. мая июня июля авг. сент. окт. нояб. дек.).unshift(nil) :
                  %w(янв. февр. март апр. май июнь июль авг. сент. окт. нояб. дек.).unshift(nil)
                },
              }
            }
          end
      end
    end
  end
end
