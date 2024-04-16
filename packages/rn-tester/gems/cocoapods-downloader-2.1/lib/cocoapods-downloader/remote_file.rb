require 'fileutils'
require 'uri'
require 'zlib'

module Pod
  module Downloader
    class RemoteFile < Base
      def self.options
        [:type, :flatten, :sha1, :sha256, :headers]
      end

      class UnsupportedFileTypeError < StandardError; end

      private

      executable :unzip
      executable :tar
      executable :hdiutil

      attr_accessor :filename, :download_path

      def download!
        @filename = filename_with_type(type)
        @download_path = target_path + @filename
        download_file(@download_path)
        verify_checksum(@download_path)
        extract_with_type(@download_path, type)
      end

      def type
        if options[:type]
          options[:type].to_sym
        else
          type_with_url(url)
        end
      end

      def headers
        options[:headers]
      end

      # @note   The archive is flattened if it contains only one folder and its
      #         extension is either `tgz`, `tar`, `tbz` or the options specify
      #         it.
      #
      # @return [Bool] Whether the archive should be flattened if it contains
      #         only one folder.
      #
      def should_flatten?
        if options.key?(:flatten)
          options[:flatten]
        elsif [:tgz, :tar, :tbz, :txz].include?(type)
          true # those archives flatten by default
        else
          false # all others (actually only .zip) default not to flatten
        end
      end

      def type_with_url(url)
        case URI.parse(url).path
        when /\.zip$/
          :zip
        when /\.(tgz|tar\.gz)$/
          :tgz
        when /\.tar$/
          :tar
        when /\.(tbz|tar\.bz2)$/
          :tbz
        when /\.(txz|tar\.xz)$/
          :txz
        when /\.dmg$/
          :dmg
        end
      end

      def filename_with_type(type = :zip)
        case type
        when :zip, :tgz, :tar, :tbz, :txz, :dmg
          "file.#{type}"
        else
          raise UnsupportedFileTypeError, "Unsupported file type: #{type}"
        end
      end

      def download_file(_full_filename)
        raise NotImplementedError
      end

      def extract_with_type(full_filename, type = :zip)
        unpack_from = full_filename
        unpack_to = @target_path

        case type
        when :zip
          unzip! unpack_from, '-d', unpack_to
        when :tar, :tgz, :tbz, :txz
          tar! 'xf', unpack_from, '-C', unpack_to
        when :dmg
          extract_dmg(unpack_from, unpack_to)
        else
          raise UnsupportedFileTypeError, "Unsupported file type: #{type}"
        end

        # If the archive is a tarball and it only contained a folder, move its
        # contents to the target (#727)
        #
        if should_flatten?
          contents = target_path.children
          contents.delete(target_path + @filename)
          entry = contents.first
          if contents.count == 1 && entry.directory?
            tmp_entry = entry.sub_ext("#{entry.extname}.tmp")
            begin
              FileUtils.move(entry, tmp_entry)
              FileUtils.move(tmp_entry.children, target_path)
            ensure
              FileUtils.remove_entry(tmp_entry)
            end
          end
        end

        FileUtils.rm(unpack_from) if File.exist?(unpack_from)
      end

      def extract_dmg(unpack_from, unpack_to)
        require 'rexml/document'
        plist_s = hdiutil! 'attach', '-plist', '-nobrowse', unpack_from, '-mountrandom', unpack_to
        plist = REXML::Document.new plist_s
        xpath = '//key[.="mount-point"]/following-sibling::string'
        mount_point = REXML::XPath.first(plist, xpath).text
        FileUtils.cp_r(Dir.glob(mount_point + '/*'), unpack_to)
        hdiutil! 'detach', mount_point
      end

      def compare_hash(filename, hasher, hash)
        incremental_hash = hasher.new

        File.open(filename, 'rb') do |file|
          buf = ''
          incremental_hash << buf while file.read(1024, buf)
        end

        computed_hash = incremental_hash.hexdigest

        if computed_hash != hash
          raise DownloaderError, 'Verification checksum was incorrect, ' \
            "expected #{hash}, got #{computed_hash}"
        end
      end

      # Verify that the downloaded file matches a sha1 hash
      #
      def verify_sha1_hash(filename, hash)
        require 'digest/sha1'
        compare_hash(filename, Digest::SHA1, hash)
      end

      # Verify that the downloaded file matches a sha256 hash
      #
      def verify_sha256_hash(filename, hash)
        require 'digest/sha2'
        compare_hash(filename, Digest::SHA2, hash)
      end

      # Verify that the downloaded file matches the hash if set
      #
      def verify_checksum(filename)
        if options[:sha256]
          verify_sha256_hash(filename, options[:sha256])
        elsif options[:sha1]
          verify_sha1_hash(filename, options[:sha1])
        end
      end
    end
  end
end
