const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const shimFile = path.join(srcDir, 'components', 'common', 'NativeBaseShim.js');

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("from 'native-base'")) {
                const relativePath = path.relative(path.dirname(fullPath), shimFile).replace(/\\/g, '/');
                // Remove .js extension from the relative path for the import
                const shimPath = relativePath.replace(/\.js$/, '');
                const newContent = content.replace(/from 'native-base'/g, `from '${shimPath}'`);
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

walk(srcDir);
