// Medical Conditions
const medicalCondition = {
    eng: 'Medical condition',
    thai: 'เงื่อนไขทางการแพทย์',
    japanese: '病状'
};

const stroke = {
    eng: 'Stroke',
    thai: 'โรคหลอดเลือดสมอง',
    japanese: '脳卒中'
};

const diabetes = {
    eng: 'Diabetes',
    thai: 'เบาหวาน',
    japanese: '糖尿病'
};

const hypertension = {
    eng: 'Hypertension',
    thai: 'ความดันโลหิตสูง',
    japanese: '高血圧'
};

const dyslipidemia = {
    eng: 'Dyslipidemia',
    thai: 'ไขมันในเลือดผิดปกติ',
    japanese: '脂質異常症'
};

const otherDiseasesPlaceholder = {
    eng: 'Other diseases',
    thai: 'โรคอื่น ๆ',
    japanese: 'その他の病気'
};

// Walking Aids
const walkingAidType = {
    eng: 'Walking Aid type',
    thai: 'ประเภทอุปกรณ์ช่วยเดิน',
    japanese: '歩行補助具の種類'
};

const cane = {
    eng: 'Cane',
    thai: 'ไม้เท้า',
    japanese: '杖'
};

const crutch = {
    eng: 'Crutch',
    thai: 'ไม้ค้ำยัน',
    japanese: '松葉杖'
};

const walker = {
    eng: 'Walker',
    thai: 'วอล์กเกอร์',
    japanese: '歩行器'
};

const wheelchair = {
    eng: 'Wheelchair',
    thai: 'รถเข็น',
    japanese: '車椅子'
};

const otherWalkingAidsPlaceholder = {
    eng: 'Other walking aids',
    thai: 'อุปกรณ์ช่วยเดินอื่น ๆ',
    japanese: 'その他の歩行補助具'
};

// Movement Disorders
const movementDisorders = {
    eng: 'Movement disorders',
    thai: 'ความผิดปกติของการเคลื่อนไหว',
    japanese: '運動障害'
};

const injuries = {
    eng: 'Injuries',
    thai: 'การบาดเจ็บ',
    japanese: '怪我'
};

const ankle = {
    eng: 'Ankle',
    thai: 'ข้อเท้า',
    japanese: '足首'
};

const knee = {
    eng: 'Knee',
    thai: 'หัวเข่า',
    japanese: '膝'
};

const hip = {
    eng: 'Hip',
    thai: 'สะโพก',
    japanese: '股関節'
};

const otherInjuriesPlaceholder = {
    eng: 'Other injuries',
    thai: 'การบาดเจ็บอื่น ๆ',
    japanese: 'その他の怪我'
};

// Common Labels
const left = {
    eng: 'Left',
    thai: 'ซ้าย',
    japanese: '左'
};

const right = {
    eng: 'Right',
    thai: 'ขวา',
    japanese: '右'
};

const lessThanOneYear = {
    eng: '<1yr',
    thai: '<1ปี',
    japanese: '<1年'
};

const moreThanOneYear = {
    eng: '>1yr',
    thai: '>1ปี',
    japanese: '>1年'
};

// Hypertension Levels
const controllable = {
    eng: 'Controllable',
    thai: 'ควบคุมได้',
    japanese: 'コントロール可能'
};

const uncontrollable = {
    eng: 'Uncontrollable',
    thai: 'ควบคุมไม่ได้',
    japanese: 'コントロール不可'
};

// Dyslipidemia Levels
const normal = {
    eng: 'Normal',
    thai: 'ปกติ',
    japanese: '正常'
};

const high = {
    eng: 'High',
    thai: 'สูง',
    japanese: '高い'
};

const veryHigh = {
    eng: 'Very high',
    thai: 'สูงมาก',
    japanese: '非常に高い'
};

// Buttons
const updateBtn = {
    eng: 'Update',
    thai: 'อัปเดต',
    japanese: '更新'
};

const noteBtn = {
    eng: 'Note',
    thai: 'หมายเหตุ',
    japanese: 'ノート'
};

const cancelBtn = {
    eng: 'Cancel',
    thai: 'ยกเลิก',
    japanese: 'キャンセル'
};

const saving = {
    eng: 'Saving...',
    thai: 'กำลังบันทึก...',
    japanese: '保存中...'
};

// Alert Messages
const alertSuccessTitle = {
    eng: 'Success',
    thai: 'สำเร็จ',
    japanese: '成功'
};

const alertErrorTitle = {
    eng: 'Error',
    thai: 'ข้อผิดพลาด',
    japanese: 'エラー'
};

const alertWarningTitle = {
    eng: 'Warning',
    thai: 'คำเตือน',
    japanese: '警告'
};

// Success Messages
const recordSavedSuccess = {
    eng: 'Medical record saved successfully',
    thai: 'บันทึกข้อมูลทางการแพทย์เรียบร้อยแล้ว',
    japanese: '医療記録が正常に保存されました'
};

// Error Messages
const userIdMissing = {
    eng: 'User ID is missing',
    thai: 'ไม่พบรหัสผู้ใช้',
    japanese: 'ユーザーIDが見つかりません'
};

const saveRecordFailed = {
    eng: 'Failed to save medical record',
    thai: 'ไม่สามารถบันทึกข้อมูลทางการแพทย์ได้',
    japanese: '医療記録の保存に失敗しました'
};

const fetchRecordFailed = {
    eng: 'Failed to fetch medical records',
    thai: 'ไม่สามารถดึงข้อมูลทางการแพทย์ได้',
    japanese: '医療記録の取得に失敗しました'
};

const networkError = {
    eng: 'Network error. Please check your connection.',
    thai: 'เกิดข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ',
    japanese: 'ネットワークエラー。接続を確認してください。'
};

