const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "src", "screens", "ExercisesPage.js");
let s = fs.readFileSync(file, "utf8");
const m = s.match(/export default ExercisesPage;\s*\r?\n\s*const styles = StyleSheet\.create\(\{/);
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
const endMatch = afterMarker.match(/\r?\n\}\);\s*$/);
if (!endMatch) {
  const endIdx = afterMarker.lastIndexOf("});");
  if (endIdx === -1) {
    console.error("end not found");
    process.exit(1);
  }
  styleBody = afterMarker.slice(0, endIdx);
  tail = afterMarker.slice(endIdx + "});".length);
} else {
  const endIdx = afterMarker.lastIndexOf(endMatch[0]);
  styleBody = afterMarker.slice(0, endIdx);
  tail = afterMarker.slice(endIdx + endMatch[0].length);
}
const newTail =
  "function createExercisesPageStyles(COLORS) {\n  return StyleSheet.create({" +
  styleBody +
  "\n  });\n}\n\nexport default ExercisesPage;" +
  tail;
fs.writeFileSync(file, before + newTail);
console.log("ExercisesPage styles refactored, length", (before + newTail).length);
