import { UserRegisterDetails, UserRegisterErrors } from "@/types/user";
import { Stack } from "expo-router";
import { createContext, useContext, useState } from "react";

interface UserDetailsContextType {
  userDetails: UserRegisterDetails | undefined;
  setUserDetails: React.Dispatch<React.SetStateAction<UserRegisterDetails | undefined>>;
  userErrors: UserRegisterErrors;
  setUserErrors: React.Dispatch<React.SetStateAction<UserRegisterErrors>>;
}
const UserDetailsContext = createContext<UserDetailsContextType | undefined>(undefined);
export const useUserDetailsContext = () => {
  const context = useContext(UserDetailsContext);
  if (context === undefined) {
    throw new Error("must use UserDetailsContext within RegisterLayout");
  }
  return context;
};
const RegisterLayout = () => {
  const [userDetails, setUserDetails] = useState<UserRegisterDetails | undefined>();
  const [userErrors, setUserErrors] = useState<UserRegisterErrors>({
    FirstName: true,
    LastName: true,
    Email: true,
    Password: true,
    ConfirmedPassword: true,
    DiningAlias: true,
  });
  return (
    <UserDetailsContext.Provider value={{ userDetails, setUserDetails, userErrors, setUserErrors }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="step2" options={{ headerShown: false }} />
        <Stack.Screen name="step3" options={{ headerShown: false }} />
      </Stack>
    </UserDetailsContext.Provider>
  );
};
export default RegisterLayout;
