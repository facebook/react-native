# frozen_string_literal: true

require 'i18n/gettext'

module I18n
  module Gettext
    # Implements classical Gettext style accessors. To use this include the
    # module to the global namespace or wherever you want to use it.
    #
    #   include I18n::Gettext::Helpers
    module Helpers
      # Makes dynamic translation messages readable for the gettext parser.
      # <tt>_(fruit)</tt> cannot be understood by the gettext parser. To help the parser find all your translations,
      # you can add <tt>fruit = N_("Apple")</tt> which does not translate, but tells the parser: "Apple" needs translation.
      # * msgid: the message id.
      # * Returns: msgid.
      def N_(msgsid)
        msgsid
      end

      def gettext(msgid, options = EMPTY_HASH)
        I18n.t(msgid, **{:default => msgid, :separator => '|'}.merge(options))
      end
      alias _ gettext

      def sgettext(msgid, separator = '|')
        scope, msgid = I18n::Gettext.extract_scope(msgid, separator)
        I18n.t(msgid, :scope => scope, :default => msgid, :separator => separator)
      end
      alias s_ sgettext

      def pgettext(msgctxt, msgid)
        separator = I18n::Gettext::CONTEXT_SEPARATOR
        sgettext([msgctxt, msgid].join(separator), separator)
      end
      alias p_ pgettext

      def ngettext(msgid, msgid_plural, n = 1)
        nsgettext(msgid, msgid_plural, n)
      end
      alias n_ ngettext

      # Method signatures:
      #   nsgettext('Fruits|apple', 'apples', 2)
      #   nsgettext(['Fruits|apple', 'apples'], 2)
      def nsgettext(msgid, msgid_plural, n = 1, separator = '|')
        if msgid.is_a?(Array)
          msgid, msgid_plural, n, separator = msgid[0], msgid[1], msgid_plural, n
          separator = '|' unless separator.is_a?(::String)
        end

        scope, msgid = I18n::Gettext.extract_scope(msgid, separator)
        default = { :one => msgid, :other => msgid_plural }
        I18n.t(msgid, :default => default, :count => n, :scope => scope, :separator => separator)
      end
      alias ns_ nsgettext

      # Method signatures:
      #   npgettext('Fruits', 'apple', 'apples', 2)
      #   npgettext('Fruits', ['apple', 'apples'], 2)
      def npgettext(msgctxt, msgid, msgid_plural, n = 1)
        separator = I18n::Gettext::CONTEXT_SEPARATOR

        if msgid.is_a?(Array)
          msgid_plural, msgid, n = msgid[1], [msgctxt, msgid[0]].join(separator), msgid_plural
        else
          msgid = [msgctxt, msgid].join(separator)
        end

        nsgettext(msgid, msgid_plural, n, separator)
      end
      alias np_ npgettext
    end
  end
end
