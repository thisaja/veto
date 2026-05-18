import { ImagePickerSuccessResult } from "expo-image-picker";

export type UserLoginDetails = {
  Email?: string;
  Password?: string;
};
export type UserRegisterDetails = UserLoginDetails & {
  FirstName?: string;
  LastName?: string;
  ConfirmedPassword?: string;
  DiningAlias?: string;
  ProfilePicture?: ImagePickerSuccessResult;
  Dealbreakers?: number[];
};

// true means valid, false means invalid
export type UserLoginErrors = {
  Email: boolean;
  Password: boolean;
};
export type UserRegisterErrors = UserLoginErrors & {
  FirstName: boolean;
  LastName: boolean;
  ConfirmedPassword: boolean;
  DiningAlias: boolean;
};
