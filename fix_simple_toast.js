const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("import Toast from 'react-native-simple-toast';")) {
                content = content.replace(/import\s+Toast\s+from\s+['"`]react-native-simple-toast['"`];/, "import { ToastAndroid } from 'react-native'; // Replaced simple-toast");
                fs.writeFileSync(fullPath, content);
                console.log('Fixed simple-toast import in:', fullPath);
            }
        }
    });
}

replaceInDir('./src');
