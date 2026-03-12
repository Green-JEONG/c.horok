export const PASSWORD_MIN_LENGTH = 12;

export function validatePassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }

  return null;
}
