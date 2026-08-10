const fs = require('fs');
const path = require('path');

const files = [
    'src/app/index.tsx',
    'src/app/explore.tsx',
    'src/components/dashboard/AnalyticsView.tsx',
    'src/components/dashboard/ApproveUsersView.tsx',
    'src/components/dashboard/CentersView.tsx',
    'src/components/dashboard/ControlPanelView.tsx',
    'src/components/dashboard/OrdersView.tsx',
    'src/components/dashboard/ProductsView.tsx',
    'src/components/dashboard/ProfileView.tsx',
    'src/components/dashboard/VacationsAdminView.tsx',
    'src/components/common/ModalAlert.tsx',
    'src/components/hint-row.tsx',
    'src/components/themed-text.tsx',
    'src/components/ui/collapsible.tsx',
    'src/components/web-badge.tsx',
    'src/components/animated-icon.tsx',
    'src/components/animated-icon.web.tsx',
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Match const styles = StyleSheet.create({ ... });
    // This regex matches `const styles = StyleSheet.create({` up to the end of the file or next major block.
    // It's tricky to match nested brackets with regex.
    
    // Instead of regex, let's just find the index of "const styles = StyleSheet.create({"
    // and assume it goes to the end of the file.
    const searchStr = 'const styles = StyleSheet.create({';
    let idx = content.indexOf(searchStr);
    
    if (idx !== -1) {
        // Extract from idx to the end of the file (or end of that statement)
        // Usually `StyleSheet.create` is at the very bottom of the file.
        // Let's find the matching `});`
        let endIdx = content.lastIndexOf('});');
        if (endIdx > idx) {
            let stylesContent = content.substring(idx, endIdx + 3);
            
            // Remove it from the component file
            content = content.substring(0, idx) + content.substring(endIdx + 3);
            
            const baseName = path.basename(file, path.extname(file));
            const stylesFileName = `${baseName}.styles.ts`;
            const stylesPath = path.join('src', 'css', stylesFileName);
            
            // Generate the styles file content
            const styleFileContent = `import { StyleSheet } from 'react-native';\n\nexport ${stylesContent}\n`;
            
            fs.mkdirSync(path.dirname(stylesPath), { recursive: true });
            fs.writeFileSync(stylesPath, styleFileContent);
            
            // Add import to the component file
            // E.g., import { styles } from '../../css/BaseName.styles';
            // We need to compute relative path from component to src/css
            const relativePath = path.relative(path.dirname(file), 'src/css').replace(/\\/g, '/');
            const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
            
            const importStatement = `import { styles } from '${importPath}/${baseName}.styles';\n`;
            
            // Insert after the last import
            const lastImportIdx = content.lastIndexOf('import ');
            const nextNewLine = content.indexOf('\n', lastImportIdx);
            
            content = content.substring(0, nextNewLine + 1) + importStatement + content.substring(nextNewLine + 1);
            
            fs.writeFileSync(file, content);
            console.log(`Extracted styles for ${baseName}`);
        } else {
            console.log(`Failed to find end of StyleSheet in ${file}`);
        }
    } else {
        console.log(`No StyleSheet.create found in ${file}`);
    }
});
