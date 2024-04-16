# -*- coding: utf-8 -*-

require 'kconv'
require 'date'
require 'time'

#
# CFPropertyList implementation
#
# class to read, manipulate and write both XML and binary property list
# files (plist(5)) as defined by Apple. Have a look at CFPropertyList::List
# for more documentation.
#
# == Example
#   require 'cfpropertylist'
#
#   # create a arbitrary data structure of basic data types
#   data = {
#     'name' => 'John Doe',
#     'missing' => true,
#     'last_seen' => Time.now,
#     'friends' => ['Jane Doe','Julian Doe'],
#     'likes' => {
#       'me' => false
#     }
#   }
#
#   # create CFPropertyList::List object
#   plist = CFPropertyList::List.new
#
#   # call CFPropertyList.guess() to create corresponding CFType values
#   # pass in optional :convert_unknown_to_string => true to convert things like symbols into strings.
#   plist.value = CFPropertyList.guess(data)
#
#   # write plist to file
#   plist.save("example.plist", CFPropertyList::List::FORMAT_BINARY)
#
#   # … later, read it again
#   plist = CFPropertyList::List.new(:file => "example.plist")
#   data = CFPropertyList.native_types(plist.value)
#
# Author::    Christian Kruse (mailto:cjk@wwwtech.de)
# Copyright:: Copyright (c) 2010
# License::   MIT License
module CFPropertyList
  class << self
    attr_accessor :xml_parser_interface
  end

  # interface class for PList parsers
  class ParserInterface
    # load a plist
    def load(opts={})
      return ""
    end

    # convert a plist to string
    def to_str(opts={})
      return true
    end
  end

  class XMLParserInterface < ParserInterface
    def new_node(name)
    end

    def new_text(val)
    end

    def append_node(parent, child)
    end
  end
end

dirname = File.dirname(__FILE__)
require dirname + '/rbCFPlistError.rb'
require dirname + '/rbCFTypes.rb'
require dirname + '/rbBinaryCFPropertyList.rb'
require dirname + '/rbPlainCFPropertyList.rb'

begin
  require dirname + '/rbLibXMLParser.rb'
  temp = LibXML::XML::Parser::Options::NOBLANKS # check if we have a version with parser options
  temp = false # avoid a warning
  try_nokogiri = false
  CFPropertyList.xml_parser_interface = CFPropertyList::LibXMLParser
rescue LoadError, NameError
  try_nokogiri = true
end

if try_nokogiri then
  begin
    require dirname + '/rbNokogiriParser.rb'
    CFPropertyList.xml_parser_interface = CFPropertyList::NokogiriXMLParser
  rescue LoadError
    require dirname + '/rbREXMLParser.rb'
    CFPropertyList.xml_parser_interface = CFPropertyList::ReXMLParser
  end
end


