const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /hover:bg-gray-50 dark:bg-slate-800\/50/g, replacement: 'hover:bg-gray-50 dark:hover:bg-slate-800/50' },
  { regex: /hover:bg-gray-100 dark:bg-slate-950/g, replacement: 'hover:bg-gray-100 dark:hover:bg-slate-800/50' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
