# frozen_string_literal: true

# The Cascade module adds the ability to do cascading lookups to backends that
# are compatible to the Simple backend.
#
# By cascading lookups we mean that for any key that can not be found the
# Cascade module strips one segment off the scope part of the key and then
# tries to look up the key in that scope.
#
# E.g. when a lookup for the key :"foo.bar.baz" does not yield a result then
# the segment :bar will be stripped off the scope part :"foo.bar" and the new
# scope :foo will be used to look up the key :baz. If that does not succeed
# then the remaining scope segment :foo will be omitted, too, and again the
# key :baz will be looked up (now with no scope).
#
# To enable a cascading lookup one passes the :cascade option:
#
#   I18n.t(:'foo.bar.baz', :cascade => true)
#
# This will return the first translation found for :"foo.bar.baz", :"foo.baz"
# or :baz in this order.
#
# The cascading lookup takes precedence over resolving any given defaults.
# I.e. defaults will kick in after the cascading lookups haven't succeeded.
#
# This behavior is useful for libraries like ActiveRecord validations where
# the library wants to give users a bunch of more or less fine-grained options
# of scopes for a particular key.
#
# Thanks to Clemens Kofler for the initial idea and implementation! See
# http://github.com/clemens/i18n-cascading-backend

module I18n
  module Backend
    module Cascade
      def lookup(locale, key, scope = [], options = EMPTY_HASH)
        return super unless cascade = options[:cascade]

        cascade   = { :step => 1 } unless cascade.is_a?(Hash)
        step      = cascade[:step]   || 1
        offset    = cascade[:offset] || 1
        separator = options[:separator] || I18n.default_separator
        skip_root = cascade.has_key?(:skip_root) ? cascade[:skip_root] : true

        scope = I18n.normalize_keys(nil, key, scope, separator)
        key   = (scope.slice!(-offset, offset) || []).join(separator)

        begin
          result = super
          return result unless result.nil?
          scope = scope.dup
        end while (!scope.empty? || !skip_root) && scope.slice!(-step, step)
      end
    end
  end
end
