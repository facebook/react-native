# encoding: utf-8

module I18n
  module Tests
    module Link
      test "linked lookup: if a key resolves to a symbol it looks up the symbol" do
        I18n.backend.store_translations 'en', {
          :link  => :linked,
          :linked => 'linked'
        }
        assert_equal 'linked', I18n.backend.translate('en', :link)
      end

      test "linked lookup: if a key resolves to a dot-separated symbol it looks up the symbol" do
        I18n.backend.store_translations 'en', {
          :link => :"foo.linked",
          :foo  => { :linked => 'linked' }
        }
        assert_equal('linked', I18n.backend.translate('en', :link))
      end

      test "linked lookup: if a dot-separated key resolves to a symbol it looks up the symbol" do
        I18n.backend.store_translations 'en', {
          :foo    => { :link => :linked },
          :linked => 'linked'
        }
        assert_equal('linked', I18n.backend.translate('en', :'foo.link'))
      end

      test "linked lookup: if a dot-separated key resolves to a dot-separated symbol it looks up the symbol" do
        I18n.backend.store_translations 'en', {
          :foo => { :link   => :"bar.linked" },
          :bar => { :linked => 'linked' }
        }
        assert_equal('linked', I18n.backend.translate('en', :'foo.link'))
      end

      test "linked lookup: links always refer to the absolute key" do
        I18n.backend.store_translations 'en', {
          :foo => { :link => :linked, :linked => 'linked in foo' },
          :linked => 'linked absolutely'
        }
        assert_equal 'linked absolutely', I18n.backend.translate('en', :link, :scope => :foo)
      end

      test "linked lookup: a link can resolve to a namespace in the middle of a dot-separated key" do
        I18n.backend.store_translations 'en', {
          :activemodel  => { :errors => { :messages => { :blank => "can't be blank" } } },
          :activerecord => { :errors => { :messages => :"activemodel.errors.messages" } }
        }
        assert_equal "can't be blank", I18n.t(:"activerecord.errors.messages.blank")
        assert_equal "can't be blank", I18n.t(:"activerecord.errors.messages.blank")
      end

      test "linked lookup: a link can resolve with option :count" do
        I18n.backend.store_translations 'en', {
          :counter => :counted,
          :counted => { :foo => { :one => "one", :other => "other" }, :bar => "bar" }
        }
        assert_equal "one", I18n.t(:'counter.foo', count: 1)
        assert_equal "other", I18n.t(:'counter.foo', count: 2)
        assert_equal "bar", I18n.t(:'counter.bar', count: 3)
      end
    end
  end
end
