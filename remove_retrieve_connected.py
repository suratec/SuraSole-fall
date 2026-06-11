import re

# Fix menu/balance/index.js
file1 = 'src/components/menu/balance/index.js'
with open(file1, 'r', encoding='utf-8') as f:
    content1 = f.read()

# Remove from componentDidMount
content1 = content1.replace('await this.retrieveConnected();\n    this.startReading();', 'this.startReading();')
content1 = content1.replace('await this.retrieveConnected();\n      this.startReading();', 'this.startReading();')

with open(file1, 'w', encoding='utf-8') as f:
    f.write(content1)

# Fix eight/balance/index.js
file2 = 'src/components/eight/balance/index.js'
with open(file2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace('this.retrieveConnected();\n    this.startReading();', 'this.startReading();')
content2 = content2.replace('this.retrieveConnected();\n      this.startReading();', 'this.startReading();')

with open(file2, 'w', encoding='utf-8') as f:
    f.write(content2)

