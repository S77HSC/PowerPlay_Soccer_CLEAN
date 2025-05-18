function fixPageFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  const needsClient = !content.includes("'use client'") && !content.includes('"use client"');
  const needsDynamic = !content.includes('export const dynamic');

  const usesHook = checkHooks.some(hook => content.includes(hook));
  const isPageFile = /page\.jsx?$/.test(path.basename(filePath));

  if (usesHook && isPageFile && (needsClient || needsDynamic)) {
    let lines = content.split('\n');

    // Remove old lines if out of order
    lines = lines.filter(
      line => !line.includes("'use client'") && !line.includes('"use client"') && !line.includes('export const dynamic')
    );

    // Add in correct order
    const headerLines = ["'use client';"];
    if (needsDynamic) headerLines.push("export const dynamic = 'force-dynamic';");

    fs.writeFileSync(filePath, [...headerLines, '', ...lines].join('\n'), 'utf-8');
    console.log(`✅ Re-fixed: ${filePath}`);
  }
}
