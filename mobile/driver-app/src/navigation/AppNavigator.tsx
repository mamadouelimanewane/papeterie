import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Text, View, StyleSheet } from "react-native"
import { useDriverStore } from "../store/useDriverStore"
import { Ionicons } from "@expo/vector-icons"

// Auth screens
import SplashScreen from "../screens/auth/SplashScreen"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"

// Main screens
import HomeScreen from "../screens/home/HomeScreen"
import EarningsScreen from "../screens/earnings/EarningsScreen"
import ProfileScreen from "../screens/profile/ProfileScreen"
import ActiveDeliveryScreen from "../screens/delivery/ActiveDeliveryScreen"
import DocumentsScreen from "../screens/documents/DocumentsScreen"
import OrdersScreen from "../screens/orders/OrdersScreen"
import NotificationsScreen from "../screens/notifications/NotificationsScreen"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={focused ? icon : `${icon}-outline`}
        size={22}
        color={focused ? "#1A237E" : "#999"}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

function MainTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="home" label="Accueil" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="cube" label="Commandes" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="cash" label="Gains" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="person" label="Profil" focused={focused} />,
        }}
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
      <Stack.Screen
        name="ActiveDelivery"
        component={ActiveDeliveryScreen}
        options={{
          headerShown: true,
          title: "Livraison en cours",
          headerStyle: { backgroundColor: "#6B6BD5" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          headerShown: true,
          title: "Mes documents",
          headerStyle: { backgroundColor: "#6B6BD5" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: "Notifications",
          headerStyle: { backgroundColor: "#6B6BD5" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { isAuthenticated } = useDriverStore()

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  tabIcon: { alignItems: "center" },
  tabLabel: { fontSize: 10, color: "#999", marginTop: 3 },
  tabLabelActive: { color: "#1A237E", fontWeight: "600" },
})

