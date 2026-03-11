export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 12;

export function validatePassword(password: string) {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`;
  }

  return null;
}
