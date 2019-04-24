'folly/Traits.h'
-----------------

Implements traits complementary to those provided in <type_traits>

  * Implements `IsRelocatable` trait.
  * Implements `IsOneOf` trait
  * Macros to state the assumptions easily

### Motivation
***

`<type_traits>` is the Standard type-traits library defining a variety of traits
such as `is_integral` or `is_floating_point`. This helps to gain more
information about a given type.

`folly/Traits.h` implements traits complementing those present in the Standard.


### IsRelocatable
***

In C++, the default way to move an object is by 
calling the copy constructor and destroying the old copy 
instead of directly copying the memory contents by using memcpy(). 
The conservative approach of moving an object assumes that the copied 
object is not relocatable. 
The two following code sequences should be semantically equivalent for a
relocatable type:

```Cpp
{
  void conservativeMove(T * from, T * to) {
    new(to) T(from);
    (*from).~T();
  }
}

{
  void optimizedMove(T * from, T * to) {
    memcpy(to, from, sizeof(T));
  }
}
```

Very few C++ types are non-relocatable.
The type defined below maintains a pointer inside an embedded buffer and 
hence would be non-relocatable. Moving the object by simply copying its 
memory contents would leave the internal pointer pointing to the old buffer.

```Cpp
class NonRelocatableType {
private:
  char buffer[1024];
  char * pointerToBuffer;
  ...
public:
  NonRelocatableType() : pointerToBuffer(buffer) {}
  ...
};
```

We can optimize the task of moving a relocatable type T using memcpy. 
IsRelocatable<T>::value describes the ability of moving around memory 
a value of type T by using memcpy.

### Usage
***

  * Declaring types

    ```Cpp
    template <class T1, class T2>
    class MyParameterizedType;

    class MySimpleType;
    ```

  * Declaring a type as relocatable

    Appending the lines below after definition of My*Type 
    (`MyParameterizedType` or `MySimpleType`) will declare it as relocatable

    ```Cpp
    /* Definition of My*Type goes here */
    // global namespace (not inside any namespace)
    namespace folly {
      // defining specialization of IsRelocatable for MySimpleType
      template <>
      struct IsRelocatable<MySimpleType> : std::true_type {};
      // defining specialization of IsRelocatable for MyParameterizedType
      template <class T1, class T2>
      struct IsRelocatable<MyParameterizedType<T1, T2>>
          : ::std::true_type {};
    }
    ```

  * To make it easy to state assumptions for a regular type or a family of 
    parameterized type, various macros can be used as shown below.

  * Stating that a type is Relocatable using a macro

    ```Cpp
    // global namespace
    namespace folly {
      // For a Regular Type
      FOLLY_ASSUME_RELOCATABLE(MySimpleType);
      // For a Parameterized Type
      FOLLY_ASSUME_RELOCATABLE(MyParameterizedType<T1, T2>);
    }
    ```

`fbvector` only works with relocatable objects. If assumptions are not stated 
explicitly, `fbvector<MySimpleType>` or `fbvector<MyParameterizedType>` 
will fail to compile due to assertion below:

```Cpp
static_assert(IsRelocatable<My*Type>::value, "");
```

FOLLY_ASSUME_FBVECTOR_COMPATIBLE*(type) macros can be used to state that type 
is relocatable and has nothrow constructor.

  * Stating that a type is `fbvector-compatible` using macros
    i.e. relocatable and has nothrow default constructor

    ```Cpp
    // at global level, i.e no namespace
    // macro for regular type
    FOLLY_ASSUME_FBVECTOR_COMPATIBLE(MySimpleType)
    // macro for types having 2 template parameters (MyParameterizedType)
    FOLLY_ASSUME_FBVECTOR_COMPATIBLE_2(MyParameterizedType)
    ```

Similarly, 

  * FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1(MyTypeHavingOneParameter) macro is 
    for family of parameterized types having 1 parameter

  * FOLLY_ASSUME_FBVECTOR_COMPATIBLE_3(MyTypeHavingThreeParameters) macro is 
    for family of parameterized types having 3 parameters

  * FOLLY_ASSUME_FBVECTOR_COMPATIBLE_4(MyTypeHavingFourParameters) macro is 
    for family of parameterized types having 4 parameters

Few common types, namely `std::basic_string`, `std::vector`, `std::list`,
`std::map`, `std::deque`, `std::set`, `std::unique_ptr`, `std::shared_ptr`,
`std::function`, which are compatible with `fbvector` are already instantiated
and declared compatible with `fbvector`. `fbvector` can be directly used with
any of these C++ types.

`std::pair` can be safely assumed to be compatible with `fbvector` if both of
its components are.

### IsOneOf
***

`std::is_same<T1, T2>::value` can be used to test if types of T1 and T2 are
same. `folly::IsOneOf<T, T1, Ts...>::value` can be used to test if type of T1
matches the type of one of the other template parameter, T1, T2, ...Tn.
Recursion is used to implement this type trait.
