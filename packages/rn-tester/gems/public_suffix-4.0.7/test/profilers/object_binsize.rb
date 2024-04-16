require 'tempfile'

# A very simple memory profiles that checks the full size of a variable
# by serializing into a binary file.
#
# Yes, I know this is very rough, but there are cases where ObjectSpace.memsize_of
# doesn't cooperate, and this is one of the possible workarounds.
#
# For certain cases, it works (TM).
class ObjectBinsize

  def measure(var, label: nil)
    dump(var, label: label)
  end

  def report(var, label: nil, padding: 10)
    file = measure(var, label: label)

    size = format_integer(file.size)
    name = label || File.basename(file.path)
    printf("%#{padding}s   %s\n", size, name)
  end

  private

  def dump(var, **args)
    file = Tempfile.new(args[:label].to_s)
    file.write(Marshal.dump(var))
    file
  ensure
    file.close
  end

  def format_integer(int)
    int.to_s.reverse.gsub(/...(?=.)/, '\&,').reverse
  end

end

if __FILE__ == $0
  prof = ObjectBinsize.new

  prof.report(nil, label: "nil")
  prof.report(false, label: "false")
  prof.report(true, label: "true")
  prof.report(0, label: "integer")
  prof.report("", label: "empty string")
  prof.report({}, label: "empty hash")
  prof.report({}, label: "empty array")

  prof.report({ foo: "1" }, label: "hash 1 item (symbol)")
  prof.report({ foo: "1", bar: 2 }, label: "hash 2 items (symbol)")
  prof.report({ "foo" => "1" }, label: "hash 1 item (string)")
  prof.report({ "foo" => "1", "bar" => 2 }, label: "hash 2 items (string)")

  prof.report("big string" * 200, label: "big string * 200")
end