// Loading Messages
const loadingRecords = {
    eng: 'Loading medical records...',
    thai: 'กำลังโหลดข้อมูลทางการแพทย์...',
    japanese: '医療記録を読み込んでいます...'
};

// Confirmation Messages
const confirmNavigation = {
    eng: 'Are you sure you want to leave without saving?',
    thai: 'คุณแน่ใจหรือไม่ว่าต้องการออกโดยไม่บันทึก?',
    japanese: '保存せずに終了してもよろしいですか？'
};

const yes = {
    eng: 'Yes',
    thai: 'ใช่',
    japanese: 'はい'
};

const no = {
    eng: 'No',
    thai: 'ไม่',
    japanese: 'いいえ'
};

// Validation Messages
const invalidData = {
    eng: 'Please check your input data',
    thai: 'กรุณาตรวจสอบข้อมูลที่กรอก',
    japanese: '入力データを確認してください'
};

// Additional Profile-related constants (if needed for compatibility)
const notesBtn = {
    eng: 'Notes',
    thai: 'บันทึก',
    japanese: 'ノート'
};

const editProfileTitle = {
    eng: 'Edit Profile',
    thai: 'แก้ไขโปรไฟล์',
    japanese: 'プロフィール編集'
};

const firstNamelabel = {
    eng: 'First Name',
    thai: 'ชื่อ',
    japanese: '名前'
};

const LastNamelabel = {
    eng: 'Last Name',
    thai: 'นามสกุล',
    japanese: '苗字'
};

const genderlabel = {
    eng: 'Gender',
    thai: 'เพศ',
    japanese: '性別'
};

const weightLabel = {
    eng: 'Weight',
    thai: 'น้ำหนัก',
    japanese: '体重'
};

const heigthLabel = {
    eng: 'Height',
    thai: 'ส่วนสูง',
    japanese: '身長'
};

const ageLabel = {
    eng: 'Age',
    thai: 'อายุ',
    japanese: '年齢'
};

const unsavedChanges = {
    eng: 'You have unsaved changes. Are you sure you want to leave?',
    thai: 'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออก?',
    japanese: '未保存の変更があります。本当に終了しますか？'
};

const confirmBtn = {
    eng: 'Confirm',
    thai: 'ยืนยัน',
    japanese: '確認'
};

const updating = {
    eng: 'Updating...',
    thai: 'กำลังอัปเดต...',
    japanese: '更新中...'
};

const requiredField = {
    eng: 'Please fill in all required fields',
    thai: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
    japanese: '必須項目をすべて入力してください'
};

const invalidAge = {
    eng: 'Please enter a valid age (1-120)',
    thai: 'กรุณากรอกอายุที่ถูกต้อง (1-120)',
    japanese: '有効な年齢を入力してください（1-120）'
};

const invalidWeight = {
    eng: 'Please enter a valid weight (1-500 kg)',
    thai: 'กรุณากรอกน้ำหนักที่ถูกต้อง (1-500 กก.)',
    japanese: '有効な体重を入力してください（1-500kg）'
};

const invalidHeight = {
    eng: 'Please enter a valid height (50-300 cm)',
    thai: 'กรุณากรอกส่วนสูงที่ถูกต้อง (50-300 ซม.)',
    japanese: '有効な身長を入力してください（50-300cm）'
};

const confirmUpdate = {
    eng: 'Are you sure you want to update your profile?',
    thai: 'คุณแน่ใจหรือไม่ว่าต้องการอัปเดตโปรไฟล์?',
    japanese: 'プロフィールを更新してもよろしいですか？'
};

const imageUploadFailed = {
    eng: 'Failed to upload profile image',
    thai: 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้',
    japanese: 'プロフィール画像のアップロードに失敗しました'
};

const profileUpdateFailed = {
    eng: 'Failed to update profile',
    thai: 'ไม่สามารถอัปเดตโปรไฟล์ได้',
    japanese: 'プロフィールの更新に失敗しました'
};

const profileUpdateSuccess = {
    eng: 'Profile updated successfully',
    thai: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
    japanese: 'プロフィールが正常に更新されました'
};

export default {
    // Medical Conditions
    medicalCondition,
    stroke,
    diabetes,
    hypertension,
    dyslipidemia,
    otherDiseasesPlaceholder,

    // Walking Aids
    walkingAidType,
    cane,
    crutch,
    walker,
    wheelchair,
    otherWalkingAidsPlaceholder,

    // Movement Disorders
    movementDisorders,
    injuries,
    ankle,
    knee,
    hip,
    otherInjuriesPlaceholder,

    // Common Labels
    left,
    right,
    lessThanOneYear,
    moreThanOneYear,

    // Condition Levels
    controllable,
    uncontrollable,
    normal,
    high,
    veryHigh,

    // Buttons
    updateBtn,
    noteBtn,
    notesBtn,
    cancelBtn,
    saving,
    confirmBtn,

    // Alert titles
    alertSuccessTitle,
    alertErrorTitle,
    alertWarningTitle,

    // Success messages
    recordSavedSuccess,
    profileUpdateSuccess,

    // Error messages
    userIdMissing,
    saveRecordFailed,
    fetchRecordFailed,
    networkError,
    imageUploadFailed,
    profileUpdateFailed,

    // Loading messages
    loadingRecords,
    updating,

    // Confirmation messages
    confirmNavigation,
    confirmUpdate,
    unsavedChanges,
    yes,
    no,

    // Validation messages
    invalidData,
    requiredField,
    invalidAge,
    invalidWeight,
    invalidHeight,

    // Profile fields (for compatibility)
    editProfileTitle,
    firstNamelabel,
    LastNamelabel,
    genderlabel,
    weightLabel,
    heigthLabel,
    ageLabel,
};