# Public Suffix <small>for Ruby</small>

<tt>PublicSuffix</tt> is a Ruby domain name parser based on the [Public Suffix List](https://publicsuffix.org/).

[![Build Status](https://github.com/weppos/publicsuffix-ruby/actions/workflows/tests.yml/badge.svg)](https://github.com/weppos/publicsuffix-ruby/actions/workflows/tests.yml)
[![Tidelift dependencies](https://tidelift.com/badges/package/rubygems/public_suffix)](https://tidelift.com/subscription/pkg/rubygems-public-suffix?utm_source=rubygems-public-suffix&utm_medium=referral&utm_campaign=enterprise)


## Links

- [Homepage](https://simonecarletti.com/code/publicsuffix-ruby)
- [Repository](https://github.com/weppos/publicsuffix-ruby)
- [API Documentation](https://rubydoc.info/gems/public_suffix)
- [Introducing the Public Suffix List library for Ruby](https://simonecarletti.com/blog/2010/06/public-suffix-list-library-for-ruby/)


## Requirements

<tt>PublicSuffix</tt> requires **Ruby >= 2.3**. For an older versions of Ruby use a previous release.


## Installation

You can install the gem manually:

```shell
gem install public_suffix
```

Or use Bundler and define it as a dependency in your `Gemfile`:

```ruby
gem 'public_suffix'
```

If you are upgrading to 2.0, see [2.0-Upgrade.md](2.0-Upgrade.md).

## Usage

Extract the domain out from a name:

```ruby
PublicSuffix.domain("google.com")
# => "google.com"
PublicSuffix.domain("www.google.com")
# => "google.com"
PublicSuffix.domain("www.google.co.uk")
# => "google.co.uk"
```

Parse a domain without subdomains:

```ruby
domain = PublicSuffix.parse("google.com")
# => #<PublicSuffix::Domain>
domain.tld
# => "com"
domain.sld
# => "google"
domain.trd
# => nil
domain.domain
# => "google.com"
domain.subdomain
# => nil
```

Parse a domain with subdomains:

```ruby
domain = PublicSuffix.parse("www.google.com")
# => #<PublicSuffix::Domain>
domain.tld
# => "com"
domain.sld
# => "google"
domain.trd
# => "www"
domain.domain
# => "google.com"
domain.subdomain
# => "www.google.com"
```

Simple validation example:

```ruby
PublicSuffix.valid?("google.com")
# => true

PublicSuffix.valid?("www.google.com")
# => true

# Explicitly forbidden, it is listed as a private domain
PublicSuffix.valid?("blogspot.com")
# => false

# Unknown/not-listed TLD domains are valid by default
PublicSuffix.valid?("example.tldnotlisted")
# => true
```

Strict validation (without applying the default * rule):

```ruby
PublicSuffix.valid?("example.tldnotlisted", default_rule: nil)
# => false
```


## Fully Qualified Domain Names

This library automatically recognizes Fully Qualified Domain Names. A FQDN is a domain name that end with a trailing dot.

```ruby
# Parse a standard domain name
PublicSuffix.domain("www.google.com")
# => "google.com"

# Parse a fully qualified domain name
PublicSuffix.domain("www.google.com.")
# => "google.com"
```

## Private domains

This library has support for switching off support for private (non-ICANN).

```ruby
# Extract a domain including private domains (by default)
PublicSuffix.domain("something.blogspot.com")
# => "something.blogspot.com"

# Extract a domain excluding private domains
PublicSuffix.domain("something.blogspot.com", ignore_private: true)
# => "blogspot.com"

# It also works for #parse and #valid?
PublicSuffix.parse("something.blogspot.com", ignore_private: true)
PublicSuffix.valid?("something.blogspot.com", ignore_private: true)
```

If you don't care about private domains at all, it's more efficient to exclude them when the list is parsed:

```ruby
# Disable support for private TLDs
PublicSuffix::List.default = PublicSuffix::List.parse(File.read(PublicSuffix::List::DEFAULT_LIST_PATH), private_domains: false)
# => "blogspot.com"
PublicSuffix.domain("something.blogspot.com")
# => "blogspot.com"
```


## What is the Public Suffix List?

The [Public Suffix List](https://publicsuffix.org) is a cross-vendor initiative to provide an accurate list of domain name suffixes.

The Public Suffix List is an initiative of the Mozilla Project, but is maintained as a community resource. It is available for use in any software, but was originally created to meet the needs of browser manufacturers.

A "public suffix" is one under which Internet users can directly register names. Some examples of public suffixes are ".com", ".co.uk" and "pvt.k12.wy.us". The Public Suffix List is a list of all known public suffixes.


## Why the Public Suffix List is better than any available Regular Expression parser?

Previously, browsers used an algorithm which basically only denied setting wide-ranging cookies for top-level domains with no dots (e.g. com or org). However, this did not work for top-level domains where only third-level registrations are allowed (e.g. co.uk). In these cases, websites could set a cookie for co.uk which will be passed onto every website registered under co.uk.

Clearly, this was a security risk as it allowed websites other than the one setting the cookie to read it, and therefore potentially extract sensitive information.

Since there is no algorithmic method of finding the highest level at which a domain may be registered for a particular top-level domain (the policies differ with each registry), the only method is to create a list of all top-level domains and the level at which domains can be registered. This is the aim of the effective TLD list.

As well as being used to prevent cookies from being set where they shouldn't be, the list can also potentially be used for other applications where the registry controlled and privately controlled parts of a domain name need to be known, for example when grouping by top-level domains.

Source: https://wiki.mozilla.org/Public_Suffix_List

Not convinced yet? Check out [this real world example](https://stackoverflow.com/q/288810/123527).


## Does <tt>PublicSuffix</tt> make requests to Public Suffix List website?

No. <tt>PublicSuffix</tt> comes with a bundled list. It does not make any HTTP requests to parse or validate a domain.


## Support

Library documentation is auto-generated from the [README](https://github.com/weppos/publicsuffix-ruby/blob/master/README.md) and the source code, and it's available at https://rubydoc.info/gems/public_suffix.

- The PublicSuffix bug tracker is here: https://github.com/weppos/publicsuffix-ruby/issues
- The PublicSuffix code repository is here: https://github.com/weppos/publicsuffix-ruby. Contributions are welcome! Please include tests and/or feature coverage for every patch, and create a topic branch for every separate change you make.

[Consider subscribing to Tidelift which provides Enterprise support for this project](https://tidelift.com/subscription/pkg/rubygems-public-suffix?utm_source=rubygems-public-suffix&utm_medium=referral&utm_campaign=readme) as part of the Tidelift Subscription. Tidelift subscriptions also help the maintainers by funding the project, which in turn allows us to ship releases, bugfixes, and security updates more often.


## Security and Vulnerability Reporting

Full information and description of our security policy please visit [`SECURITY.md`](SECURITY.md)


## Changelog

See the [CHANGELOG.md](CHANGELOG.md) file for details.


## License

Copyright (c) 2009-2022 Simone Carletti. This is Free Software distributed under the MIT license.

The [Public Suffix List source](https://publicsuffix.org/list/) is subject to the terms of the Mozilla Public License, v. 2.0.

## Definitions

tld = Top level domain, this is in reference to the last segment of a domain, sometimes the part that is directly after the "dot" symbol. For example, `mozilla.org`, the `.org` portion is the tld.

sld = Second level domain, a domain that is directly below a top-level domain. For example, in `https://www.mozilla.org/en-US/`, `mozilla` is the second-level domain of the .org tld.

trd = Transit routing domain, or known as a subdomain. This is the part of the domain that is before the sld or root domain. For example, in `https://www.mozilla.org/en-US/`, `www` is the trd.

FQDN = Fully Qualified Domain Names, are domain names that are written with the hostname and the domain name, and include the top-level domain, the format looks like `[hostname].[domain].[tld].` for ex. `[www].[mozilla].[org]`. 
