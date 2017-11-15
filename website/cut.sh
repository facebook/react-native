declare -a versions=("0.5" "0.6" "0.7" "0.8" "0.9" "0.10" "0.11" "0.12" "0.13" "0.14" "0.15" "0.16" "0.17" "0.18" "0.19" "0.20" "0.21" "0.22" "0.23" "0.24" "0.25" "0.26" "0.27" "0.28" "0.29" "0.30" "0.31" "0.32" "0.33" "0.34" "0.35"  "0.36" "0.37" "0.38" "0.39" "0.40" "0.41" "0.42" "0.43" "0.44" "0.45" "0.46" "0.47" "0.48" "0.49" "0.50")

rm ../docs/*.md
rm -rf versioned_sidebars/
rm -rf versioned_docs
rm sidebars.json
rm versions.json

for i in "${versions[@]}"
do
   : 
   # do whatever on $i
  cp ../../react-native-website/docs/$i/*.md ../docs
  cp ../../react-native-website/masterdocs/*.md ../docs
  echo "/docs reset to version $i"
  cp ../../react-native-website/sidebars/version-$i-sidebars.json ./sidebars.json
  echo "Sidebars reset to version $i"
  echo "Cutting version $i..."
  docusaurus-version $i
  echo "Done."
done
