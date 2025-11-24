BASE_PATH="$(dirname "$(pwd)")"
> imports.txt
find "$BASE_PATH" -type f -name "*.java" | while read -r file; do
grep '^import ' "$file" | sed 's/^import //' | sed 's/;$//' >> imports.txt
done
sort imports.txt | uniq > imports-clean.txt
mv imports-clean.txt imports.txt