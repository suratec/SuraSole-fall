const fs = require('fs');
const path = require('path');

// Revert string mapping based on the broken state
// since all messages were lost (replaced by empty or src/1), we will just set a generic message
// or we can use git checkout to restore.
const { execSync } = require('child_process');

try {
    // 1. Restore all files to their unmodified state
    execSync('git restore src/');
    console.log('Restored all files in src/ via git');

    // 2. Safely apply the Toast fix using a proper JS RegExp
    function replaceInDir(dir) {
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                replaceInDir(fullPath);
            } else if (fullPath.endsWith('.js')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let modified = false;

                if (content.match(/\bToast\b/) || content.includes('Toast.show')) {
                    // Fix import
                    content = content.replace(/import\s*{([^}]*)\bToast\b([^}]*)}\s*from\s*['"`]react-native['"`]/, "import {$1ToastAndroid$2} from 'react-native'");
                    // Fix Toast.show(msg)
                    content = content.replace(/Toast\.show\s*\(([^)]+)\)/g, 'ToastAndroid.show($1, ToastAndroid.SHORT)');
                    modified = true;
                }

                if (modified) {
                    fs.writeFileSync(fullPath, content);
                    console.log('Fixed file:', fullPath);
                }
            }
        });
    }

    replaceInDir('./src');
} catch (e) {
    console.error('Error during git restore or script execution:', e);
}
