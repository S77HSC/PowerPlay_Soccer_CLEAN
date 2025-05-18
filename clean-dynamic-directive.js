// clean-dynamic-directive.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, 'app');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file === 'page.jsx') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  const hasDynamic = content.includes("export const dynamic = 'force-dynamic';");

  if (hasUseClient && hasDynamic) {
    const cleaned = content.replace(/export const dynamic = 'force-dynamic';\s*/g, '');
    fs.writeFileSync(filePath, cleaned, 'utf-8');
    console.log(`🧽 Cleaned dynamic export in: ${filePath}`);
    return true;
  }

  return false;
}

function run() {
  const pageFiles = walk(ROOT_DIR);
  let count = 0;
  for (const file of pageFiles) {
    if (cleanFile(file)) count++;
  }

  if (count === 0) {
    console.log('✅ No invalid dynamic exports found.');
  } else {
    console.log(`\n✅ Finished cleanup on ${count} file(s).`);
  }
}

run();
