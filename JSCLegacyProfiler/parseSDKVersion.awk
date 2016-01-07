BEGIN {
  FS = ":"
  RS = ","
}

/"Version"/ {
  version = substr($2, 2, length($2) - 2)
  print int(version)
  exit 0
}
