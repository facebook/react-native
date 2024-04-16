# rubocop:disable Naming/FileName

require 'open-uri'

# Allow OpenURI to follow http to https redirects.
#
module OpenURI
  # Whether {#open} should follow a redirect.
  #
  # Inspiration from: https://gist.github.com/1271420
  # Relevant issue:   https://bugs.ruby-lang.org/issues/3719
  # Source here:      https://github.com/ruby/ruby/blob/trunk/lib/open-uri.rb
  #
  # This test is intended to forbid a redirection from http://... to
  # file:///etc/passwd, file:///dev/zero, etc.  CVE-2011-1521
  # https to http redirect is also forbidden intentionally.
  # It avoids sending secure cookie or referrer by non-secure HTTP protocol.
  # (RFC 2109 4.3.1, RFC 2965 3.3, RFC 2616 15.1.3)
  # However this is ad hoc.  It should be extensible/configurable.
  #
  # @param [URI::Generic] uri1
  #        the origin uri from where the redirect origins
  #
  # @param [URI::Generic] uri2
  #        the target uri where to where the redirect points to
  #
  # @return [Boolean]
  #
  def self.redirectable?(uri1, uri2)
    uri1.scheme.downcase == uri2.scheme.downcase ||
      (/\A(?:http|ftp)\z/i =~ uri1.scheme && /\A(?:https?|ftp)\z/i =~ uri2.scheme)
  end
end
