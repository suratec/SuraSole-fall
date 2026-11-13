# SuraSole BLE Protocol (IoT ↔ App)

เอกสารนี้สรุปจากโค้ดฝั่งแอป (React Native + `react-native-ble-manager`) ยังไม่ได้ยืนยันกับสเปกเฟิร์มแวร์

---

## 1. การเชื่อมต่อ

| รายการ | ค่า |
|---|---|
| Service UUID | `0000FFE0-0000-1000-8000-00805F9B34FB` (iOS: `FFE0`) |
| Characteristic UUID | `0000FFE1-0000-1000-8000-00805F9B34FB` (iOS: `FFE1`) |
| ทิศทาง | ใช้ Characteristic เดียวกันทั้ง Notify (IoT → App) และ Write (App → IoT) |
| ชื่ออุปกรณ์ | ต้องลงท้ายด้วย `L` (เท้าซ้าย) หรือ `R` (เท้าขวา) |

อ้างอิง: [`src/components/menu/device/index.js`](../src/components/menu/device/index.js) (`actionConnectDevice`)

---

## 2. เงื่อนไขและขั้นตอนการเชื่อมต่อ Bluetooth

อ้างอิงหลัก: [`src/components/menu/device/index.js`](../src/components/menu/device/index.js) (หน้า "Device")

### 2.1 ภาพรวมลำดับการทำงาน

```
เปิดหน้า Device (componentDidMount)
  │
  ├─ BleManager.checkState()
  ├─ ลงทะเบียน listener: DiscoverPeripheral / StopScan / DisconnectPeripheral
  ├─ retrieveConnected()               ← ดึงอุปกรณ์ที่ต่ออยู่แล้วจาก OS
  └─ checkPermission()
        │  (ได้สิทธิ์)
        ▼
     enableBLE()                         ← Android: ขอเปิด Bluetooth
        ▼
     startBLE()                          ← Android: ขอเปิด Location
        ▼
     BleManager.start({showAlert:false})
        ├─ startReading()                ← listener อ่านค่าแบตเตอรี่
        ├─ retrieveConnected()
        └─ startScan()                   ← สแกน 30 วินาที
              ▼
     handleDiscoverPeripheral()          ← กรองเฉพาะชื่อลงท้าย L / R
              ▼
     ผู้ใช้กดเลือกอุปกรณ์ในรายการ (handleDeviceTap)
              ▼
     actionConnectDevice()               ← connect → retrieveServices → startNotification → write [0], [1,95]
```

### 2.2 เงื่อนไขด้านสิทธิ์ (Permission)

| แพลตฟอร์ม | สิทธิ์ที่ขอ | เงื่อนไขผ่าน |
|---|---|---|
| Android 12+ (API ≥ 31) | `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION` | ต้องได้ `SCAN` **และ** `CONNECT` (Location ไม่บังคับ) |
| Android 6–11 (API 23–30) | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | ต้องได้ `FINE_LOCATION` |
| Android < 6 | — | ผ่านทันที |
| iOS | `LOCATION_WHEN_IN_USE` แล้วตามด้วย `BLUETOOTH_PERIPHERAL` | เรียก `enableBLE()` ทันทีหลังขอ Location โดย**ไม่ตรวจผล** |

ถ้า Android ไม่ได้สิทธิ์ → แสดง Toast และ **ไม่เริ่มสแกน**

### 2.3 เงื่อนไขด้านระบบ (Bluetooth / Location)

| ขั้นตอน | ทำอะไร | ถ้าผู้ใช้ปฏิเสธ |
|---|---|---|
| `enableBLE()` (Android) | `BleManager.enableBluetooth()` ขอเปิด Bluetooth | ยังเรียก `startBLE()` ต่อ |
| `startBLE()` (Android) | `promptForEnableLocationIfNeeded()` ขอเปิด GPS | ยังเริ่ม BLE + สแกนต่อ |
| iOS | เข้า `startBLE()` ตรงๆ | — |

> แปลว่าแม้ผู้ใช้ไม่เปิด Bluetooth/Location แอปก็ยังพยายามสแกน (ซึ่งจะไม่เจออุปกรณ์)

### 2.4 การสแกน

```js
BleManager.scan([], 30, true)
```

| พารามิเตอร์ | ค่า | ความหมาย |
|---|---|---|
| serviceUUIDs | `[]` | ไม่กรองด้วย Service UUID (สแกนทุกอุปกรณ์) |
| seconds | `30` | สแกน 30 วินาที |
| allowDuplicates | `true` | รับ advertise ซ้ำได้ |

