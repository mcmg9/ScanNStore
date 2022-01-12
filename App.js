import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button , Component } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RNCamera } from 'react-native-camera'
import { BarCodeScanner } from 'expo-barcode-scanner';
import { DataTable } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import { render } from 'react-dom';

var itemList;

async function addNewItem(Quantity, Name) {
  itemList = [...itemList, [Quantity, Name]]
  console.log("Updated Items", itemList);
  await AsyncStorage.setItem(
    "@storedItem", 
    JSON.stringify(itemList)
  );
}

async function getItemList() {
  let itemListT = await AsyncStorage.getItem("@storedItem");
  console.log("items list", itemListT);
  itemList = itemListT ? JSON.parse(itemListT) : [];
}

async function clearAsyncStorage(){
  AsyncStorage.clear();
  itemList = [];
}



function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [text, setText] = useState('Scanning...');

  const askForCameraPermission = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })()
  }

  //request camera permission
  useEffect(() => {
    askForCameraPermission();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setText(data);
    //console.log('Type: ' + type + '\nData: ' + data);

    var check = 0

    //add check to see if item already exists
    itemList.map(indItem => {
      if (indItem[1] == data){
        indItem[0]++
        check = 1
      }
    })

    if(check == 0){
      //items.push({Quantity:1,Name:data.toString(),});
      addNewItem(1, data.toString());
    }
    console.log("after add " + itemList)
  };

  if (hasPermission === null) {
    return(
      <View style={styles.container}>
        <Text>Requesting for camera permission</Text>
      </View>
    )
  }
  if (hasPermission === false) {
    return(
      <View style={styles.container}>
        <Text style={{margin: 10}}>No access to camera</Text>
        <Button title={'Allow Camera'} onPress={() => askForCameraPermission()}></Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.barcodebox}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={{ height: 400, width: 400 }} />
      </View>
      <Text style={styles.maintext}>{text}</Text>

      {scanned && <Button title={'Scan another item'} onPress={() => setScanned(false)} color='tomato' />}
    </View>
  );
}

function ListScreen() {
  var headerIn=["Quantity","Name"]
  return (
    <View>
      <Text style={{marginTop:30, marginBottom:10, fontSize: 30, textAlign: 'center', fontWeight: 'bold',}}>List</Text>
        <Table borderStyle={{borderWidth: 1, borderColor: '#ffa1d2'}}>
          <Row data={headerIn}/>
          <Rows data={itemList}/>
        </Table>
    </View>
  )
}

function SettingsScreen() {
  return (
    <View>
      <Text style={{marginTop:30, marginBottom:10, fontSize: 30, textAlign: 'center', fontWeight: 'bold',}}>Settings</Text>
        <Button onPress={clearAsyncStorage} title="Clear Async Storage"></Button>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {

  getItemList();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Camera') {
              iconName = focused = 'camera-outline';
            } else if (route.name === 'List') {
              iconName = focused = 'clipboard-outline';
            } else if (route.name === 'Settings') {
              iconName = focused = 'options-outline';
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'tomato',
          inactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen name="Camera" component={CameraScreen} />
        <Tab.Screen name="List" component={ListScreen} options={{ unmountOnBlur: true }} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintext: {
    fontSize: 16,
    margin: 20,
  },
  barcodebox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: 'tomato'
  }
});
