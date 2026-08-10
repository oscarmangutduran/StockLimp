const fs = require('fs');
const path = require('path');

const cssDir = 'src/css';
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

files.forEach(file => {
    const filePath = path.join(cssDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace `.className {` with `:root .className {`
    // Only if it doesn't already start with :root
    content = content.replace(/^(\s*)\.([a-zA-Z0-9_-]+)(\s*\{)/gm, (match, p1, p2, p3) => {
        return `${p1}:root .${p2}${p3}`;
    });
    
    // Also handle pseudo-classes like `.className:hover {`
    content = content.replace(/^(\s*)\.([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)(\s*\{)/gm, (match, p1, p2, p3) => {
        return `${p1}:root .${p2}${p3}`;
    });

    fs.writeFileSync(filePath, content);
});
console.log('Fixed specificity in all CSS files');
