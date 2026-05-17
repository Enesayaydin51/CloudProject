import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { LoginPage , SignupPage } from '../screens'
import { createNativeStackNavigator } from '@react-navigation/native-stack'


const Stack = createNativeStackNavigator();

const AuthStack = ({ initialRouteName = 'Login' } = {}) => {
  return (
   <Stack.Navigator 
   initialRouteName={initialRouteName}
   screenOptions={{headerShown:false}}>

    <Stack.Screen name='Login' component={LoginPage}/>
    <Stack.Screen name= 'Signup' component={SignupPage}/>
    
   </Stack.Navigator>
  )
}

export default AuthStack

const styles = StyleSheet.create({})