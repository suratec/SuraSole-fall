const title = { thai: 'ข้อมูลประจำวัน', eng: 'Daily Data', japanese: '日次データ' }
const labelCapillary = { thai: 'ค่าน้ำตาลในกระแสเลือด', eng: 'Capillary blood glucose', japanese: '血糖値（毛細血管）' }
const labelBreakfast = { thai: 'อาหารเช้า', eng: 'Breakfast', japanese: '朝食' }
const labelLunch = { thai: 'อาหารกลางวัน', eng: 'Lunch', japanese: '昼食' }
const labelDinnner = { thai: 'อาหารเย็น', eng: 'Dinner', japanese: '夕食' }
const labelSleep = { thai: 'เวลานอน (ชั่วโมง)', eng: 'Sleep hours', japanese: '睡眠時間（時間）' }
const updateButton = { thai: 'อัปเดต', eng: 'Update', japanese: '更新' }
const alertErrorTitle = { thai: 'ผิดพลาด', eng: 'Error', japanese: 'エラー' }
const alertSuccessTitle = { thai: 'สำเร็จ', eng: 'Success', japanese: '成功' }
const alertErrorBody1 = { thai: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', eng: 'Unable to update, please try again', japanese: '更新できませんでした。もう一度お試しください' }
const alertErrorBody2 = { thai: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของท่าน', eng: 'Internet connection problem', japanese: 'インターネット接続を確認してください' }
const alertErrorBody3 = { thai: 'กรุณากรอกข้อมูลให้ครบ', eng: 'Please fill in all fields', japanese: 'すべての項目を入力してください' }
const alertSuccessBody = { thai: 'บันทึกข้อมูลเรียบร้อย', eng: 'Update complete', japanese: '更新が完了しました' }

export default {
    title,
    labelBreakfast,
    labelCapillary,
    labelDinnner,
    labelLunch,
    labelSleep,
    updateButton,
    alertErrorTitle,
    alertSuccessTitle,
    alertErrorBody1,
    alertErrorBody2,
    alertErrorBody3,
    alertSuccessBody
}
