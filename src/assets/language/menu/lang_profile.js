const logoutAlert = {eng: 'Logout', thai: 'ออกจากระบบ', japanese: 'ログアウト'}
const cannotEditAlert = {eng: 'unable to edit profile', thai: 'ไม่สามารถแก้ไขโปรไฟล์ได้', japanese: 'プロフィールを編集できません'}
const successTitleEditAlert = {eng: 'Success', thai: 'การทำรายการสำเร็จ', japanese: '成功'}
const successTitleContentAlert = {eng: 'Edit profile success', thai: 'แก้ไขโปรไฟล์สำเร็จ', japanese: 'プロフィールの編集に成功しました'}
const alertSuccessTitle = {eng: 'Success', thai: 'สำเร็จ', japanese: '成功'};
const alertErrorTitle = {eng: 'Error', thai: 'ผิดพลาด', japanese: 'エラー'};
const alertWarningTitle = {eng: 'Warning', thai: 'คำเตือน', japanese: '警告'};
const fullNamelabel = {eng: 'Full Name', thai: 'ชื่อ - นามสกุล', japanese: '氏名'}
const firstNamelabel = {eng: 'First Name', thai: 'ชื่อจริง', japanese: '名'}
const genderlabel = {eng: 'Gender', thai: 'เพศ', japanese: '性別'}
const LastNamelabel = {eng: 'Last Name', thai: 'นามสกุล', japanese: '姓'}
const Emaillabel = {eng: 'Email Address', thai: 'ที่อยู่อีเมล', japanese: 'メールアドレス'}
const weightLabel = {eng: 'Weight (Kg.)', thai: 'น้ำหนัก ( กก. )', japanese: '体重 (Kg.)'}
const heigthLabel = {eng: 'Height (Cm.)', thai: 'ส่วนสูง ( ซม. )', japanese: '身長 (Cm.)'}
const ageLabel = {eng: 'Age (Yr)', thai: 'อายุ', japanese: '年齢'}
const langTitle = {eng: 'Change Language', thai: 'เปลี่ยนภาษา', japanese: '言語を変更'}
const emergencyLabel = {eng: 'Contract No.', thai: 'เลขที่ติดต่อฉุกเฉิน', japanese: '緊急連絡先'}
const NotificationLabel = {eng: 'Notification Alarm', thai: 'ตั้งค่าการสั่นแจ้งเตือน', japanese: '通知アラーム'}
const editProfileTitle = { eng: 'Edit Profile', thai: 'แก้ไขโปรไฟล์', japanese: 'プロフィール編集' };
const updateBtn = { eng: 'Update', thai: 'อัปเดต', japanese: '更新' };
const notesBtn = { eng: 'Notes', thai: 'บันทึก', japanese: 'ノート' };

// Gender options
const genderMale = { eng: 'Male', thai: 'ชาย', japanese: '男性' };
const genderFemale = { eng: 'Female', thai: 'หญิง', japanese: '女性' };
const genderOther = { eng: 'Other', thai: 'อื่นๆ', japanese: 'その他' };

// Button labels
const cancelBtn = { eng: 'Cancel', thai: 'ยกเลิก', japanese: 'キャンセル' };
const confirmBtn = { eng: 'Confirm', thai: 'ยืนยัน', japanese: '確認' };
const saveBtn = { eng: 'Save', thai: 'บันทึก', japanese: '保存' };

// Success Messages
const profileUpdateSuccess = { eng: 'Profile updated successfully', thai: 'อัปเดตโปรไฟล์สำเร็จ', japanese: 'プロフィールが正常に更新されました' };
const imageUploadSuccess = { eng: 'Profile image updated successfully', thai: 'อัปเดตรูปโปรไฟล์สำเร็จ', japanese: 'プロフィール画像が正常に更新されました' };