module CFPropertyList
  # Create CFType hierarchy by guessing the correct CFType, e.g.
  #
  #  x = {
  #    'a' => ['b','c','d']
  #  }
  #  cftypes = CFPropertyList.guess(x)
  #
  # pass optional options hash. Only possible value actually:
  # +convert_unknown_to_string+::   Convert unknown objects to string calling to_str()
  # +converter_method+::    Convert unknown objects to known objects calling +method_name+
  #
  #  cftypes = CFPropertyList.guess(x,:convert_unknown_to_string => true,:converter_method => :to_hash, :converter_with_opts => true)
  def guess(object, options = {})
    case object
    when Integer               then CFInteger.new(object)
    when UidFixnum             then CFUid.new(object)
    when Float                 then CFReal.new(object)
    when TrueClass, FalseClass then CFBoolean.new(object)

    when Blob
      CFData.new(object, CFData::DATA_RAW)

    when String, Symbol
      CFString.new(object.to_s)

    when Time, DateTime, Date
      CFDate.new(object)

    when Array, Enumerator
      ary = Array.new
      object.each do |o|
        ary.push CFPropertyList.guess(o, options)
      end
      CFArray.new(ary)

    when Hash
      hsh = Hash.new
      object.each_pair do |k,v|
        k = k.to_s if k.is_a?(Symbol)
        hsh[k] = CFPropertyList.guess(v, options)
      end
      CFDictionary.new(hsh)
    else
      case
      when Object.const_defined?('BigDecimal') && object.is_a?(BigDecimal)
        CFReal.new(object)
      when object.respond_to?(:read)
        raw_data = object.read
        # treat the data as a bytestring (ASCII-8BIT) if Ruby supports it.  Do this by forcing
        # the encoding, on the assumption that the bytes were read correctly, and just tagged with
        # an inappropriate encoding, rather than transcoding.
        raw_data.force_encoding(Encoding::ASCII_8BIT) if raw_data.respond_to?(:force_encoding)
        CFData.new(raw_data, CFData::DATA_RAW)
      when options[:converter_method] && object.respond_to?(options[:converter_method])
        if options[:converter_with_opts]
          CFPropertyList.guess(object.send(options[:converter_method],options),options)
        else
          CFPropertyList.guess(object.send(options[:converter_method]),options)
        end
      when options[:convert_unknown_to_string]
        CFString.new(object.to_s)
      else
        raise CFTypeError.new("Unknown class #{object.class.to_s}. Try using :convert_unknown_to_string if you want to use unknown object types!")
      end
    end
  end

  # Converts a CFType hiercharchy to native Ruby types
  def native_types(object,keys_as_symbols=false)
    return if object.nil?

    if(object.is_a?(CFDate) || object.is_a?(CFString) || object.is_a?(CFInteger) || object.is_a?(CFReal) || object.is_a?(CFBoolean)) || object.is_a?(CFUid) then
      return object.value
    elsif(object.is_a?(CFData)) then
      return CFPropertyList::Blob.new(object.decoded_value)
    elsif(object.is_a?(CFArray)) then
      ary = []
      object.value.each do
        |v|
        ary.push CFPropertyList.native_types(v)
      end

      return ary
    elsif(object.is_a?(CFDictionary)) then
      hsh = {}
      object.value.each_pair do
        |k,v|
        k = k.to_sym if keys_as_symbols
        hsh[k] = CFPropertyList.native_types(v)
      end

      return hsh
    end
  end

  module_function :guess, :native_types

  # Class representing a CFPropertyList. Instantiate with #new
  class List
    # Format constant for binary format
    FORMAT_BINARY = 1

    # Format constant for XML format
    FORMAT_XML = 2

    # Format constant for the old plain format
    FORMAT_PLAIN = 3

    # Format constant for automatic format recognizing
    FORMAT_AUTO = 0

    @@parsers = [Binary, CFPropertyList.xml_parser_interface, PlainParser]

    # Path of PropertyList
    attr_accessor :filename
    # the original format of the PropertyList
    attr_accessor :format
    # the root value in the plist file
    attr_accessor :value
    # default value for XML generation; if true generate formatted XML
    attr_accessor :formatted

    # initialize a new CFPropertyList, arguments are:
    #
    # :file:: Parse a file
    # :format:: Format is one of FORMAT_BINARY or FORMAT_XML. Defaults to FORMAT_AUTO
    # :data:: Parse a string
    #
    # All arguments are optional
    def initialize(opts={})
      @filename = opts[:file]
      @format = opts[:format] || FORMAT_AUTO
      @data = opts[:data]
      @formatted = opts[:formatted]

      load(@filename) unless @filename.nil?
      load_str(@data) unless @data.nil?
    end

    # returns a list of registered parsers
    def self.parsers
      @@parsers
    end

    # set a list of parsers
    def self.parsers=(val)
      @@parsers = val
    end

    # Load an XML PropertyList
    # filename = nil:: The filename to read from; if nil, read from the file defined by instance variable +filename+
    def load_xml(filename=nil)
      load(filename,List::FORMAT_XML)
    end

    # read a binary plist file
    # filename = nil:: The filename to read from; if nil, read from the file defined by instance variable +filename+
    def load_binary(filename=nil)
      load(filename,List::FORMAT_BINARY)
    end

    # read a plain plist file
    # filename = nil:: The filename to read from; if nil, read from the file defined by instance variable +filename+
    def load_plain(filename=nil)
      load(filename,List::FORMAT_PLAIN)
    end

    # load a plist from a XML string
    # str:: The string containing the plist
    def load_xml_str(str=nil)
      load_str(str,List::FORMAT_XML)
    end

    # load a plist from a binary string
    # str:: The string containing the plist
    def load_binary_str(str=nil)
      load_str(str,List::FORMAT_BINARY)
    end

    # load a plist from a plain string
    # str:: The string containing the plist
    def load_plain_str(str=nil)
      load_str(str,List::FORMAT_PLAIN)
    end

    # load a plist from a string
    # str = nil:: The string containing the plist
    # format = nil:: The format of the plist
    def load_str(str=nil,format=nil)
      str = @data if str.nil?
      format = @format if format.nil?

      @value = {}
      case format
      when List::FORMAT_BINARY, List::FORMAT_XML, List::FORMAT_PLAIN then
        prsr = @@parsers[format-1].new
        @value = prsr.load({:data => str})

      when List::FORMAT_AUTO then # what we now do is ugly, but neccessary to recognize the file format
        filetype = str[0..5]
        version = str[6..7]

        prsr = nil

        if filetype == "bplist" then
          raise CFFormatError.new("Wrong file version #{version}") unless version == "00"
          prsr = Binary.new
          @format = List::FORMAT_BINARY
        else
          if str =~ /^<(\?xml|!DOCTYPE|plist)/
            prsr = CFPropertyList.xml_parser_interface.new
            @format = List::FORMAT_XML
          else
            prsr = PlainParser.new
            @format = List::FORMAT_PLAIN
          end
        end

        @value = prsr.load({:data => str})
      end
    end

    # Read a plist file
    # file = nil:: The filename of the file to read. If nil, use +filename+ instance variable
    # format = nil:: The format of the plist file. Auto-detect if nil
    def load(file=nil,format=nil)
      file = @filename if file.nil?
      format = @format if format.nil?
      @value = {}

      raise IOError.new("File #{file} not readable!") unless File.readable? file

      case format
      when List::FORMAT_BINARY, List::FORMAT_XML, List::FORMAT_PLAIN then
        prsr = @@parsers[format-1].new
        @value = prsr.load({:file => file})

      when List::FORMAT_AUTO then # what we now do is ugly, but neccessary to recognize the file format
        magic_number = IO.read(file,12)
        raise IOError.new("File #{file} is empty.") unless magic_number
        filetype = magic_number[0..5]
        version = magic_number[6..7]

        prsr = nil
        if filetype == "bplist" then
          raise CFFormatError.new("Wrong file version #{version}") unless version == "00"
          prsr = Binary.new
          @format = List::FORMAT_BINARY
        else
          if magic_number =~ /^<(\?xml|!DOCTYPE|plist)/
            prsr = CFPropertyList.xml_parser_interface.new
            @format = List::FORMAT_XML
          else
            prsr = PlainParser.new
            @format = List::FORMAT_PLAIN
          end
        end

        @value = prsr.load({:file => file})
      end

      raise CFFormatError.new("Invalid format or parser error!") if @value.nil?
    end

    # Serialize CFPropertyList object to specified format and write it to file
    # file = nil:: The filename of the file to write to. Uses +filename+ instance variable if nil
    # format = nil:: The format to save in. Uses +format+ instance variable if nil
    def save(file=nil,format=nil,opts={})
      format = @format if format.nil?
      file = @filename if file.nil?

      if format != FORMAT_BINARY && format != FORMAT_XML && format != FORMAT_PLAIN
        raise CFFormatError.new("Format #{format} not supported, use List::FORMAT_BINARY or List::FORMAT_XML")
      end

      if(!File.exist?(file)) then
        raise IOError.new("File #{file} not writable!") unless File.writable?(File.dirname(file))
      elsif(!File.writable?(file)) then
        raise IOError.new("File #{file} not writable!")
      end

      opts[:root] = @value
      opts[:formatted] = @formatted unless opts.has_key?(:formatted)

      prsr = @@parsers[format-1].new

      content = prsr.to_str(opts)

      File.open(file, 'wb') {
        |fd|
        fd.write content
      }
    end

    # convert plist to string
    # format = List::FORMAT_BINARY:: The format to save the plist
    # opts={}:: Pass parser options
    def to_str(format=List::FORMAT_BINARY,opts={})
      if format != FORMAT_BINARY && format != FORMAT_XML && format != FORMAT_PLAIN
        raise CFFormatError.new("Format #{format} not supported, use List::FORMAT_BINARY or List::FORMAT_XML")
      end

      prsr = @@parsers[format-1].new

      opts[:root] = @value
      opts[:formatted] = @formatted unless opts.has_key?(:formatted)

      return prsr.to_str(opts)
    end
  end
end


class Array
  # convert an array to plist format
  def to_plist(options={})
    options[:plist_format] ||= CFPropertyList::List::FORMAT_BINARY

    plist = CFPropertyList::List.new
    plist.value = CFPropertyList.guess(self, options)
    plist.to_str(options[:plist_format], options)
  end
end

class Enumerator
  # convert an array to plist format
  def to_plist(options={})
    options[:plist_format] ||= CFPropertyList::List::FORMAT_BINARY

    plist = CFPropertyList::List.new
    plist.value = CFPropertyList.guess(self, options)
    plist.to_str(options[:plist_format], options)
  end
end

class Hash
  # convert a hash to plist format
  def to_plist(options={})
    options[:plist_format] ||= CFPropertyList::List::FORMAT_BINARY

    plist = CFPropertyList::List.new
    plist.value = CFPropertyList.guess(self, options)
    plist.to_str(options[:plist_format], options)
  end
end

# eof
