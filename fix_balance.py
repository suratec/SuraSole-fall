import re

with open('src/components/menu/balance/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      for (var i = 0; i < results.length; i++) {
            let shouldVibrate = this.shouldBeVibration(lsensor);
            let { xPos, yPos, xPosN, yPosN } = this.getBalancePosition(lsensor, rsensor);"""

replacement = """      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        await this.actionConnectDevice(peripheral);
      }
      this.setState({ peripherals });
    } catch (error) {
      console.log('retrieveConnected error:', error);
    }
  }

  async startReading() {
    if (this.dataRecord && typeof this.dataRecord.remove === 'function') {
      this.dataRecord.remove();
    }

    const rd = this.props.rightDevice || this.rightDeviceId;
    if (typeof rd !== 'undefined' && rd) {
      await this.prepareDeviceNotifications(rd);
    }
    const ld = this.props.leftDevice || this.leftDeviceId;
    if (typeof ld !== 'undefined' && ld) {
      await this.prepareDeviceNotifications(ld);
    }

    this.dataRecord = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({ value, peripheral, characteristic, service }) => {
        const rightDevice = this.props.rightDevice || this.rightDeviceId;
        const leftDevice = this.props.leftDevice || this.leftDeviceId;
        let time = new Date();
        if (peripheral === rightDevice) {
          let rsensor = this.toDecimalArray(value);
          this.recordData(rsensor, 'R');
          if (time - this.rtime > 250) {
            let lsensor = this.state.lsensor;
            let shouldVibrate = this.shouldBeVibration(lsensor);
            let { xPos, yPos, xPosN, yPosN } = this.getBalancePosition(lsensor, rsensor);"""

new_content = content.replace(target, replacement)

with open('src/components/menu/balance/index.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