// Error Messages
const profileUpdateFailed = { eng: 'Failed to update profile', thai: 'ไม่สามารถอัปเดตโปรไฟล์ได้', japanese: 'プロフィールの更新に失敗しました' };
const imageUploadFailed = { eng: 'Failed to upload image', thai: 'ไม่สามารถอัปโหลดรูปภาพได้', japanese: '画像のアップロードに失敗しました' };
const networkError = { eng: 'Network error. Please check your connection.', thai: 'เกิดข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ', japanese: 'ネットワークエラー。接続を確認してください。' };
const invalidInput = { eng: 'Please enter valid information', thai: 'กรุณากรอกข้อมูลที่ถูกต้อง', japanese: '有効な情報を入力してください' };

// Loading Messages
const updating = { eng: 'Updating...', thai: 'กำลังอัปเดต...', japanese: '更新中...' };
const uploading = { eng: 'Uploading...', thai: 'กำลังอัปโหลด...', japanese: 'アップロード中...' };
const loading = { eng: 'Loading...', thai: 'กำลังโหลด...', japanese: '読み込み中...' };

// Confirmation Messages
const unsavedChanges = { eng: 'You have unsaved changes. Are you sure you want to leave?', thai: 'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออก?', japanese: '保存されていない変更があります。本当に終了しますか？' };
const confirmUpdate = { eng: 'Are you sure you want to update your profile?', thai: 'คุณแน่ใจหรือไม่ว่าต้องการอัปเดตโปรไฟล์?', japanese: 'プロフィールを更新してもよろしいですか？' };

// Placeholder texts
const firstNamePlaceholder = { eng: 'Enter first name', thai: 'กรอกชื่อจริง', japanese: '名を入力' };
const lastNamePlaceholder = { eng: 'Enter last name', thai: 'กรอกนามสกุล', japanese: '姓を入力' };
const weightPlaceholder = { eng: 'Enter weight in kg', thai: 'กรอกน้ำหนักเป็นกิโลกรัม', japanese: '体重をkgで入力' };
const heightPlaceholder = { eng: 'Enter height in cm', thai: 'กรอกส่วนสูงเป็นเซนติเมตร', japanese: '身長をcmで入力' };
const agePlaceholder = { eng: 'Enter age', thai: 'กรอกอายุ', japanese: '年齢を入力' };

// Validation Messages
const requiredField = { eng: 'This field is required', thai: 'ข้อมูลนี้จำเป็น', japanese: 'この項目は必須です' };
const invalidAge = { eng: 'Please enter a valid age (1-120)', thai: 'กรุณากรอกอายุที่ถูกต้อง (1-120)', japanese: '有効な年齢を入力してください (1-120)' };
const invalidWeight = { eng: 'Please enter a valid weight (1-500 kg)', thai: 'กรุณากรอกน้ำหนักที่ถูกต้อง (1-500 กก.)', japanese: '有効な体重を入力してください (1-500 kg)' };
const invalidHeight = { eng: 'Please enter a valid height (50-300 cm)', thai: 'กรุณากรอกส่วนสูงที่ถูกต้อง (50-300 ซม.)', japanese: '有効な身長を入力してください (50-300 cm)' };

export default {
    logoutAlert,
    cannotEditAlert,
    successTitleContentAlert,
    successTitleEditAlert,
    fullNamelabel,
    firstNamelabel,
    genderlabel,
    LastNamelabel,
    Emaillabel,
    weightLabel,
    heigthLabel,
    langTitle,
    ageLabel,
    emergencyLabel,
    alertErrorTitle,
    alertSuccessTitle,
    alertWarningTitle,
    NotificationLabel,
    editProfileTitle,
    updateBtn,
    notesBtn,

    // Gender options
    genderMale,
    genderFemale,
    genderOther,

    // Button labels
    cancelBtn,
    confirmBtn,
    saveBtn,

    // Success messages
    profileUpdateSuccess,
    imageUploadSuccess,

    // Error messages
    profileUpdateFailed,
    imageUploadFailed,
    networkError,
    invalidInput,

    // Loading messages
    updating,
    uploading,
    loading,

    // Confirmation messages
    unsavedChanges,
    confirmUpdate,

    // Placeholder texts
    firstNamePlaceholder,
    lastNamePlaceholder,
    weightPlaceholder,
    heightPlaceholder,
    agePlaceholder,

    // Validation messages
    requiredField,
    invalidAge,
    invalidWeight,
    invalidHeight,
}