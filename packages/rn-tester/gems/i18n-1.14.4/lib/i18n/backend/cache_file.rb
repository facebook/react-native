# frozen_string_literal: true

require 'openssl'

module I18n
  module Backend
    # Overwrites the Base load_file method to cache loaded file contents.
    module CacheFile
      # Optionally provide path_roots array to normalize filename paths,
      # to make the cached i18n data portable across environments.
      attr_accessor :path_roots

      protected

      # Track loaded translation files in the `i18n.load_file` scope,
      # and skip loading the file if its contents are still up-to-date.
      def load_file(filename)
        initialized = !respond_to?(:initialized?) || initialized?
        key = I18n::Backend::Flatten.escape_default_separator(normalized_path(filename))
        old_mtime, old_digest = initialized && lookup(:i18n, key, :load_file)
        return if (mtime = File.mtime(filename).to_i) == old_mtime ||
                  (digest = OpenSSL::Digest::SHA256.file(filename).hexdigest) == old_digest
        super
        store_translations(:i18n, load_file: { key => [mtime, digest] })
      end

      # Translate absolute filename to relative path for i18n key.
      def normalized_path(file)
        return file unless path_roots
        path = path_roots.find(&file.method(:start_with?)) ||
               raise(InvalidLocaleData.new(file, 'outside expected path roots'))
        file.sub(path, path_roots.index(path).to_s)
      end
    end
  end
end
