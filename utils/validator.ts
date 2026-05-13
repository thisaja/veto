export const validateEmail = (email?: string) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
export const validatePhoneNumber = (phoneNumber?: string) => {
  if (!phoneNumber) return false;
  const regex = /^\d{3}-\d{3}-\d{4}$/;
  return regex.test(phoneNumber);
};
export const validateName = (name?: string) => {
  if (!name) return false;
  const regex = /^[a-zA-Z]+$/;
  return regex.test(name);
};
export const validatePassword = (password?: string) => {
  if (!password) return false;
  return password.length > 0;
};
export const validateDiningAlias = (alias?: string) => {
  if (!alias) return false;
  return alias.length > 0;
};
