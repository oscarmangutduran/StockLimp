const fs = require('fs');
const path = require('path');

function processFile(filePath, cssPath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract StyleSheet.create
    const styleSheetRegex = /const styles = StyleSheet\.create\(\{([\s\S]*?)\}\);/;
    const match = content.match(styleSheetRegex);
    if (!match) return;

    let styleBody = match[1];

    // Basic heuristic to convert JS object to CSS
    let css = styleBody
        .replace(/([a-zA-Z0-9]+):\s*\{/g, '.$1 {') // .className {
        .replace(/([a-zA-Z]+):\s*([^,}\n]+)(,|(?=\s*\}))/g, (m, prop, val) => {
            // camelCase to dash-case
            let cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
            // remove quotes from values
            let cssVal = val.replace(/['"]/g, '').trim();
            // add px to numbers if needed (very rough heuristic)
            if (/^\d+$/.test(cssVal) && !['flex', 'opacity', 'zIndex', 'aspectRatio', 'fontWeight'].includes(prop)) {
                cssVal += 'px';
            }
            return `${cssProp}: ${cssVal};`;
        })
        .replace(/\},/g, '}');

    // Create CSS file
    fs.mkdirSync(path.dirname(cssPath), { recursive: true });
    fs.writeFileSync(cssPath, css);

    // Update TSX file
    content = content.replace(styleSheetRegex, '');
    
    // Add import
    const cssRelativePath = path.relative(path.dirname(filePath), cssPath).replace(/\\/g, '/');
    const importStr = `import '${cssRelativePath.startsWith('.') ? cssRelativePath : './' + cssRelativePath}';\n`;
    
    content = importStr + content;

    // Replace styles
    // style={styles.container} -> className="container"
    content = content.replace(/style=\{styles\.([a-zA-Z0-9_]+)\}/g, 'className="$1"');

    // style={[styles.a, styles.b]} -> className="a b"
    content = content.replace(/style=\{\[([^\]]+)\]\}/g, (m, inner) => {
        // If it's a mix of styles and conditional styles, we will just use a generic className
        // This is a naive replacement. For actual arrays, we can try to extract names
        let classes = [];
        let hasComplex = false;
        const parts = inner.split(',');
        for (let part of parts) {
            part = part.trim();
            if (part.startsWith('styles.')) {
                classes.push(part.replace('styles.', ''));
            } else {
                hasComplex = true;
            }
        }
        if (!hasComplex) {
            return `className="${classes.join(' ')}"`;
        }
        return m; // leave complex ones alone for manual fixing or inline
    });

    fs.writeFileSync(filePath, content);
    console.log(`Processed ${filePath}`);
}

const files = [
    { tsx: 'src/app/index.tsx', css: 'src/css/index.css' },
    { tsx: 'src/app/explore.tsx', css: 'src/css/explore.css' },
    { tsx: 'src/components/dashboard/AnalyticsView.tsx', css: 'src/css/AnalyticsView.css' },
    { tsx: 'src/components/dashboard/ApproveUsersView.tsx', css: 'src/css/ApproveUsersView.css' },
    { tsx: 'src/components/dashboard/CentersView.tsx', css: 'src/css/CentersView.css' },
    { tsx: 'src/components/dashboard/ControlPanelView.tsx', css: 'src/css/ControlPanelView.css' },
    { tsx: 'src/components/dashboard/OrdersView.tsx', css: 'src/css/OrdersView.css' },
    { tsx: 'src/components/dashboard/ProductsView.tsx', css: 'src/css/ProductsView.css' },
    { tsx: 'src/components/dashboard/ProfileView.tsx', css: 'src/css/ProfileView.css' },
    { tsx: 'src/components/dashboard/VacationsAdminView.tsx', css: 'src/css/VacationsAdminView.css' }
];

files.forEach(f => {
    try {
        processFile(f.tsx, f.css);
    } catch(e) {
        console.log(`Error on ${f.tsx}: ${e}`);
    }
});
