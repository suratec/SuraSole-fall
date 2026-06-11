import re

def fix_balance_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find componentDidMount
    cdm_start = content.find('componentDidMount = async () => {')
    if cdm_start == -1:
        cdm_start = content.find('componentDidMount() {')
        if cdm_start == -1:
            print(f"Could not find componentDidMount in {filepath}")
            return
            
    # We want to replace the whole componentDidMount body to ensure it's clean
    # Actually, it's safer to use regex to inject the fix.
    
    # 1. Add a locking mechanism to startReading
    if 'if (this.isStartingReading) return;' not in content:
        content = content.replace('async startReading() {', 'async startReading() {\n    if (this.isStartingReading) return;\n    this.isStartingReading = true;\n    try {')
        # Find where startReading ends to add finally
        # Since startReading is large, we can just replace the try { await BleManager.retrieveServices } block
        # Or even simpler, just unlock after listener is added
        listener_setup = "this.dataRecord = bleManagerEmitter.addListener("
        replace_listener = "this.isStartingReading = false;\n    this.dataRecord = bleManagerEmitter.addListener("
        content = content.replace(listener_setup, replace_listener)
        
    # 2. Fix componentDidMount double-call and missing call
    # Remove existing explicit startReading() calls in componentDidMount to avoid confusion
    content = re.sub(r'this\.startReading\(\);\s*(this\.focusListener = )', r'\1', content)
    
    # Replace focusListener registration with a robust one
    old_focus = r"this\.focusListener = navigation\.addListener\('focus', (?:async )?\(\) => \{\s*(?:this\.retrieveConnected\(\);\s*)?this\.startReading\(\);\s*this\.setState\(\{ focus: true \}\);\s*\}\);"
    new_focus = """
    setTimeout(() => {
      if (!this.isInitialReadingStarted) {
        this.isInitialReadingStarted = true;
        this.startReading();
      }
    }, 500);

    this.focusListener = navigation.addListener('focus', () => {
      if (this.isInitialReadingStarted) {
        this.startReading();
      }
      this.setState({ focus: true });
    });
    """
    
    content = re.sub(old_focus, new_focus, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
fix_balance_file('src/components/menu/balance/index.js')
fix_balance_file('src/components/eight/balance/index.js')
