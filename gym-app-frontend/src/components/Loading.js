import { StyleSheet,
     Text, 
     View , 
     ActivityIndicator,
     Pressable,
    } from 'react-native'

import React from 'react'

const Loading = ({changeIsLoading}) => {
  return (
    <View style={styles.container}>
        <Pressable 
        onPress={()=> changeIsLoading()}
        style ={[{}, styles.closeButtonContainer]}>
        <Text style={styles.closebutton}>X</Text>
        </Pressable>

        <ActivityIndicator size="large" color="black"/>
      <Text style={styles.loginText}>Loading..</Text>
    </View>
  )
}

export default Loading

const styles = StyleSheet.create({

    container:{
        flex:1,
        position:'absolute',
        width:'100%',
        height:'100%',
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'rgba(0,0,0,0.3)',
    },
    loginText:{
        fontSize:20,
        fontWeight:'bold',
        marginTop:10

    },
    closeButtonContainer:{
        backgroundColor:'black',
        width:50,
        height:50,
        borderRadius:50,
        alignItems:'center',
        justifyContent:'center',
        position:'absolute',
        top:'50',
        right:'10'
        },

    closebutton:{
        color:'white',
        fontSize:12,
        fontWeight:'bold',
    }
}
)