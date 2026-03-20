const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;

            // 1. Fix getParam (two arguments)
            // this.props.navigation.getParam('name', '') -> (this.props.route.params?.['name'] ?? '')
            const getParam2Regex = /\.navigation\.getParam\(['"](.+?)['"]\s*,\s*(['"].*?['"]|true|false|\d+|\[.*?\]|\{.*?\})\)/g;
            if (getParam2Regex.test(content)) {
                content = content.replace(getParam2Regex, (match, p1, p2) => {
                    return `.route.params?.['${p1}'] ?? ${p2}`;
                });
                updated = true;
            }

            // 2. Fix getParam (one argument)
            // this.props.navigation.getParam('name') -> this.props.route.params?.['name']
            const getParam1Regex = /\.navigation\.getParam\(['"](.+?)['"]\)/g;
            if (getParam1Regex.test(content)) {
                content = content.replace(getParam1Regex, ".route.params?.['$1']");
                updated = true;
            }

            // 3. Fix addListener('didFocus') -> addListener('focus')
            if (content.includes("'didFocus'") || content.includes('"didFocus"')) {
                content = content.replace(/['"]didFocus['"]/g, "'focus'");
                updated = true;
            }

            // 4. Fix addListener('willFocus') -> addListener('focus')
            if (content.includes("'willFocus'") || content.includes('"willFocus"')) {
                content = content.replace(/['"]willFocus['"]/g, "'focus'");
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated Navigation in: ${fullPath}`);
            }
        }
    });
}

walk(srcDir);
