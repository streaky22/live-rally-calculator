const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /\bbg-white(?!\s+dark:)\b/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /\bbg-gray-50(?!\s+dark:)\b/g, replacement: 'bg-gray-50 dark:bg-slate-800/50' },
  { regex: /\bbg-gray-100(?!\s+dark:)\b/g, replacement: 'bg-gray-100 dark:bg-slate-950' },
  { regex: /\btext-gray-900(?!\s+dark:)\b/g, replacement: 'text-gray-900 dark:text-gray-100' },
  { regex: /\btext-gray-800(?!\s+dark:)\b/g, replacement: 'text-gray-800 dark:text-gray-200' },
  { regex: /\btext-gray-700(?!\s+dark:)\b/g, replacement: 'text-gray-700 dark:text-gray-300' },
  { regex: /\btext-gray-600(?!\s+dark:)\b/g, replacement: 'text-gray-600 dark:text-gray-400' },
  { regex: /\btext-gray-500(?!\s+dark:)\b/g, replacement: 'text-gray-500 dark:text-gray-400' },
  { regex: /\bborder-gray-200(?!\s+dark:)\b/g, replacement: 'border-gray-200 dark:border-slate-700' },
  { regex: /\bborder-gray-300(?!\s+dark:)\b/g, replacement: 'border-gray-300 dark:border-slate-600' },
  { regex: /\bdivide-gray-100(?!\s+dark:)\b/g, replacement: 'divide-gray-100 dark:divide-slate-800' },
  { regex: /\bdivide-gray-200(?!\s+dark:)\b/g, replacement: 'divide-gray-200 dark:divide-slate-700' },
  { regex: /\bhover:bg-gray-50(?!\s+dark:)\b/g, replacement: 'hover:bg-gray-50 dark:hover:bg-slate-800/50' },
  { regex: /\bhover:bg-gray-100(?!\s+dark:)\b/g, replacement: 'hover:bg-gray-100 dark:hover:bg-slate-800/50' }
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
