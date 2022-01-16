import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button , Component , TouchableOpacity, ScrollView} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { DataTable } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import { Audio } from 'expo-av';
import RadioButtonRN from 'radio-buttons-react-native';

var itemList;
var sortType;

function getSortNum(){
  if(sortType == "Date"){
    return(1)
  }else{
    return(2)
  }
}

async function setSort(sort) {
  //console.log("Before " + sortType)
  sortType = sort
  await AsyncStorage.setItem(
    "@sortType", 
    sort
  );
  //console.log("After " + sortType)

  //sort here

}

async function playSound(setSound) {
  //console.log('Loading Sound');
  const { sound } = await Audio.Sound.createAsync(
     require('./BarcodeScan.mp3')
  );
  setSound(sound);

  //console.log('Playing Sound');
  await sound.playAsync(); 
}

var Meta = require('html-metadata-parser');

async function getTitle (url){

  var result = await Meta.parser(url);

  return(result.og.title);

};

async function removeItem(index, navigation) {
  itemList.splice(index, 1)
  saveItems()
  navigation.navigate('Deleted')
}

async function saveItems(){
  await AsyncStorage.setItem(
    "@storedItem", 
    JSON.stringify(itemList)
  );
}

async function addNewItem(Quantity, Name) {
  var url = "https://www.buycott.com/upc/" + Name
  var title
  try {
    title = await getTitle (url)
  }
  catch(err) {
    title = Name
    console.log("Error 400 with item: " + Name)
  }

  var date = new Date().toISOString();

  var check = 0
    //add check to see if item already exists
    itemList.map(indItem => {
      if (indItem[1] == title){
        indItem[0]++
        indItem[2] = date
        check = 1
        saveItems()
      }
    })

  if (check == 0){
    itemList = [...itemList, [Quantity, title, date, "Delete"]]
  }
  //console.log("Updated Items", itemList);
  saveItems()
}

async function getItemList() {
  let itemListT = await AsyncStorage.getItem("@storedItem");
  let sort = await AsyncStorage.getItem("@sortType");
  //console.log("items list", itemListT);
  itemList = itemListT ? JSON.parse(itemListT) : [];
  sortType = sort
}

async function clearAsyncStorage(){
  AsyncStorage.clear();
  itemList = [];
}



function CameraScreen() {
  const [sound, setSound] = React.useState();
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
    playSound(setSound)
    setScanned(true);
    setText(data);
    //console.log('Type: ' + type + '\nData: ' + data);

    addNewItem(1, data.toString());
    //console.log("after add " + itemList)
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

function ListScreen({ navigation }) {
  var headerIn=["Quantity","Name","Date","Actions"]

    const element = (data, index) => (
      <TouchableOpacity onPress={() => removeItem(index, navigation)}>
        <View style={styles.btn}>
          <Text style={styles.btnText}>Delete</Text>
        </View>
      </TouchableOpacity>
    );
    return (
      <View>
        <Text style={{marginTop:30, marginBottom:10, fontSize: 30, textAlign: 'center', fontWeight: 'bold',}}>List</Text>
        <ScrollView vertical={true}>
          <Table borderStyle={{borderColor: 'transparent'}}>
            <Row data={headerIn} style={styles.head} textStyle={styles.text}/>
            {
              itemList.map((rowData, index) => (
                <TableWrapper key={index} style={styles.row}>
                  {
                    rowData.map((cellData, cellIndex) => (
                      <Cell key={cellIndex} data={cellIndex === 3 ? element(cellData, index) : cellData} textStyle={styles.text}/>
                    ))
                  }
                </TableWrapper>
              ))
            }
          </Table>
        </ScrollView>
      </View>
    )
}

function SettingsScreen() {
  let data = [{
    label: 'Date',
  }, {
    label: 'Name',
  }];
  return (
    <View>
      <Text style={{marginTop:30, marginBottom:10, fontSize: 30, textAlign: 'center', fontWeight: 'bold',}}>Settings</Text>
      <Button onPress={clearAsyncStorage} title="Clear Async Storage" style="padding: 5px 10px;"></Button>
      <Text style={{marginTop:50, marginBottom:10, fontSize: 20, textAlign: 'center', fontWeight: 'bold',}}>Sort By</Text>
      <RadioButtonRN
        data={data}
        selectedBtn={(e) => setSort(e.label)}
        initial={getSortNum()}
      />
    </View>
  );
}

function DeletedScreen({navigation}) {
  return (
    <View>
      <Text style={{marginTop:200, marginBottom:100, fontSize: 30, textAlign: 'center', fontWeight: 'bold',}}>Item Successfully Deleted</Text>
        <Button onPress={() => navigation.navigate('List')} title="Okay"></Button>
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
          tabBarButton: [
            "Deleted"
          ].includes(route.name)
            ? () => {
                return null;
              }
            : undefined,
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
        <Tab.Screen name="Deleted" component={DeletedScreen} />
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
  },
    head: { height: 40 },
    text: { margin: 6 },
    row: { flexDirection: 'row' },
    btn: { width: 58, height: 18, backgroundColor: 'tomato',  borderRadius: 2 },
    btnText: { textAlign: 'center', color: '#fff' }
});
