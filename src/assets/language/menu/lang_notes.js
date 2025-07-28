const medicalCondition = { eng: 'Medical condition', thai: 'เงื่อนไขทางการแพทย์', japanese: '病状' };
const injuries = { eng: 'Injuries', thai: 'การบาดเจ็บ', japanese: '怪我' };
const diabetes = { eng: 'Diabetes', thai: 'เบาหวาน', japanese: '糖尿病' };
const hypertension = { eng: 'Hypertension', thai: 'ความดันโลหิตสูง', japanese: '高血圧' };
const dyslipidemia = { eng: 'Dyslipidemia', thai: 'ไขมันในเลือดผิดปกติ', japanese: '脂質異常症' };
const otherDiseasesPlaceholder = { eng: 'Other diseases', thai: 'โรคอื่น ๆ', japanese: 'その他の病気' };
const ankle = { eng: 'Ankle', thai: 'ข้อเท้า', japanese: '足首' };
const knee = { eng: 'Knee', thai: 'หัวเข่า', japanese: '膝' };
const hip = { eng: 'Hip', thai: 'สะโพก', japanese: '股関節' };
const otherInjuriesPlaceholder = { eng: 'Other injuries', thai: 'การบาดเจ็บอื่น ๆ', japanese: 'その他の怪我' };
const updateBtn = { eng: 'Update', thai: 'อัปเดต', japanese: '更新' };
const cancelBtn = { eng: 'Cancel', thai: 'ยกเลิก', japanese: 'キャンセル' };
const saving = { eng: 'Saving...', thai: 'กำลังบันทึก...', japanese: '保存中...' };
const error = {eng: 'Error', thai: 'ข้อผิดพลาด', japanese: 'エラー'};
const userIdMissing = {eng: 'User ID is missing', thai: 'ไม่พบ User ID', japanese: 'ユーザーIDがありません'};
const success =  {eng: 'Success', thai: 'สำเร็จ', japanese: '成功'};
const medicalRecord = {eng: 'Medical record saved successfully', thai: 'บันทึกเวชระเบียนสำเร็จ', japanese: '診療記録が正常に保存されました'};
const failedSave =  {eng: 'Failed to save medical record', thai: 'ไม่สามารถบันทึกเวชระเบียนได้', japanese: '診療記録の保存に失敗しました'};

export default {
    medicalCondition,
    injuries,
    diabetes,
    hypertension,
    dyslipidemia,
    otherDiseasesPlaceholder,
    ankle,
    knee,
    hip,
    otherInjuriesPlaceholder,
    updateBtn,
    cancelBtn,
    saving,
    error,
    userIdMissing,
    success,
    medicalRecord,
    failedSave,
};