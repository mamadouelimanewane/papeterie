import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Text, View } from "react-native"
import { COLORS, FONTS } from "../constants/theme"
import { useStore } from "../store/useStore"

import { Ionicons } from "@expo/vector-icons"
// Screens
import SplashScreen from "../screens/auth/SplashScreen"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import HomeScreen from "../screens/home/HomeScreen"
import OrdersScreen from "../screens/orders/OrdersScreen"
import CartScreen from "../screens/cart/CartScreen"
import ProfileScreen from "../screens/profile/ProfileScreen"
import NotificationsScreen from "../screens/notifications/NotificationsScreen"
import WalletScreen from "../screens/wallet/WalletScreen"
import OrderDetailScreen from "../screens/orders/OrderDetailScreen"
import StoreDetailScreen from "../screens/stores/StoreDetailScreen"
import SearchScreen from "../screens/home/SearchScreen"


const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Ionicons name={focused ? icon : `${icon}-outline`} size={focused ? 24 : 22} color={focused ? COLORS.primary : COLORS.gray} />
      <Text style={{ fontSize: 10, fontWeight: focused ? "700" : "500", color: focused ? COLORS.primary : COLORS.gray }}>
        {label}
      </Text>
    </View>
  )
}

function MainTabs() {
  const cartCount = useStore((s) => s.cartCount)()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.grayMedium,
          height: 70,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="home" label="Accueil" focused={focused} /> }}
      />
      <Tab.Screen
        name="Stores"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="business" label="Rayons" focused={focused} /> }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ position: "relative" }}>
              <TabIcon icon="cart" label="Panier" focused={focused} />
              {cartCount > 0 && (
                <View style={{
                  position: "absolute", top: -4, right: -8,
                  backgroundColor: COLORS.danger, borderRadius: 10,
                  minWidth: 18, height: 18, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: "700" }}>{cartCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="cube" label="Commandes" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="person" label="Profil" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>

  )
}

export default function AppNavigator() {
  const isAuthenticated = useStore((s) => s.isAuthenticated)

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
