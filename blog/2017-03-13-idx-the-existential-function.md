---
title: idx: The Existential Function
author: Timothy Yung
authorTitle: Engineering Manager at Facebook
authorURL: https://github.com/yungsters
authorImage: https://pbs.twimg.com/profile_images/1592444107/image.jpg
authorTwitter: yungsters
category: engineering
---

At Facebook, we often need to access deeply nested values in data structures fetched with GraphQL. On the way to accessing these deeply nested values, it is common for one or more intermediate fields to be nullable. These intermediate fields may be null for a variety of reasons, from failed privacy checks to the mere fact that null happens to be the most flexible way to represent non-fatal errors.

Unfortunately, accessing these deeply nested values is currently tedious and verbose.

```javascript
props.user &&
props.user.friends &&
props.user.friends[0] &&
props.user.friends[0].friends
```

There is [an ECMAScript proposal to introduce the existential operator](https://github.com/claudepache/es-optional-chaining) which will make this much more convenient. But until a time when that proposal is finalized, we want a solution that improves our quality of life, maintains existing language semantics, and encourages type safety with Flow.

We came up with an existential _function_ we call `idx`.

```javascript
idx(props, _ => _.user.friends[0].friends)
```

The invocation in this code snippet behaves similarly to the boolean expression in the code snippet above, except with significantly less repetition. The `idx` function takes exactly two arguments:

- Any value, typically an object or array into which you want to access a nested value.
- A function that receives the first argument and accesses a nested value on it.

In theory, the `idx` function will try-catch errors that are the result of accessing properties on null or undefined. If such an error is caught, it will return either null or undefined. (And you can see how this might be implemented in [idx.js](https://github.com/facebookincubator/idx/blob/master/packages/idx/src/idx.js).)

In practice, try-catching every nested property access is slow, and differentiating between specific kinds of TypeErrors is fragile. To deal with these shortcomings, we created a Babel plugin that transforms the above `idx` invocation into the following expression:

```javascript
props.user == null ? props.user :
props.user.friends == null ? props.user.friends :
props.user.friends[0] == null ? props.user.friends[0] :
props.user.friends[0].friends
```

Finally, we added a custom Flow type declaration for `idx` that allows the traversal in the second argument to be properly type-checked while permitting nested access on nullable properties.

The function, Babel plugin, and Flow declaration are now [available on GitHub](https://github.com/facebookincubator/idx). They are used by installing the **idx** and **babel-plugin-idx** npm packages, and adding “idx” to the list of plugins in your `.babelrc` file.
