const fs = require('fs');

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
    'src/components/dashboard/VacationsAdminView.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // find all remaining `styles.xxx` and change to `'xxx'`
    content = content.replace(/styles\.([a-zA-Z0-9_]+)/g, "'$1'");
    
    // Now replace `style={` with `className={` and merge objects
    content = content.replace(/style=\{\[([^\]]+)\]\}/g, (match, inner) => {
        let classNames = [];
        let inlineStyles = [];
        
        // This is a naive split
        let parts = inner.split(/,(?![^{]*\})/); // split by comma not inside {}
        for(let p of parts) {
            p = p.trim();
            if (p.startsWith('{') && p.endsWith('}')) {
                inlineStyles.push(p);
            } else if (p.includes('?')) {
                // ternary
                classNames.push(`(${p})`);
            } else if (p.includes('&&')) {
                // logical AND
                classNames.push(`(${p})`);
            } else if (p.includes("...")) {
                 inlineStyles.push(`{${p}}`);
            } else {
                classNames.push(p);
            }
        }

        let res = '';
        if (classNames.length > 0) {
            res += `className={[${classNames.join(', ')}].filter(x => typeof x === 'string').join(' ')} `;
        }
        if (inlineStyles.length > 0) {
            // merge inline styles
            res += `style={Object.assign({}, ${inlineStyles.join(', ')})}`;
        }
        return res.trim();
    });

    // Also replace simple `style='xyz'` (from our previous naive regex that might have done `style={'xyz'}`)
    content = content.replace(/style=\{('[a-zA-Z0-9_]+')\}/g, "className={$1}");
    content = content.replace(/style=\{([a-zA-Z0-9_]+ \? '[a-zA-Z0-9_]+' : '[a-zA-Z0-9_]+')\}/g, "className={$1}");

    fs.writeFileSync(file, content);
});
