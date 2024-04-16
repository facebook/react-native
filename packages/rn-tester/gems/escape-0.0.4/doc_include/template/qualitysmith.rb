module RDoc
module Page

FONTS = "\"Bitstream Vera Sans\", Verdana, Arial, Helvetica, sans-serif"

STYLE = <<CSS
a {
  color: #00F;
  text-decoration: none;
}

a:hover {
  color: #77F;
  text-decoration: underline;
}

body, td, p {
  font-family: %fonts%;
  background: #FFF;
  color: #000;
  margin: 0px;
  font-size: small;
}

#content {
  margin: 2em;
}

#description p {
  margin-bottom: 0.5em;
}

.sectiontitle {
  margin-top: 1em;
  margin-bottom: 1em;
  padding: 0.5em;
  padding-left: 2em;
  background: #005;
  color: #FFF;
  font-weight: bold;
  border: 1px dotted black;
}

.attr-rw {
  padding-left: 1em;
  padding-right: 1em;
  text-align: center;
  color: #055;
}

.attr-name {
  font-weight: bold;
}

.attr-desc {
}

.attr-value {
  font-family: monospace;
}

.file-title-prefix {
  font-size: large;
}

.file-title {
  font-size: large;
  font-weight: bold;
  background: #005;
  color: #FFF;
}

.banner {
  background: #005;
  color: #FFF;
  border: 1px solid black;
  padding: 1em;
}

.banner td {
  background: transparent;
  color: #FFF;
}

h1 a, h2 a, .sectiontitle a, .banner a {
  color: #FF0;
}

h1 a:hover, h2 a:hover, .sectiontitle a:hover, .banner a:hover {
  color: #FF7;
}

.dyn-source {
  display: none;
  background: #FFE;
  color: #000;
  border: 1px dotted black;
  margin: 0.5em 2em 0.5em 2em;
  padding: 0.5em;
}

.dyn-source .cmt {
  color: #00F;
  font-style: italic;
}

.dyn-source .kw {
  color: #070;
  font-weight: bold;
}

.method {
  margin-left: 1em;
  margin-right: 1em;
  margin-bottom: 1em;
}

.description pre {
  padding: 0.5em;
  border: 1px dotted black;
  background: #FFE;
}

.method .title {
  font-family: monospace;
  font-size: large;
  border-bottom: 1px dashed black;
  margin-bottom: 0.3em;
  padding-bottom: 0.1em;
}

.method .description, .method .sourcecode {
  margin-left: 1em;
}

.description p, .sourcecode p {
  margin-bottom: 0.5em;
}

.method .sourcecode p.source-link {
  text-indent: 0em;
  margin-top: 0.5em;
}

.method .aka {
  margin-top: 0.3em;
  margin-left: 1em;
  font-style: italic;
  text-indent: 2em;
}

h1 {
  padding: 1em;
  border: 1px solid black;
  font-size: x-large;
  font-weight: bold;
  color: #FFF;
  background: #007;
}

h2 {
  padding: 0.5em 1em 0.5em 1em;
  border: 1px solid black;
  font-size: large;
  font-weight: bold;
  color: #FFF;
  background: #009;
}

h3, h4, h5, h6 {
  padding: 0.2em 1em 0.2em 1em;
  border: 1px dashed black;
  color: #000;
  background: #AAF;
}

.sourcecode > pre {
  padding: 0.5em;
  border: 1px dotted black;
  background: #FFE;
}

CSS

XHTML_PREAMBLE = %{<?xml version="1.0" encoding="%charset%"?>
<!DOCTYPE html 
     PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
}

HEADER = XHTML_PREAMBLE + <<ENDHEADER
<html>
  <head>
    <title>%title%</title>
    <meta http-equiv="Content-Type" content="text/html; charset=%charset%" />
    <link rel="stylesheet" href="%style_url%" type="text/css" media="screen" />

    <script language="JavaScript" type="text/javascript">
    // <![CDATA[

        function toggleSource( id )
        {
          var elem
          var link

          if( document.getElementById )
          {
            elem = document.getElementById( id )
            link = document.getElementById( "l_" + id )
          }
          else if ( document.all )
          {
            elem = eval( "document.all." + id )
            link = eval( "document.all.l_" + id )
          }
          else
            return false;

          if( elem.style.display == "block" )
          {
            elem.style.display = "none"
            link.innerHTML = "show source"
          }
          else
          {
            elem.style.display = "block"
            link.innerHTML = "hide source"
          }
        }

        function openCode( url )
        {
          window.open( url, "SOURCE_CODE", "width=400,height=400,scrollbars=yes" )
        }
      // ]]>
    </script>
  </head>

  <body>
ENDHEADER

FILE_PAGE = <<HTML
<table border='0' cellpadding='0' cellspacing='0' width="100%" class='banner'>
  <tr><td>
    <table width="100%" border='0' cellpadding='0' cellspacing='0'><tr>
      <td class="file-title" colspan="2"><span class="file-title-prefix">File</span><br />%short_name%</td>
      <td align="right">
        <table border='0' cellspacing="0" cellpadding="2">
          <tr>
            <td>Path:</td>
            <td>%full_path%