- สแกนได้เฉพาะเมื่อ `state.scanning === false` (กันสแกนซ้อน)
- ผู้ใช้สั่งสแกนใหม่ได้ด้วยการดึงรีเฟรช (`RefreshComponent`)

### 2.5 เงื่อนไขการกรองอุปกรณ์ที่แสดงในรายการ

```js
const deviceName = peripheral.name || peripheral.advertising?.localName;
if (deviceName) {
  let nameSuffix = deviceName.trim().slice(-1);
  if (nameSuffix === 'L' || nameSuffix === 'R') { /* แสดงในรายการ */ }
}
```

อุปกรณ์จะแสดงในรายการก็ต่อเมื่อ:
1. มีชื่อ (จาก `name` หรือ `advertising.localName`)
2. ตัวอักษรสุดท้าย (หลัง `trim()`) เป็น `L` หรือ `R` ตัวพิมพ์ใหญ่เท่านั้น

ไม่มีการกรองด้วย prefix ชื่อรุ่น, Service UUID, RSSI หรือ MAC — อุปกรณ์ BLE อื่นใดที่ชื่อลงท้าย L/R จะโผล่ในรายการด้วย

### 2.6 การเชื่อมต่อ (เมื่อผู้ใช้กดเลือก)

`handleDeviceTap(item)`:
- ถ้าอุปกรณ์ **ต่ออยู่แล้ว** → ถามยืนยันก่อนตัดการเชื่อมต่อ
- ถ้า **ยังไม่ต่อ** → `actionConnectDevice()` ทันที (ไม่ถาม)

`actionConnectDevice(peripheral)`:

| ลำดับ | การทำงาน |
|---|---|
| 1 | `BleManager.connect(id)` |
| 2 | ตั้ง `connected = true` ในรายการ |
| 3 | ชื่อลงท้าย `L` → `addLeftDevice(id)` / ลงท้าย `R` → `addRightDevice(id)` (Redux) |
| 4 | `retrieveServices(id)` |
| 5 | `startNotification(id, FFE0, FFE1)` |
| 6 | `write [0]` แล้วตามด้วย `write [1, 95]` |
| ผิดพลาด | แสดง Toast `"<id> connection error"` |

การตัดการเชื่อมต่อ: ล้าง `leftDevice`/`rightDevice` ใน Redux ตามข้าง แล้ว `BleManager.disconnect(id)`

### 2.7 อุปกรณ์ที่ต่ออยู่แล้ว (`retrieveConnected`)

เรียกตอนเปิดหน้าและหลัง `BleManager.start()`:
1. **ล้าง** `leftDevice` / `rightDevice` ใน Redux เป็น `undefined` ก่อน
2. `getConnectedPeripherals([])` ดึงอุปกรณ์ที่ OS ต่ออยู่
3. ใช้ `endsWith('L'/'R')` กำหนดข้างใหม่ลง Redux
4. เรียก `checkConnection(id)` ยืนยันซ้ำด้วย `isPeripheralConnected`

เมื่อแอปกลับมาจาก background → `getConnectedPeripherals` แล้วอัปเดตรายการ (ไม่ได้อัปเดต Redux)

### 2.8 หน้าจออื่นที่เชื่อมต่อเอง

หน้าจอวัดผลก็มี `retrieveConnected()` / `actionConnectDevice()` ของตัวเอง เพื่อเริ่ม Notification ใหม่กับอุปกรณ์ที่ต่ออยู่แล้ว:

| หน้าจอ | พฤติกรรม |
|---|---|
| `menu/pressuremap`, `menu/gail`, `menu/training`, `eight/*` | `getConnectedPeripherals` แล้วเรียก `actionConnectDevice` ทุกตัว → connect + retrieveServices (หน่วง 900 ms) + startNotification |
| `menu/balance` | ใช้ `prepareDeviceNotifications` → startNotification ครั้งเดียวต่ออุปกรณ์ (เก็บใน `notificationStarted`) แล้ว write `[0]`, `[1,95]` |
| `assessment/StandEyes`, `assessment/TenMeterWalkTest` | write `[0]`, `[1,95]` เช่นเดียวกัน |
| `screnns/home` (`actionDisconnectBle`) | ตัดการเชื่อมต่อทั้งสองข้างและล้าง Redux (ใช้ตอน logout) |

### 2.9 ข้อจำกัด / จุดที่ควรระวัง

