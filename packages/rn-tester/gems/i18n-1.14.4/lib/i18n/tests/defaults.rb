# encoding: utf-8

module I18n
  module Tests
    module Defaults
      def setup
        super
        I18n.backend.store_translations(:en, :foo => { :bar => 'bar', :baz => 'baz' })
      end

      test "defaults: given nil as a key it returns the given default" do
        assert_equal 'default', I18n.t(nil, :default => 'default')
      end

      test "defaults: given a symbol as a default it translates the symbol" do
        assert_equal 'bar', I18n.t(nil, :default => :'foo.bar')
      end

      test "defaults: given a symbol as a default and a scope it stays inside the scope when looking up the symbol" do
        assert_equal 'bar', I18n.t(:missing, :default => :bar, :scope => :foo)
      end

      test "defaults: given an array as a default it returns the first match" do
        assert_equal 'bar', I18n.t(:does_not_exist, :default => [:does_not_exist_2, :'foo.bar'])
      end

      test "defaults: given an array as a default with false it returns false" do
        assert_equal false, I18n.t(:does_not_exist, :default => [false])
      end

      test "defaults: given false it returns false" do
        assert_equal false, I18n.t(:does_not_exist, :default => false)
      end

      test "defaults: given nil it returns nil" do
        assert_nil I18n.t(:does_not_exist, :default => nil)
      end

      test "defaults: given an array of missing keys it raises a MissingTranslationData exception" do
        assert_raises I18n::MissingTranslationData do
          I18n.t(:does_not_exist, :default => [:does_not_exist_2, :does_not_exist_3], :raise => true)
        end
      end

      test "defaults: using a custom scope separator" do
        # data must have been stored using the custom separator when using the ActiveRecord backend
        I18n.backend.store_translations(:en, { :foo => { :bar => 'bar' } }, { :separator => '|' })
        assert_equal 'bar', I18n.t(nil, :default => :'foo|bar', :separator => '|')
      end
    end
  end
end