IF:cvsurl
				&nbsp;(<a href="%cvsurl%">CVS</a>)
ENDIF:cvsurl
            </td>
          </tr>
          <tr>
            <td>Modified:</td>
            <td>%dtm_modified%</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table><br>
HTML

###################################################################

CLASS_PAGE = <<HTML
<table width="100%" border='0' cellpadding='0' cellspacing='0' class='banner'><tr>
  <td class="file-title"><span class="file-title-prefix">%classmod%</span><br />%full_name%</td>
  <td align="right">
    <table cellspacing=0 cellpadding=2>
      <tr valign="top">
        <td>In:</td>
        <td>
START:infiles
HREF:full_path_url:full_path:
IF:cvsurl
&nbsp;(<a href="%cvsurl%">CVS</a>)
ENDIF:cvsurl
END:infiles
        </td>
      </tr>
IF:parent
    <tr>
      <td>Parent:</td>
      <td>
IF:par_url
        <a href="%par_url%">
ENDIF:par_url
%parent%
IF:par_url
         </a>
ENDIF:par_url
     </td>
   </tr>
ENDIF:parent
         </table>
        </td>
        </tr>
      </table>
HTML

###################################################################

METHOD_LIST = <<HTML
  <div id="content">
IF:diagram
  <table cellpadding='0' cellspacing='0' border='0' width="100%"><tr><td align="center">
    %diagram%
  </td></tr></table>
ENDIF:diagram

IF:description
  <div class="description">%description%</div>
ENDIF:description

IF:requires
  <div class="sectiontitle">Required Files</div>
  <ul>
START:requires
  <li>HREF:aref:name:</li>
END:requires
  </ul>
ENDIF:requires

IF:toc
  <div class="sectiontitle">Contents</div>
  <ul>
START:toc
  <li><a href="#%href%">%secname%</a></li>
END:toc
  </ul>
ENDIF:toc

IF:methods
  <div class="sectiontitle">Methods</div>
  <ul>
START:methods
  <li>HREF:aref:name:</li>
END:methods
  </ul>
ENDIF:methods

IF:includes
<div class="sectiontitle">Included Modules</div>
<ul>
START:includes
  <li>HREF:aref:name:</li>
END:includes
</ul>
ENDIF:includes

START:sections
IF:sectitle
<div class="sectiontitle"><a name="%secsequence%">%sectitle%</a></div>
IF:seccomment
<div class="description">
%seccomment%
</div>
ENDIF:seccomment
ENDIF:sectitle

IF:classlist
  <div class="sectiontitle">Classes and Modules</div>
  %classlist%
ENDIF:classlist

IF:constants
  <div class="sectiontitle">Constants</div>
  <table border='0' cellpadding='5'>
START:constants
  <tr valign='top'>
    <td class="attr-name">%name%</td>
    <td>=</td>
    <td class="attr-value">%value%</td>
  </tr>
IF:desc
  <tr valign='top'>
    <td>&nbsp;</td>
    <td colspan="2" class="attr-desc">%desc%</td>
  </tr>
ENDIF:desc
END:constants
  </table>
ENDIF:constants

IF:attributes
  <div class="sectiontitle">Attributes</div>
  <table border='0' cellpadding='5'>
START:attributes
  <tr valign='top'>
    <td class='attr-rw'>
IF:rw
[%rw%]
ENDIF:rw
    </td>
    <td class='attr-name'>%name%</td>
    <td class='attr-desc'>%a_desc%</td>
  </tr>
END:attributes
  </table>
ENDIF:attributes

IF:method_list
START:method_list
IF:methods
<div class="sectiontitle">%type% %category% methods</div>
START:methods
<div class="method">
  <div class="title">
IF:callseq
    <a name="%aref%"></a><b>%callseq%</b>
ENDIF:callseq
IFNOT:callseq
    <a name="%aref%"></a><b>%name%</b>%params%
ENDIF:callseq
IF:codeurl
[ <a href="javascript:openCode('%codeurl%')">source</a> ]
ENDIF:codeurl
  </div>
IF:m_desc
  <div class="description">
  %m_desc%
  </div>
ENDIF:m_desc
IF:aka
<div class="aka">
  This method is also aliased as
START:aka
  <a href="%aref%">%name%</a>
END:aka
</div>
ENDIF:aka
IF:sourcecode
<div class="sourcecode">
  <p class="source-link">[ <a href="javascript:toggleSource('%aref%_source')" id="l_%aref%_source">show source</a> ]</p>
  <div id="%aref%_source" class="dyn-source">
<pre>
%sourcecode%
</pre>
  </div>
</div>
ENDIF:sourcecode
</div>
END:methods
ENDIF:methods
END:method_list
ENDIF:method_list
END:sections
</div>
HTML

