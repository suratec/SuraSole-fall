const fallRiskScreening = {thai: 'การคัดกรองความเสี่ยงจากการล้ม', eng: 'Fall Risk Screening', japanese: '転倒リスクスクリーニング'}
const tenMeterWalkTest = {thai: 'ทดสอบการเดิน 10 เมตร', eng: '10-meter walk test', japanese: '10メートル歩行テスト'}
const success = {
    eng: 'Success',
    thai: 'สำเร็จ',
    japanese: '成功'
}

const failed = {
    eng: 'Failed',
    thai: 'ล้มเหลว',
    japanese: '失敗'
}

const error = {
    eng: 'Error',
    thai: 'ข้อผิดพลาด',
    japanese: 'エラー'
}
const formSubmitSuccess = {eng: 'Form Submitted Successfully', thai: 'ส่งแบบฟอร์มสำเร็จแล้ว', japanese: 'フォームが正常に送信されました'}
const formSubmitFail = {eng: 'Something went wrong.', thai: 'มีบางอย่างผิดพลาด', japanese: '何か問題が発生しました。'}
const submissionFailed = {eng: 'Submission Failed', thai: 'การส่งล้มเหลว', japanese: '送信に失敗しました'}
const fallPast12Months = {eng: 'FALL PAST 12 MONTHS?', thai: 'ภายใน 12 เดือนที่ผ่านมา เคยหกล้มหรือไม่', japanese: '12 か月を過ぎても落ちませんか?'}
const Yes = {eng: 'YES', thai: 'ใช่', japanese: 'はい'}
const No = {eng: 'NO', thai: 'ไม่ใช่', japanese: 'いいえ'}
const submit = {eng: 'Submit', thai: 'ส่ง', japanese: '提出する'}
const assessFallSeverity = {
    eng: 'Assess Fall Severity :',
    thai: 'ประเมินความรุนแรงของการล้ม :',
    japanese: '転倒の重症度を評価する :'
}
const injury = { eng: 'Injury', thai: 'การบาดเจ็บ', japanese: '怪我' };
const fallLastYear = { eng: '≥ 2 falls last year', thai: '≥ 2 ครั้งในปีที่แล้ว', japanese: '昨年の転倒 ≥ 2 回' };
const frailty = { eng: 'Frailty', thai: 'ความอ่อนแอ', japanese: '虚弱' };
const lyingOnFloor = { eng: 'Lying on the floor/\nunable to get up', thai: 'นอนบนพื้น/\nไม่สามารถลุกขึ้นได้', japanese: '床に横たわる/\n起き上がれない' };
const lossOfConsciousness = { eng: 'Loss of consciousness/suspected syncope', thai: 'หมดสติ/อาจเป็นลม', japanese: '意識喪失/疑似失神' };


const standOpenEyes = {
    eng: 'Stand with Eyes Open',
    thai: 'ยืนตาเปิด',
    japanese: '目を開けて立つ'
};

const standEyesClosed = {
    eng: 'Stand with Eyes Closed',
    thai: 'ยืนตาปิด',
    japanese: '目を閉じて立つ'
};

const standText = {
    eng: 'Stand upright for 20 seconds.',
    thai: 'ยืนตรง 20 วินาที',
    japanese: 'まっすぐ立って20秒'
};

const noteText = {
    eng: 'NOTE:',
    thai: 'หมายเหตุ:',
    japanese: '注記:'
};

const balanceInstructionOpen = {
    eng: 'Stand up straight with your eyes open and try to keep your balance.',
    thai: 'ยืนตรงตากับตาที่เปิดและพยายามรักษาสมดุล',
    japanese: '目を開けてまっすぐ立ち、バランスを保ってください。'
};

const balanceInstructionClosed = {
    eng: 'Stand up straight with your eyes closed and try to keep your balance.',
    thai: 'ยืนตรงตาปิดและพยายามรักษาสมดุล',
    japanese: '目を閉じてまっすぐ立ち、バランスを保ってください。'
};

const startText = {
    eng: 'Start',
    thai: 'เริ่ม',
    japanese: '開始'
};

const stopText = {
    eng: 'Stop',
    thai: 'หยุด',
    japanese: '停止'
};

const finish = {
    eng: 'finish',
    thai: 'เสร็จสิ้น',
    japanese: '終了',
};

const testComplete = {
    eng: 'Test Complete',
    thai: 'ทดสอบเสร็จสมบูรณ์',
    japanese: 'テスト完了',
};

const walking = {
    eng: 'Walking',
    thai: 'การเดิน',
    japanese: '歩く',
};

const walkStraight = {
    eng: 'Walk straight for 10 meters.',
    thai: 'เดินตรงไป 10 เมตร',
    japanese: '10メートルまっすぐ歩く',
};

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
    fallRiskScreening,
    standOpenEyes,
    standEyesClosed,
    tenMeterWalkTest,
    formSubmitSuccess,
    formSubmitFail,
    submissionFailed,
    success,
    failed,
    error,
    fallPast12Months,
    Yes,
    No,
    submit,
    assessFallSeverity,
    injury,
    fallLastYear,
    frailty,
    lyingOnFloor,
    lossOfConsciousness,
    standText,
    noteText,
    balanceInstructionOpen,
    balanceInstructionClosed,
    startText,
    stopText,
    finish,
    testComplete,
    walking,
    walkStraight,
    warning,
    bluetoothAlert

}