1. **ไม่มี Auto-reconnect** — เมื่อหลุด (`BleManagerDisconnectPeripheral`) แอปแค่ตั้ง `connected = false` ในรายการ ไม่เชื่อมต่อใหม่ และ**ไม่ล้าง** `leftDevice`/`rightDevice` ใน Redux
2. **ไม่จำอุปกรณ์ข้ามการเปิดแอป** — ไม่มีการเก็บ ID ลง AsyncStorage ต้องเลือกใหม่ทุกครั้ง (ยกเว้น OS ยังต่ออยู่)
3. **ต่อได้ข้างละ 1 ตัว** — ถ้าต่ออุปกรณ์ `L` ตัวที่สอง Redux จะถูกเขียนทับ ตัวแรกยังต่ออยู่แต่ข้อมูลถูกทิ้ง
4. **ชื่อมีช่องว่างท้าย** — ตอนสแกนใช้ `trim()` แต่ตอนเชื่อมต่อใช้ `endsWith()` กับชื่อที่ไม่ได้ trim ถ้าชื่อเป็น `"XXX-L "` จะโผล่ในรายการแต่เชื่อมแล้วไม่ถูกกำหนดข้าง
5. **iOS ไม่ตรวจผลสิทธิ์** — เริ่ม BLE เลยไม่ว่าผู้ใช้จะอนุญาตหรือไม่
6. **`startNotification` ล้มเหลวเงียบ** — หน้า Device ไม่มี `.catch` ที่ `retrieveServices`/`startNotification`

---

## 3. App → IoT (คำสั่งตอนเชื่อมต่อ)

หลัง `startNotification` แล้ว แอปจะเขียน 2 คำสั่งต่อกันตามลำดับ:

| ลำดับ | Bytes | หมายเหตุ |
|---|---|---|
| 1 | `[0x00]` | ไม่มีคำอธิบายในโค้ด (คาดว่าเป็นการ reset/init) |
| 2 | `[0x01, 0x5F]` (`[1, 95]`) | ไม่มีคำอธิบายในโค้ด (คาดว่าเป็นคำสั่งเริ่มส่ง/ตั้งค่า rate) |

ใช้ใน: `menu/device`, `menu/balance`, `assessment/StandEyes`, `assessment/TenMeterWalkTest`, `eight/gail`

> ⚠️ ความหมายของคำสั่งต้องยืนยันกับเฟิร์มแวร์

---

## 4. IoT → App (แพ็กเก็ตข้อมูล)

แอปรับผ่าน event `BleManagerDidUpdateValueForCharacteristic` → `{ value, peripheral, characteristic, service }`
โดย `value` คือ byte array

### โครงสร้างทั่วไป

```
[S1_H, S1_L, S2_H, S2_L, ..., Sn_H, Sn_L, BATT]
```

- ไม่มี header, ไม่มี command ID, ไม่มี checksum
- ไม่มีข้อมูลระบุข้างเท้าในแพ็กเก็ต

| รุ่น | จำนวนเซนเซอร์ | ความยาว (คาดการณ์) | โค้ดที่ใช้ |
|---|---|---|---|
| 5 เซนเซอร์ | 5 | 11 bytes | `src/components/menu/*`, `src/utils/sensorUtils.js` |
| 8 เซนเซอร์ | 8 | 17 bytes | `src/components/eight/*`, `src/utils/eightSensorUtils.js` |

### แพ็กเก็ต 8 เซนเซอร์ (17 bytes)

```
Byte:  0     1     2     3     4     5     6     7     8     9     10    11    12    13    14    15    16
     ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
     │S1_H │S1_L │S2_H │S2_L │S3_H │S3_L │S4_H │S4_L │S5_H │S5_L │S6_H │S6_L │S7_H │S7_L │S8_H │S8_L │BATT │
     └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
       └ sensor[0] ┘ └ sensor[1] ┘ └ sensor[2] ┘ └ sensor[3] ┘ └ sensor[4] ┘ └ sensor[5] ┘ └ sensor[6] ┘ └ sensor[7] ┘
```

| Byte | ฟิลด์ | ในแอป |
|---|---|---|
| 0–1 | Sensor 1 (High, Low) | `sensor[0]` |
| 2–3 | Sensor 2 | `sensor[1]` |
| 4–5 | Sensor 3 | `sensor[2]` |
| 6–7 | Sensor 4 | `sensor[3]` |
| 8–9 | Sensor 5 | `sensor[4]` |
| 10–11 | Sensor 6 | `sensor[5]` |
| 12–13 | Sensor 7 | `sensor[6]` |
| 14–15 | Sensor 8 | `sensor[7]` |
| 16 | Battery | `value[value.length - 1]` (แสดงค่าดิบ) |

### ตัวอย่างการถอดค่า

```
01 2C  00 C8  02 58  00 00  00 64  01 F4  03 20  00 32  55
```

