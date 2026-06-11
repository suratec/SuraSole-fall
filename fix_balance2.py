import re

with open('src/components/menu/balance/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const rd = this.props.rightDevice || this.rightDeviceId;
    if (typeof rd !== 'undefined' && rd) {
      await this.prepareDeviceNotifications(rd);
    }
    const ld = this.props.leftDevice || this.leftDeviceId;
    if (typeof ld !== 'undefined' && ld) {
      await this.prepareDeviceNotifications(ld);
    }"""

replacement = """    const rd = this.props.rightDevice || this.rightDeviceId;
    if (typeof rd !== 'undefined' && rd) {
      try { await BleManager.retrieveServices(rd); } catch(e) {}
    }
    const ld = this.props.leftDevice || this.leftDeviceId;
    if (typeof ld !== 'undefined' && ld) {
      try { await BleManager.retrieveServices(ld); } catch(e) {}
    }"""

new_content = content.replace(target, replacement)

with open('src/components/menu/balance/index.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
