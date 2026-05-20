const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'common');

if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.js')) {
            const fullPath = path.join(dir, file);
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("from 'NativeBaseShim'")) {
                const newContent = content.replace(/from 'NativeBaseShim'/g, "from './NativeBaseShim'");
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
} else {
    console.error(`Directory not found: ${dir}`);
}
