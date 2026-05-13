import { ImagePickerSuccessResult } from "expo-image-picker";

export interface User {
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  Email?: string;
  Password?: string;
  DiningAlias?: string;
  ProfilePicture?: ImagePickerSuccessResult;
  Dealbreakers?: number[];
}

// true means valid, false means invalid
export interface UserError {
  FirstName: boolean;
  LastName: boolean;
  PhoneNumber: boolean;
  Email: boolean;
  Password: boolean;
  DiningAlias: boolean;
}
