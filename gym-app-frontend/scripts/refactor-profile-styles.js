const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "src", "screens", "ProfilePage.js");
const s = fs.readFileSync(file, "utf8");
const re = /\nconst styles = StyleSheet\.create\(\{/;
const idx = s.search(re);
if (idx === -1) {
  console.error("styles start not found");
  process.exit(1);
}
const before = s.slice(0, idx);
const after = s.slice(idx + 1);
const endRe = /\}\);\s*\r?\n\s*export default ProfilePage;/;
const em = after.match(endRe);
if (!em) {
  console.error("styles end not found");
  process.exit(1);
}
const inner = after.slice(0, em.index + "});".length);
const tail = after.slice(em.index + em[0].length);
let styleBody = inner.replace(/^\s*const styles = StyleSheet\.create\(\{/, "").replace(/\}\);\s*$/, "");
const out =
  before +
  "\nfunction createProfilePageStyles(COLORS) {\n  return StyleSheet.create({" +
  styleBody +
  "  });\n}\n\nexport default ProfilePage;" +
  tail;
fs.writeFileSync(file, out);
console.log("ProfilePage OK");
