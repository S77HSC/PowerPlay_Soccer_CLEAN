const fs = require('fs');
const path = require('path');

const checkHooks = ['useSearchParams', 'usePathname', 'useRouter'];
const root = path.resolve(__dirname, 'app');

function fixPageFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  const needsClient = !content.includes("'use client'") && !content.includes('"use client"');
  const needsDynamic = !content.includes('export const dynamic');

  const usesHook = checkHooks.some(hook => content.includes(hook));
  const isPageFile = /page\.jsx?$/.test(path.basename(filePath));

  if (usesHook && isPageFile && (needsClient || needsDynamic)) {
    let lines = content.split('\n');

    // Insert fixes at the top
    let insertIndex = 0;
    if (needsClient) lines.splice(insertIndex++, 0, "'use client';");
    if (needsDynamic) lines.splice(insertIndex++, 0, "export const dynamic = 'force-dynamic';");

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      fixPageFile(fullPath);
    }
  }
}

console.log('🔍 Scanning and fixing page files in /app...');
walk(root);
console.log('✅ All done.');
