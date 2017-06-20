---
id: colors
title: Color Reference
layout: docs
category: Guides
permalink: docs/colors.html
next: integration-with-existing-apps
previous: direct-manipulation
---

Components in React Native are [styled using JavaScript](docs/style.html). Color properties usually match how [CSS works on the web](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

### Red-green-blue

React Native supports `rgb()` and `rgba()` in both hexadecimal and functional notation:

- `'#f0f'` (#rgb)
- `'#ff00ff'` (#rrggbb)

- `'rgb(255, 0, 255)'`
- `'rgba(255, 255, 255, 1.0)'`

- `'#f0ff'` (#rgba)
- `'#ff00ff00'` (#rrggbbaa)

### Hue-saturation-lightness

`hsl()` and `hsla()` is supported in functional notation:

- `'hsl(360, 100%, 100%)'`
- `'hsla(360, 100%, 100%, 1.0)'`

### `transparent`

This is a shortcut for `rgba(0,0,0,0)`:

- `'transparent'`

### Named colors

You can also use color names as values. React Native follows the [CSS3 specification](http://www.w3.org/TR/css3-color/#svg-color):

- <color aliceblue /> aliceblue (#f0f8ff)
- <color antiquewhite /> antiquewhite (#faebd7)
- <color aqua /> aqua (#00ffff)
- <color aquamarine /> aquamarine (#7fffd4)
- <color azure /> azure (#f0ffff)
- <color beige /> beige (#f5f5dc)
- <color bisque /> bisque (#ffe4c4)
- <color black /> black (#000000)
- <color blanchedalmond /> blanchedalmond (#ffebcd)
- <color blue /> blue (#0000ff)
- <color blueviolet /> blueviolet (#8a2be2)
- <color brown /> brown (#a52a2a)
- <color burlywood /> burlywood (#deb887)
- <color cadetblue /> cadetblue (#5f9ea0)
- <color chartreuse /> chartreuse (#7fff00)
- <color chocolate /> chocolate (#d2691e)
- <color coral /> coral (#ff7f50)
- <color cornflowerblue /> cornflowerblue (#6495ed)
- <color cornsilk /> cornsilk (#fff8dc)
- <color crimson /> crimson (#dc143c)
- <color cyan /> cyan (#00ffff)
- <color darkblue /> darkblue (#00008b)
- <color darkcyan /> darkcyan (#008b8b)
- <color darkgoldenrod /> darkgoldenrod (#b8860b)
- <color darkgray /> darkgray (#a9a9a9)
- <color darkgreen /> darkgreen (#006400)
- <color darkgrey /> darkgrey (#a9a9a9)
- <color darkkhaki /> darkkhaki (#bdb76b)
- <color darkmagenta /> darkmagenta (#8b008b)
- <color darkolivegreen /> darkolivegreen (#556b2f)
- <color darkorange /> darkorange (#ff8c00)
- <color darkorchid /> darkorchid (#9932cc)
- <color darkred /> darkred (#8b0000)
- <color darksalmon /> darksalmon (#e9967a)
- <color darkseagreen /> darkseagreen (#8fbc8f)
- <color darkslateblue /> darkslateblue (#483d8b)
- <color darkslategrey /> darkslategrey (#2f4f4f)
- <color darkturquoise /> darkturquoise (#00ced1)
- <color darkviolet /> darkviolet (#9400d3)
- <color deeppink /> deeppink (#ff1493)
- <color deepskyblue /> deepskyblue (#00bfff)
- <color dimgray /> dimgray (#696969)
- <color dimgrey /> dimgrey (#696969)
- <color dodgerblue /> dodgerblue (#1e90ff)
- <color firebrick /> firebrick (#b22222)
- <color floralwhite /> floralwhite (#fffaf0)
- <color forestgreen /> forestgreen (#228b22)
- <color fuchsia /> fuchsia (#ff00ff)
- <color gainsboro /> gainsboro (#dcdcdc)
- <color ghostwhite /> ghostwhite (#f8f8ff)
- <color gold /> gold (#ffd700)
- <color goldenrod /> goldenrod (#daa520)
- <color gray /> gray (#808080)
- <color green /> green (#008000)
- <color greenyellow /> greenyellow (#adff2f)
- <color grey /> grey (#808080)
- <color honeydew /> honeydew (#f0fff0)
- <color hotpink /> hotpink (#ff69b4)
- <color indianred /> indianred (#cd5c5c)
- <color indigo /> indigo (#4b0082)
- <color ivory /> ivory (#fffff0)
- <color khaki /> khaki (#f0e68c)
- <color lavender /> lavender (#e6e6fa)
- <color lavenderblush /> lavenderblush (#fff0f5)
- <color lawngreen /> lawngreen (#7cfc00)
- <color lemonchiffon /> lemonchiffon (#fffacd)
- <color lightblue /> lightblue (#add8e6)
- <color lightcoral /> lightcoral (#f08080)
- <color lightcyan /> lightcyan (#e0ffff)
- <color lightgoldenrodyellow /> lightgoldenrodyellow (#fafad2)
- <color lightgray /> lightgray (#d3d3d3)
- <color lightgreen /> lightgreen (#90ee90)
- <color lightgrey /> lightgrey (#d3d3d3)
- <color lightpink /> lightpink (#ffb6c1)
- <color lightsalmon /> lightsalmon (#ffa07a)
- <color lightseagreen /> lightseagreen (#20b2aa)
- <color lightskyblue /> lightskyblue (#87cefa)
- <color lightslategrey /> lightslategrey (#778899)
- <color lightsteelblue /> lightsteelblue (#b0c4de)
- <color lightyellow /> lightyellow (#ffffe0)
- <color lime /> lime (#00ff00)
- <color limegreen /> limegreen (#32cd32)
- <color linen /> linen (#faf0e6)
- <color magenta /> magenta (#ff00ff)
- <color maroon /> maroon (#800000)
- <color mediumaquamarine /> mediumaquamarine (#66cdaa)
- <color mediumblue /> mediumblue (#0000cd)
- <color mediumorchid /> mediumorchid (#ba55d3)
- <color mediumpurple /> mediumpurple (#9370db)
- <color mediumseagreen /> mediumseagreen (#3cb371)
- <color mediumslateblue /> mediumslateblue (#7b68ee)
- <color mediumspringgreen /> mediumspringgreen (#00fa9a)
- <color mediumturquoise /> mediumturquoise (#48d1cc)
- <color mediumvioletred /> mediumvioletred (#c71585)
- <color midnightblue /> midnightblue (#191970)
- <color mintcream /> mintcream (#f5fffa)
- <color mistyrose /> mistyrose (#ffe4e1)
- <color moccasin /> moccasin (#ffe4b5)
- <color navajowhite /> navajowhite (#ffdead)
- <color navy /> navy (#000080)
- <color oldlace /> oldlace (#fdf5e6)
- <color olive /> olive (#808000)
- <color olivedrab /> olivedrab (#6b8e23)
- <color orange /> orange (#ffa500)
- <color orangered /> orangered (#ff4500)
- <color orchid /> orchid (#da70d6)
- <color palegoldenrod /> palegoldenrod (#eee8aa)
- <color palegreen /> palegreen (#98fb98)
- <color paleturquoise /> paleturquoise (#afeeee)
- <color palevioletred /> palevioletred (#db7093)
- <color papayawhip /> papayawhip (#ffefd5)
- <color peachpuff /> peachpuff (#ffdab9)
- <color peru /> peru (#cd853f)
- <color pink /> pink (#ffc0cb)
- <color plum /> plum (#dda0dd)
- <color powderblue /> powderblue (#b0e0e6)
- <color purple /> purple (#800080)
- <color rebeccapurple /> rebeccapurple (#663399)
- <color red /> red (#ff0000)
- <color rosybrown /> rosybrown (#bc8f8f)
- <color royalblue /> royalblue (#4169e1)
- <color saddlebrown /> saddlebrown (#8b4513)
- <color salmon /> salmon (#fa8072)
- <color sandybrown /> sandybrown (#f4a460)
- <color seagreen /> seagreen (#2e8b57)
- <color seashell /> seashell (#fff5ee)
- <color sienna /> sienna (#a0522d)
- <color silver /> silver (#c0c0c0)
- <color skyblue /> skyblue (#87ceeb)
- <color slateblue /> slateblue (#6a5acd)
- <color slategray /> slategray (#708090)
- <color snow /> snow (#fffafa)
- <color springgreen /> springgreen (#00ff7f)
- <color steelblue /> steelblue (#4682b4)
- <color tan /> tan (#d2b48c)
- <color teal /> teal (#008080)
- <color thistle /> thistle (#d8bfd8)
- <color tomato /> tomato (#ff6347)
- <color turquoise /> turquoise (#40e0d0)
- <color violet /> violet (#ee82ee)
- <color wheat /> wheat (#f5deb3)
- <color white /> white (#ffffff)
- <color whitesmoke /> whitesmoke (#f5f5f5)
- <color yellow /> yellow (#ffff00)
- <color yellowgreen /> yellowgreen (#9acd32)
