`folly/DynamicConverter.h`
--------------------------

When dynamic objects contain data of a known type, it is sometimes
useful to have its well-typed representation. A broad set of
type-conversions are contained in `DynamicConverter.h`, and
facilitate the transformation of dynamic objects into their well-typed
format.

### Usage
***

Simply pass a dynamic into a templated convertTo:

```
    dynamic d = { { 1, 2, 3 }, { 4, 5 } }; // a vector of vector of int
    auto vvi = convertTo<fbvector<fbvector<int>>>(d);
```

### Supported Types
***

convertTo naturally supports conversions to

1. arithmetic types (such as int64_t, unsigned short, bool, and double)
2. fbstring, std::string
3. containers and map-containers

NOTE:

convertTo<Type> will assume that Type is a container if
* it has a Type::value_type, and
* it has a Type::iterator, and
* it has a constructor that accepts two InputIterators

Additionally, convertTo<Type> will assume that Type is a map if
* it has a Type::key_type, and
* it has a Type::mapped_type, and
* value_type is a pair of const key_type and mapped_type

If Type meets the container criteria, then it will be constructed
by calling its InputIterator constructor.

### Customization
***

If you want to use convertTo to convert dynamics into your own custom
class, then all you have to do is provide a template specialization
of DynamicConverter with the static method convert. Make sure you put it
in namespace folly.

Example:

``` Cpp
    struct Token {
      int kind_;
      fbstring lexeme_;
      
      explicit Token(int kind, const fbstring& lexeme)
        : kind_(kind), lexeme_(lexeme) {}
    };
    namespace folly {
    template <> struct DynamicConverter<Token> {
      static Token convert(const dynamic& d) {
        int k = convertTo<int>(d["KIND"]);
        fbstring lex = convertTo<fbstring>(d["LEXEME"]);
        return Token(k, lex);
      }
    };
    }
```
