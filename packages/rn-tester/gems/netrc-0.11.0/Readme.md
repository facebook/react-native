# Netrc

This library reads and writes
[`.netrc` files](http://www.gnu.org/software/inetutils/manual/html_node/The-_002enetrc-file.html).

## API

Read a netrc file:

    n = Netrc.read("sample.netrc")

If the file doesn't exist, Netrc.read will return an empty object. If
the filename ends in ".gpg", it will be decrypted using
[GPG](http://www.gnupg.org/).

Read the user's default netrc file.

**On Unix:** `$NETRC/.netrc` or `$HOME/.netrc` (whichever is set first).

**On Windows:** `%NETRC%\_netrc`, `%HOME%\_netrc`, `%HOMEDRIVE%%HOMEPATH%\_netrc`, or `%USERPROFILE%\_netrc` (whichever is set first).

    n = Netrc.read

Configure netrc to allow permissive files (with permissions other than 0600):

    Netrc.configure do |config|
      config[:allow_permissive_netrc_file] = true
    end

Look up a username and password:

    user, pass = n["example.com"]

Write a username and password:

    n["example.com"] = user, newpass
    n.save

If you make an entry that wasn't there before, it will be appended
to the end of the file. Sometimes people want to include a comment
explaining that the entry was added automatically. You can do it
like this:

    n.new_item_prefix = "# This entry was added automatically\n"
    n["example.com"] = user, newpass
    n.save

Have fun!

## Running Tests

    $ bundle install
    $ bundle exec ruby -e 'Dir.glob "./test/**/test_*.rb", &method(:require)'
