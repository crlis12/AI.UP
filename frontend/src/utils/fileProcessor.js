/**
 * 파일을 Base64 인코딩된 문자열로 변환합니다.
 * @param {File} file 변환할 파일
 * @returns {Promise<string>} Base64 문자열을 반환하는 Promise
 */
export const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  // data:image/jpeg;base64, 부분은 제외하고 순수 Base64 데이터만 반환
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

/**
 * 텍스트 파일을 읽어 문자열로 반환합니다.
 * @param {File} file 읽을 파일
 * @returns {Promise<string>} 파일 내용을 담은 문자열을 반환하는 Promise
 */
export const readFileAsText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});
