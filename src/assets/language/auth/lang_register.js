const titleName = { thai: 'สมัครสมาชิก', eng: 'Sign up', japanese: '新規登録' };
const fieldUsername = { thai: 'ชื่อผู้ใช้', eng: 'Username', japanese: 'ユーザー名' };
const fieldEmail = { thai: 'อีเมล', eng: 'Email', japanese: 'メールアドレス' };
const fieldPassword = { thai: 'รหัสผ่าน', eng: 'Password', japanese: 'パスワード' };
const fieldConfirmPassword = { thai: 'ยืนยันรหัสผ่าน', eng: 'Confirm Password', japanese: 'パスワード（確認）' };
const fieldDropdownfix = { thai: 'เลือกหมวด', eng: 'Select Category', japanese: 'カテゴリーを選択' };
const fieldDropdownfixfield = { thai: 'เลือกหมวดการใช้งาน', eng: 'Select Category', japanese: 'カテゴリーを選択' };
const titleBtn = { thai: 'สมัครสมาชิก', eng: 'Sign up', japanese: '新規登録' };
const labelBack = { thai: 'กลับไปเข้าสู่ระบบ', eng: 'or log in', japanese: 'ログインに戻る' };
const radioMale = { thai: 'ชาย', eng: 'Male', japanese: '男性' };
const radioFemale = { thai: 'หญิง', eng: 'Female', japanese: '女性' };
const alertErrorTitle = { thai: 'ผิดพลาด', eng: 'Error', japanese: 'エラー' };
const alertSuccessTitle = { thai: 'สำเร็จ', eng: 'Success', japanese: '成功' };
const alertSuccessBody = { thai: 'สมัครสมาชิกสำเร็จ', eng: 'Registration successful', japanese: '登録が完了しました' };
const alertErrorBody = { thai: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านใหม่อีกครั้ง', eng: 'Please re-enter username and password', japanese: 'ユーザー名とパスワードを再入力してください' };
// shown when password and confirm password don't match
const alertBody1 = { thai: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน', eng: 'Passwords do not match', japanese: 'パスワードが一致しません' };
const alertBody2 = { thai: 'กรุณากรอกข้อมูลให้ครบ', eng: 'Please fill in all fields', japanese: 'すべての項目を入力してください' };

export default {
    titleName,
    fieldUsername,
    fieldEmail,
    fieldPassword,
    fieldConfirmPassword,
    fieldDropdownfixfield,
    fieldDropdownfix,
    titleBtn,
    labelBack,
    radioMale,
    radioFemale,
    alertBody1,
    alertBody2,
    alertErrorBody,
    alertSuccessBody,
    alertSuccessTitle,
    alertErrorTitle
}
