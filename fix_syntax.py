import re

def fix_syntax_error(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The previous script did this:
    # content = content.replace('async startReading() {', 'async startReading() {\n    if (this.isStartingReading) return;\n    this.isStartingReading = true;\n    try {')
    # replace_listener = "this.isStartingReading = false;\n    this.dataRecord = bleManagerEmitter.addListener("
    
    # We just need to replace the open try { with a try block that has a finally
    
    # First, let's close the try block right before this.isStartingReading = false;
    if 'try {' in content and '} finally {' not in content and 'this.isStartingReading = false;\n    this.dataRecord' in content:
        content = content.replace(
            'this.isStartingReading = false;\n    this.dataRecord = bleManagerEmitter.addListener(',
            '} finally {\n      this.isStartingReading = false;\n    }\n    this.dataRecord = bleManagerEmitter.addListener('
        )
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
fix_syntax_error('src/components/menu/balance/index.js')
fix_syntax_error('src/components/eight/balance/index.js')
