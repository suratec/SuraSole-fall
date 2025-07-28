const alert = { thai: 'หยุดทำการบันทึก', eng: 'Stop record', japanese: '記録を停止する' }
const successTitle = { thai: 'สำเร็จ', eng: 'Success', japanese: '成功' }
const successBody = { thai: 'บันทึกข้อมูลสำเร็จ', eng: 'Save complete', japanese: '保存が完了しました' }
const appointSuccess = { thai: 'บันทึกข้อมูลสำเร็จ', eng: 'An Appointment has been created', japanese: '予約が作成されました' }
const appointFailed = { thai: 'บันทึกข้อมูลสำเร็จ', eng: 'Failed to creat an appointment. Please try again', japanese: '予約を作成できませんでした。もう一度お試しください。' }
const errorTitle = { thai: 'ผิดพลาด', eng: 'Error', japanese: 'エラー' }
const errorBody1 = {thai: 'ส่งข้อมูลไม่สำเร็จ', eng: 'error (data transmission error', japanese: 'エラー（データ転送エラー）'}
const errorBody2 = { thai: 'มีข้อผิดพลาดในการจัดการ', eng: 'Data management error', japanese: 'データ管理エラー' }
const recordButton = {thai: 'บันทึก', eng: 'Record', japanese: '記録'}
const stopButton = {thai: 'หยุดบันทึก', eng: 'Stop', japanese: '停止'}
const bluetoothAlert = {
    eng: 'Please Check Your Bluetooth Connect',
    thai: 'กรุณาตรวจสอบการเชื่อมต่อบลูทูธ',
    japanese: 'Bluetooth接続を確認してください'
}
const warning = {
    eng: 'Warning !',
    thai: 'คำเตือน !',
    japanese: '警告 !'
}

export default {
    alert,
    successTitle,
    successBody,
    errorBody2,
    errorTitle,
    appointFailed,
    appointSuccess,
    errorBody1,
    warning,
    bluetoothAlert,
    recordButton,
    stopButton,
}