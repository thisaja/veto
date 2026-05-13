import { User, UserError } from "@/types/user";
import { Stack } from "expo-router";
import { createContext, useContext, useState } from "react";

interface UserDetailsContextType {
  userDetails: User | undefined;
  setUserDetails: React.Dispatch<React.SetStateAction<User | undefined>>;
  userErrors: UserError;
  setUserErrors: React.Dispatch<React.SetStateAction<UserError>>;
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
  const [userDetails, setUserDetails] = useState<User | undefined>();
  const [userErrors, setUserErrors] = useState<UserError>({
    FirstName: true,
    LastName: true,
    PhoneNumber: true,
    Email: true,
    Password: true,
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
