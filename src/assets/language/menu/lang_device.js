const title = {thai: 'เพิ่มอุปกรณ์', eng: 'Add Devices', japanese: 'デバイスを追加'}
const devicesListText = {thai: 'อุปกรณ์ที่เชื่อมต่อ', eng: 'Connected Device List', japanese: '接続されたデバイス一覧'}
const connectText = {thai: 'เชื่อมต่อ', eng: 'Connect', japanese: '接続'}
const disConnectText = {thai: 'ตัดการเชื่อมต่อ', eng: 'Disconnect', japanese: '切断'}
const cancelText = {thai: 'ยกเลิก', eng: 'Cancel', japanese: 'キャンセル'}
const nameText = {thai: 'ชื่อ', eng: 'Name', japanese: '名前'}
const idText = {thai: 'รหัสอุปกรณ์', eng: 'ID', japanese: 'デバイスID'}
const searchText = {thai: 'กำลังค้นหาอุปกรณ์', eng: 'Searching', japanese: 'デバイスを検索中'}
const rssiText = {thai: 'ความเข้มสัญญาณ', eng: 'Signal Strength', japanese: '信号強度'}
const connectSuccess = (text) => ({thai: `เชื่อมต่อ ${text} สำเร็จ`, eng: `Connect to ${text} Success`, japanese: `${text}への接続が成功しました`})
const connected = (text) => ({thai: `${text} ได้เชื่อมต่อแล้ว`, eng: `${text} has Connected`, japanese: `${text}は既に接続されています`})
const connectFail = {thai: 'ไม่สามารถเชื่อมต่อกับอุปกรณ์นี้ได้', eng: `Can't Conect to This Device`, japanese: 'このデバイスに接続できません'}
const scanningForDevices = {
    eng: 'Scanning for devices...',
    thai: 'กำลังค้นหาอุปกรณ์...',
    japanese: 'デバイスをスキャン中...'
}
const scanBluetooth = {
    eng: 'Scan Bluetooth',
    thai: 'สแกนบลูทูธ',
    japanese: 'Bluetoothスキャン'
}
const noDeviceList = {eng: 'No Device List', thai: 'ไม่มีรายการอุปกรณ์', japanese: 'デバイスリストなし'}
const confirmDisconnect = {
    eng: 'Confirm Disconnect',
    thai: 'ยืนยันการตัดการเชื่อมต่อ',
    japanese: '切断の確認'
}
const askDisconnect = (deviceName) => ({
    eng: `Do you want to disconnect ${deviceName}?`,
    thai: `ต้องการตัดการเชื่อมต่อ ${deviceName} หรือไม่?`,
    japanese: `${deviceName}を切断しますか？`
})
export default {
    title,
    devicesListText,
    connectFail,
    connectSuccess,
    connected,
    rssiText,
    searchText,
    idText,
    nameText,
    cancelText,
    disConnectText,
    connectText,
    scanningForDevices,
    scanBluetooth,
    noDeviceList,
    confirmDisconnect,
    askDisconnect
}