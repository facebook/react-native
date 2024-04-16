CFPropertyList implementation
class to read, manipulate and write both XML and binary property list
files (plist(5)) as defined by Apple. Have a look at CFPropertyList::List
for more documentation.

# Caution!

In version 3.0.0 we dropped Ruby 1.8 compatibility. If you are using
Ruby 1.8 consider to update Ruby; if you can't upgrade, don't upgrade
CFPropertyList.

# Installation

You could either use ruby gems and install it via
    
```bash
gem install CFPropertyList
```

or you could clone this repository and place it somewhere in your load path.

Example:
```ruby
require 'cfpropertylist'
```

If you're using Rails, you can add it into your Gemfile

```ruby
gem 'CFPropertyList'
```

# Usage

  ## create a arbitrary data structure of basic data types
  
```ruby
data = {
  'name' => 'John Doe',
  'missing' => true,
  'last_seen' => Time.now,
  'friends' => ['Jane Doe','Julian Doe'],
  'likes' => {
    'me' => false
  }
}
```

## create CFPropertyList::List object
  
```ruby
plist = CFPropertyList::List.new
```

## call CFPropertyList.guess() to create corresponding CFType values

```ruby  
plist.value = CFPropertyList.guess(data)
```

## write plist to file
```ruby
plist.save("example.plist", CFPropertyList::List::FORMAT_BINARY)
```

## … later, read it again
```ruby  
plist = CFPropertyList::List.new(:file => "example.plist")
data = CFPropertyList.native_types(plist.value)
```

# Author and license

**Author:**    Christian Kruse (mailto:cjk@wwwtech.de)

**Copyright:** Copyright (c) 2010

**License:**   MIT License

