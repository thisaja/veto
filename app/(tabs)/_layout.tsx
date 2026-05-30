import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e8e6e1",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#1b1b1b",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <Feather name="home" size={size} color={color} />
            ) : (
              <Feather name="home" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
