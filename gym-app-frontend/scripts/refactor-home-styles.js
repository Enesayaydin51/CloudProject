const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "src", "screens", "HomePage.js");
let s = fs.readFileSync(file, "utf8");
const m = s.match(/export default HomePage;\s*\r?\n\s*\/\/[^\n]*\r?\nconst styles = StyleSheet\.create\(\{/);
if (!m) {
  console.error("marker not found");
  process.exit(1);
}
const i = m.index;
const matchLen = m[0].length;
const before = s.slice(0, i);
const afterMarker = s.slice(i + matchLen);
let styleBody;
let tail;
const endIdx = afterMarker.lastIndexOf("});");
if (endIdx === -1) {
  console.error("end not found");
  process.exit(1);
}
styleBody = afterMarker.slice(0, endIdx);
tail = afterMarker.slice(endIdx + "});".length);
const newTail =
  "function createHomePageStyles(COLORS) {\n  return StyleSheet.create({" +
  styleBody +
  "\n  });\n}\n\nexport default HomePage;" +
  tail;
fs.writeFileSync(file, before + newTail);
console.log("HomePage OK");
