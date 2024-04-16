module I18n
  module Tests
    module Basics
      def teardown
        I18n.available_locales = nil
      end

      test "available_locales returns the available_locales produced by the backend, by default" do
        I18n.backend.store_translations('de', :foo => 'bar')
        I18n.backend.store_translations('en', :foo => 'foo')

        assert_equal I18n.available_locales, I18n.backend.available_locales
      end

      test "available_locales can be set to something else independently from the actual locale data" do
        I18n.backend.store_translations('de', :foo => 'bar')
        I18n.backend.store_translations('en', :foo => 'foo')

        I18n.available_locales = :foo
        assert_equal [:foo], I18n.available_locales

        I18n.available_locales = [:foo, 'bar']
        assert_equal [:foo, :bar], I18n.available_locales

        I18n.available_locales = nil
        assert_equal I18n.available_locales, I18n.backend.available_locales
      end

      test "available_locales memoizes when set explicitly" do
        I18n.backend.expects(:available_locales).never
        I18n.available_locales = [:foo]
        I18n.backend.store_translations('de', :bar => 'baz')
        I18n.reload!
        assert_equal [:foo], I18n.available_locales
      end

      test "available_locales delegates to the backend when not set explicitly" do
        original_available_locales_value = I18n.backend.available_locales
        I18n.backend.expects(:available_locales).returns(original_available_locales_value).twice
        assert_equal I18n.backend.available_locales, I18n.available_locales
      end

      test "exists? is implemented by the backend" do
        I18n.backend.store_translations(:foo, :bar => 'baz')
        assert I18n.exists?(:bar, :foo)
      end

      test "storing a nil value as a translation removes it from the available locale data" do
        I18n.backend.store_translations(:en, :to_be_deleted => 'bar')
        assert_equal 'bar', I18n.t(:to_be_deleted, :default => 'baz')

        I18n.cache_store.clear if I18n.respond_to?(:cache_store) && I18n.cache_store
        I18n.backend.store_translations(:en, :to_be_deleted => nil)
        assert_equal 'baz', I18n.t(:to_be_deleted, :default => 'baz')
      end
    end
  end
end