| เซนเซอร์ | Hex | สูตรในแอป (×255) | ถ้าเป็น 16-bit จริง (×256) |
|---|---|---|---|
| S1 | `01 2C` | 299 | 300 |
| S2 | `00 C8` | 200 | 200 |
| S3 | `02 58` | 598 | 600 |
| S4 | `00 00` | 0 | 0 |
| S5 | `00 64` | 100 | 100 |
| S6 | `01 F4` | 499 | 500 |
| S7 | `03 20` | 797 | 800 |
| S8 | `00 32` | 50 | 50 |
| Battery | `55` | 85 | 85 |

ผลลัพธ์ในแอป: `sensor = [299, 200, 598, 0, 100, 499, 797, 50]`, battery = `85`

---

## 5. การแปลงค่าในแอป

### Byte → ค่าเซนเซอร์

```js
// src/utils/eightSensorUtils.js, src/utils/sensorUtils.js
export function toDecimalArray(byteArray) {
  let dec = [];
  for (let i = 0; i < byteArray.length - 1; i += 2) {
    dec.push(byteArray[i] * 255 + byteArray[i + 1]);
  }
  return dec;
}
```

ลูปหยุดที่ `length - 1` จึงไม่นับไบต์ Battery ตัวสุดท้ายเป็นเซนเซอร์

### ค่าเซนเซอร์ → หน่วยอื่น

| ฟังก์ชัน | สูตร |
|---|---|
| `calMeasurePressure(v)` | `2.206 * e^(0.0068 * v)` |
| `toKilo(v)` | `(5.6e-4 * e^(v / 53.36) + 6.72) / 0.796` |

---

## 6. การแยกเท้าซ้าย / ขวา

แพ็กเก็ตไม่มีข้อมูลบอกข้าง แอปแยกจาก **อุปกรณ์ต้นทาง** ใน 2 ขั้นตอน:

### 6.1 ตอนเชื่อมต่อ — ดูจากชื่อ Bluetooth

```js
if (peripheral.name?.endsWith('L')) {
  this.props.addLeftDevice(peripheral.id);   // Redux: leftDevice
} else if (peripheral.name?.endsWith('R')) {
  this.props.addRightDevice(peripheral.id);  // Redux: rightDevice
}
```

`peripheral.id` = MAC address (Android) / UUID (iOS)

### 6.2 ตอนรับข้อมูล — เทียบ peripheral ID

```js
({ value, peripheral }) => {
  if (peripheral === this.props.leftDevice)  { /* เท้าซ้าย */ }
  if (peripheral === this.props.rightDevice) { /* เท้าขวา */ }
}
```

### ผลที่ตามมา

- ชื่ออุปกรณ์ **ต้อง** ลงท้ายด้วย `L` หรือ `R` ไม่เช่นนั้นแอปจะเชื่อมต่อได้แต่ทิ้งข้อมูลทั้งหมด
- เฟิร์มแวร์ซ้าย/ขวาส่งรูปแบบแพ็กเก็ตเดียวกัน ต่างกันแค่ชื่อ advertise

### ลำดับเซนเซอร์ในแผนที่แรงกด (8 เซนเซอร์)

ลำดับที่ใส่ลงกริด Kriging ไม่เหมือนกันระหว่างสองข้าง:

| ข้าง | ฟังก์ชัน | ลำดับ index ที่ใช้ |
|---|---|---|
| ซ้าย | `findLeftContourArray` | `1, 0, 4, 3, 2, 6, 5, 7` |
| ขวา | `findRightContourArray` | `0, 1, 2, 3, 4, 5, 6, 7` |

แปลว่าเฟิร์มแวร์แต่ละข้างน่าจะส่งเซนเซอร์มาในลำดับตำแหน่งที่ต่างกัน

---

## 7. ข้อสังเกต / สิ่งที่ต้องยืนยัน

1. **สูตร `×255`** — ถ้าเฟิร์มแวร์ส่ง 16-bit big-endian ปกติ ควรเป็น `×256` (`(hi << 8) | lo`) ค่าปัจจุบันน้อยกว่าค่าจริงเท่ากับไบต์ High หากแก้ต้องพิจารณาผลต่อสูตรแรงกดและข้อมูลที่บันทึกไว้แล้ว
2. **ความยาวแพ็กเก็ต** — แอปไม่ได้ตรวจความยาว ค่า 11/17 bytes อนุมานจากจำนวนเซนเซอร์ที่โค้ดใช้
3. **คำสั่ง `[0]` และ `[1, 95]`** — ยังไม่ทราบความหมาย
4. **Battery** — ไม่ทราบว่าเป็นเปอร์เซ็นต์หรือแรงดัน แอปแสดงค่าดิบ
