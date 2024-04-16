# encoding: utf-8

module I18n
  module Tests
    module Interpolation
      # If no interpolation parameter is not given, I18n should not alter the string.
      # This behavior is due to three reasons:
      #
      #   * Checking interpolation keys in all strings hits performance, badly;
      #
      #   * This allows us to retrieve untouched values through I18n. For example
      #     I could have a middleware that returns I18n lookup results in JSON
      #     to be processed through Javascript. Leaving the keys untouched allows
      #     the interpolation to happen at the javascript level;
      #
      #   * Security concerns: if I allow users to translate a web site, they can
      #     insert %{} in messages causing the I18n lookup to fail in every request.
      #
      test "interpolation: given no values it does not alter the string" do
        assert_equal 'Hi %{name}!', interpolate(:default => 'Hi %{name}!')
      end

      test "interpolation: given values it interpolates them into the string" do
        assert_equal 'Hi David!', interpolate(:default => 'Hi %{name}!', :name => 'David')
      end

      test "interpolation: works with a pipe" do
        assert_equal 'Hi david!', interpolate(:default => 'Hi %{name|lowercase}!', :'name|lowercase' => 'david')
      end

      test "interpolation: given a nil value it still interpolates it into the string" do
        assert_equal 'Hi !', interpolate(:default => 'Hi %{name}!', :name => nil)
      end

      test "interpolation: given a lambda as a value it calls it if the string contains the key" do
        assert_equal 'Hi David!', interpolate(:default => 'Hi %{name}!', :name => lambda { |*args| 'David' })
      end

      test "interpolation: given a lambda as a value it does not call it if the string does not contain the key" do
        assert_nothing_raised { interpolate(:default => 'Hi!', :name => lambda { |*args| raise 'fail' }) }
      end

      test "interpolation: given values but missing a key it raises I18n::MissingInterpolationArgument" do
        assert_raises(I18n::MissingInterpolationArgument) do
          interpolate(:default => '%{foo}', :bar => 'bar')
        end
      end

      test "interpolation: it does not raise I18n::MissingInterpolationArgument for escaped variables" do
        assert_nothing_raised do
          assert_equal 'Barr %{foo}', interpolate(:default => '%{bar} %%{foo}', :bar => 'Barr')
        end
      end

      test "interpolation: it does not change the original, stored translation string" do
        I18n.backend.store_translations(:en, :interpolate => 'Hi %{name}!')
        assert_equal 'Hi David!', interpolate(:interpolate, :name => 'David')
        assert_equal 'Hi Yehuda!', interpolate(:interpolate, :name => 'Yehuda')
      end

      test "interpolation: given an array interpolates each element" do
        I18n.backend.store_translations(:en, :array_interpolate => ['Hi', 'Mr. %{name}', 'or sir %{name}'])
        assert_equal ['Hi', 'Mr. Bartuz', 'or sir Bartuz'], interpolate(:array_interpolate, :name => 'Bartuz')
      end

      test "interpolation: given the translation is in utf-8 it still works" do
        assert_equal 'Häi David!', interpolate(:default => 'Häi %{name}!', :name => 'David')
      end

      test "interpolation: given the value is in utf-8 it still works" do
        assert_equal 'Hi ゆきひろ!', interpolate(:default => 'Hi %{name}!', :name => 'ゆきひろ')
      end

      test "interpolation: given the translation and the value are in utf-8 it still works" do
        assert_equal 'こんにちは、ゆきひろさん!', interpolate(:default => 'こんにちは、%{name}さん!', :name => 'ゆきひろ')
      end

      if Object.const_defined?(:Encoding)
        test "interpolation: given a euc-jp translation and a utf-8 value it raises Encoding::CompatibilityError" do
          assert_raises(Encoding::CompatibilityError) do
            interpolate(:default => euc_jp('こんにちは、%{name}さん!'), :name => 'ゆきひろ')
          end
        end

        test "interpolation: given a utf-8 translation and a euc-jp value it raises Encoding::CompatibilityError" do
          assert_raises(Encoding::CompatibilityError) do
            interpolate(:default => 'こんにちは、%{name}さん!', :name => euc_jp('ゆきひろ'))
          end
        end

        test "interpolation: ASCII strings in the backend should be encoded to UTF8 if interpolation options are in UTF8" do
          I18n.backend.store_translations 'en', 'encoding' => ('%{who} let me go'.force_encoding("ASCII"))
          result = I18n.t 'encoding', :who => "måmmå miå"
          assert_equal Encoding::UTF_8, result.encoding
        end

        test "interpolation: UTF8 strings in the backend are still returned as UTF8 with ASCII interpolation" do
          I18n.backend.store_translations 'en', 'encoding' => 'måmmå miå %{what}'
          result = I18n.t 'encoding', :what => 'let me go'.force_encoding("ASCII")
          assert_equal Encoding::UTF_8, result.encoding
        end

        test "interpolation: UTF8 strings in the backend are still returned as UTF8 even with numbers interpolation" do
          I18n.backend.store_translations 'en', 'encoding' => '%{count} times: måmmå miå'
          result = I18n.t 'encoding', :count => 3
          assert_equal Encoding::UTF_8, result.encoding
        end
      end

      test "interpolation: given a translations containing a reserved key it raises I18n::ReservedInterpolationKey" do
        assert_raises(I18n::ReservedInterpolationKey) { interpolate(:foo => :bar, :default => '%{exception_handler}') }
        assert_raises(I18n::ReservedInterpolationKey) { interpolate(:foo => :bar, :default => '%{default}') }
        assert_raises(I18n::ReservedInterpolationKey) { interpolate(:foo => :bar, :default => '%{separator}') }
        assert_raises(I18n::ReservedInterpolationKey) { interpolate(:foo => :bar, :default => '%{scope}') }
        assert_raises(I18n::ReservedInterpolationKey) { interpolate(:default => '%{scope}') }

        I18n.backend.store_translations(:en, :interpolate => 'Hi %{scope}!')
        assert_raises(I18n::ReservedInterpolationKey) { interpolate(:interpolate) }
      end

      test "interpolation: deep interpolation for default string" do
        assert_equal 'Hi %{name}!', interpolate(:default => 'Hi %{name}!', :deep_interpolation => true)
      end

      test "interpolation: deep interpolation for interpolated string" do
        assert_equal 'Hi Ann!', interpolate(:default => 'Hi %{name}!', :name => 'Ann', :deep_interpolation => true)
      end

      test "interpolation: deep interpolation for Hash" do
        people = { :people => { :ann => 'Ann is %{ann}', :john => 'John is %{john}' } }
        interpolated_people = { :people => { :ann => 'Ann is good', :john => 'John is big' } }
        assert_equal interpolated_people, interpolate(:default => people, :ann => 'good', :john => 'big', :deep_interpolation => true)
      end

      test "interpolation: deep interpolation for Array" do
        people = { :people => ['Ann is %{ann}', 'John is %{john}'] }
        interpolated_people = { :people => ['Ann is good', 'John is big'] }
        assert_equal interpolated_people, interpolate(:default => people, :ann => 'good', :john => 'big', :deep_interpolation => true)
      end

      protected

      def capture(stream)
        begin
          stream = stream.to_s
          eval "$#{stream} = StringIO.new"
          yield
          result = eval("$#{stream}").string
        ensure
          eval("$#{stream} = #{stream.upcase}")
        end

        result
      end

      def euc_jp(string)
        string.encode!(Encoding::EUC_JP)
      end

      def interpolate(*args)
        options = args.last.is_a?(Hash) ? args.pop : {}
        key = args.pop
        I18n.backend.translate('en', key, options)
      end
    end
  end
end
