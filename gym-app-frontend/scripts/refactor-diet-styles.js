const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "src", "screens", "DietPage.js");
let s = fs.readFileSync(file, "utf8");
const m = s.match(/export default DietPage;\s*\r?\n\s*const styles = StyleSheet\.create\(\{/);
if (!m) {
  console.error("marker not found");
  process.exit(1);
}
const i = m.index;
const matchLen = m[0].length;
const before = s.slice(0, i);
const afterMarker = s.slice(i + matchLen);
const endIdx = afterMarker.lastIndexOf("});");
if (endIdx === -1) {
  console.error("end not found");
  process.exit(1);
}
const styleBody = afterMarker.slice(0, endIdx);
const tail = afterMarker.slice(endIdx + "});".length);
const newTail =
  "function createDietPageStyles(COLORS) {\n  return StyleSheet.create({" +
  styleBody +
  "\n  });\n}\n\nexport default DietPage;" +
  tail;
fs.writeFileSync(file, before + newTail);
console.log("DietPage OK");