FOOTER = <<ENDFOOTER
  </body>
</html>
ENDFOOTER

BODY = HEADER + <<ENDBODY
  !INCLUDE! <!-- banner header -->

  <div id="bodyContent">
    #{METHOD_LIST}
  </div>

  #{FOOTER}
ENDBODY

########################## Source code ##########################

SRC_PAGE = XHTML_PREAMBLE + <<HTML
<html>
<head><title>%title%</title>
<meta http-equiv="Content-Type" content="text/html; charset=%charset%">
<style>
.ruby-comment    { color: green; font-style: italic }
.ruby-constant   { color: #4433aa; font-weight: bold; }
.ruby-identifier { color: #222222;  }
.ruby-ivar       { color: #2233dd; }
.ruby-keyword    { color: #3333FF; font-weight: bold }
.ruby-node       { color: #777777; }
.ruby-operator   { color: #111111;  }
.ruby-regexp     { color: #662222; }
.ruby-value      { color: #662222; font-style: italic }
  .kw { color: #3333FF; font-weight: bold }
  .cmt { color: green; font-style: italic }
  .str { color: #662222; font-style: italic }
  .re  { color: #662222; }
</style>
</head>
<body bgcolor="white">
<pre>%code%</pre>
</body>
</html>
HTML

########################## Index ################################

FR_INDEX_BODY = <<HTML
!INCLUDE!
HTML

FILE_INDEX = XHTML_PREAMBLE + <<HTML
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=%charset%">
<style>
<!--
  body {
    background-color: #EEE;
    font-family: #{FONTS}; 
    color: #000;
    margin: 0px;
  }
  .banner {
    background: #005;
    color: #FFF;
    padding: 0.2em;
    font-size: small;
    font-weight: bold;
    text-align: center;
  }
  .entries {
    margin: 0.25em 1em 0 1em;
    font-size: x-small;
  }
  a {
    display: block;
    color: #00F;
    text-decoration: none;
    white-space: nowrap;
  }
  a:hover {
    color: #77F;
    text-decoration: underline;
  }
  input#link_search {
    color: #a00;
  }
  input#link_search.default {
    color: #888;
  }
-->
</style>
<script type="text/javascript" language="javascript">
function init_frame_select() {
  var opts = document.getElementById('frame_select').options;
  for (i = 0; i < opts.length; i++) {
    opts[i].selected = (location.href.indexOf(opts[i].value) != -1);
  }
}
function do_link_search() {
  var search_box = document.getElementById('link_search');
  if (search_box.value == search_box.defaultValue) return;
  var links = document.getElementById('entries').getElementsByTagName('a');
  search = new RegExp(search_box.value, 'i');
  for (i = 0; i < links.length; i++) {
    links[i].style.display = search.exec(links[i].innerHTML) ? 'block' : 'none';
  }
}
function clear_link_search() {
  var search_box = document.getElementById('link_search');
  if (search_box.value == search_box.defaultValue) search_box.value = '';
  search_box.className = '';
}
function reset_link_search() {
  var search_box = document.getElementById('link_search');
  if (search_box.value == '') search_box.value = search_box.defaultValue;
  search_box.className = 'default';
}
</script>
<base target="docwin">
</head>
<body onload="init_frame_select(); reset_link_search();">
<select id="frame_select" onchange="location.href=this.value" style="width: 100%;">
  <option value="fr_class_index.html">Classes</option>
  <option value="fr_file_index.html">Files</option>
  <option value="fr_method_index.html">Methods</option>
</select>
<input id="link_search" class="default" type="text" onkeyup="do_link_search()" onfocus="clear_link_search()" onblur="reset_link_search()" style="width: 100%;" value="type search here..." />
<div class="banner">%list_title%</div>
<div class="entries" id="entries">
START:entries
<a href="%href%">%name%</a>
END:entries
</div>
</body></html>
HTML

CLASS_INDEX = FILE_INDEX
METHOD_INDEX = FILE_INDEX

INDEX = XHTML_PREAMBLE + <<HTML
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <title>%title%</title>
  <meta http-equiv="Content-Type" content="text/html; charset=%charset%">
</head>

<frameset cols="200, *">
    <frame src="fr_class_index.html"  name="framewin" />
    <frame src="%initial_page%" name="docwin" />
</frameset>

<frameset cols="200,*">
    <frame src="fr_class_index.html" name="framewin" />
IF:inline_source
    <frame  src="%initial_page%" name="docwin">
ENDIF:inline_source
IFNOT:inline_source
    <frameset rows="80%,20%">
      <frame  src="%initial_page%" name="docwin">
      <frame  src="blank.html" name="source">
    </frameset>
ENDIF:inline_source
    <noframes>
          <body bgcolor="white">
            Click <a href="html/index.html">here</a> for a non-frames
            version of this page.
          </body>
    </noframes>
</frameset>

</html>
HTML

end
end

