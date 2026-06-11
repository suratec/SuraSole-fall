import re

with open('src/components/eight/balance/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  async startReading() {
    if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
      this.dataRecord.remove();
      this.dataRecord = null;
    }

    this.dataRecord = bleManagerEmitter.addListener("""

replacement = """  async startReading() {
    if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
      this.dataRecord.remove();
      this.dataRecord = null;
    }

    if (typeof this.props.rightDevice !== 'undefined') {
      try {
        await BleManager.retrieveServices(this.props.rightDevice);
      } catch (err) {}
    }
    if (typeof this.props.leftDevice !== 'undefined') {
      try {
        await BleManager.retrieveServices(this.props.leftDevice);
      } catch (err) {}
    }

    this.dataRecord = bleManagerEmitter.addListener("""

new_content = content.replace(target, replacement)

with open('src/components/eight/balance/index.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
