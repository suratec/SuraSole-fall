const fs = require('fs');
const path = require('path');

function fixImports(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixImports(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // If the file uses ToastAndroid
            if (content.includes('ToastAndroid.show')) {
                // Check if it actually imports ToastAndroid
                if (!content.includes('ToastAndroid') || !content.match(/import\s+.*ToastAndroid.*\s+from/)) {
                    // Inject the import at the top of the file
                    // Find the last import statement to insert after it, or just insert at the top
                    const importStatement = "import { ToastAndroid } from 'react-native';\n";
                    
                    // We can just prepend it safely, or put it after the first react import
                    if (content.includes("import React")) {
                        content = content.replace(/(import React.*?from\s+['"`]react['"`];)/, `$1\n${importStatement}`);
                    } else {
                        content = importStatement + content;
                    }

                    fs.writeFileSync(fullPath, content);
                    console.log('Injected missing ToastAndroid import in:', fullPath);
                }
            }
        }
    });
}

fixImports('./src');
