const title = {thai: 'สรุปกิจกรรม', eng: 'Dashboard'}
const telemedicineText = {thai: 'สรุปกิจกรรม', eng: 'Telemedicine'}
const headerCardresult0 = {thai: 'บริเวณ', eng: 'Zone'}
const headerCardresult1 = {thai: 'เดิน', eng: 'Walk'}
const headerCardresult2 = {thai: 'วิ่ง', eng: 'Run'}
const headerCardsSpecified0 = {thai: 'วัน เวลา', eng: 'Date Time'}
const headerCardsSpecified1 = {thai: 'โซน', eng: 'Zone'}
const headerCardsSpecified2 = {thai: 'แรงกดสูงสุด', eng: 'Peak Pressure'}
const peakPressureText = {thai: 'แรงกดสูงสุดรวม(%)', eng: 'Total Peak Pressure(%)'}
const pressureOverText = {thai: 'แรงกดสูงสุดที่เกินค่ากำหนด', eng: 'Peak Pressure Over the Specified'}
const behaviorText = {thai: 'ภาพรวมกิจกรรม', eng: 'Summary Activity'}
const durationText = {thai: 'ช่วงเวลา', eng: 'Duration'}
const paceText = {thai: 'ความเร็วเฉลี่ย', eng: 'Avg. Pace'}
const distanceText = {thai: 'ระยะทางเฉลี่ย', eng: 'Avg. Distance'}
const stepText = {thai: 'จำนวนก้าว', eng: 'Step count'}
const heartText = {thai: 'อัตราการเต้นหัวใจ', eng: 'Heart Rate'}
const calorieText = {thai: 'พลังงานโดยประมาณ', eng: 'Est. Calories'}
const peakPressureIconText = {thai: 'แรงกดสูงสุด', eng: 'Peak Pressure'}
const swingText = {thai: 'ความเคลื่อนจากจุดสมดุล', eng: 'CG Swing'}
const lang_dashboard = {
    noSummary: {
        eng: 'No summary available for today.',
        thai: 'ไม่มีสรุปสำหรับวันนี้',
        japanese: '本日の概要はありません。',
    },
    error: {
        eng: 'Unable to load summary. Please check your connection.',
        thai: 'ไม่สามารถโหลดสรุปได้ กรุณาตรวจสอบการเชื่อมต่อของคุณ',
        japanese: '概要を読み込めません。接続を確認してください。',
    },
};
const dashboard = {thai: 'แผงควบคุม', eng: 'Dashboard', japanese: 'ダッシュボード'};
const summary = {thai: 'สรุป', eng: 'Summary', japanese: 'まとめ'};
const noSummary = {thai: 'ไม่มีบทสรุป', eng: 'No Summary', japanese: '概要なし'};
const exerciseTraining = { eng: 'Exercise Training', thai: 'การฝึกออกกำลังกาย', japanese: '運動トレーニング' }
const peakPressureSummary = {eng:'Peak Pressure Summary', thai: 'สรุปแรงกดสูงสุด', japanese: 'ピーク圧概要'}
const footBalance = {eng:'Foot Balance', thai: 'สมดุลเท้า', japanese: '足のバランス'}
const left = {eng:'Left', thai: 'ซ้าย', japanese: '左'}
const right = {eng:'Right', thai: 'ขวา', japanese: '右'}
const pathSway = {eng:'Path Sway', thai: 'การแกว่งตามแนวทาง', japanese: 'パススウェイ'}
const mlSway = {eng:'ML Sway', thai: 'การแกว่งด้านข้าง', japanese: 'MLスウェイ'}
const apSway = {eng:'AP Sway', thai: 'การแกว่งหน้าหลัง', japanese: 'APスウェイ'}
const ellipseArea = {eng:'Ellipse Area', thai: 'พื้นที่วงรี', japanese: '楕円面積'}
const velocity = {eng:'Velocity', thai: 'ความเร็ว', japanese: '速度'}
const fallRiskPrediction = {eng:'Fall Risk Prediction', thai: 'การทำนายความเสี่ยงการหกล้ม', japanese: '転倒リスク予測'}
const high = {eng:'High', thai: 'สูง', japanese: '高い'}
const low = {eng:'Low', thai: 'ต่ำ', japanese: '低い'}
const medium = {eng:'Medium', thai: 'ปานกลาง', japanese: '中'}
const cadence = {eng:'Cadence', thai: 'รอบขา', japanese: 'ケイデンス'}
const cadenceUnit = {eng:'(steps/min)', thai: '(ก้าว/นาที)', japanese: '（歩/分）'}
const stepCount = {eng:'Step Count', thai: 'จำนวนก้าว', japanese: '歩数'}
const stepCountUnit = {eng:'(steps)', thai: '(ก้าว)', japanese: '（歩）'}
const gaitSpeed = {eng:'Gait Speed', thai: 'ความเร็วในการเดิน', japanese: '歩行速度'}
const gaitSpeedUnit = {eng:'(m/s)', thai: '(เมตร/วินาที)', japanese: '（m/s）'}
const stance = {eng:'Stance', thai: 'ระยะยืน', japanese: '立脚期'}
const swing = {eng:'Swing', thai: 'ระยะแกว่ง', japanese: '遊脚期'}
const leftFoot = {eng:'Left Foot', thai: 'เท้าซ้าย', japanese: '左足'}
const rightFoot = {eng:'Right Foot', thai: 'เท้าขวา', japanese: '右足'}


export default {
    lang_dashboard,
    dashboard,
    summary,
    exerciseTraining,
    noSummary,
    peakPressureSummary,
    high,
    low,
    footBalance,
    left,
    right,
    pathSway,
    mlSway,
    apSway,
    ellipseArea,
    velocity,
    fallRiskPrediction,
    medium,
    cadence,
    cadenceUnit,
    stepCount,
    stepCountUnit,
    gaitSpeed,
    gaitSpeedUnit,
    stance,
    swing,
    leftFoot,
    rightFoot,
};