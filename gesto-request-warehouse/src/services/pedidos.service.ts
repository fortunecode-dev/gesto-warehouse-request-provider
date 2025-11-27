import { API_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

export const getProducts = async () => {
  try {
    const areaId = await AsyncStorage.getItem('selectedLocal');

    const { data } = await axios.get(`${await API_URL()}/request/products/${areaId}`)
    return data
  } catch (error) {
    router.push({ pathname: "/" })
    AsyncStorage.removeItem("selectedLocal")
    return []
  }

}

export const getProductsSaved = async (url) => {
  try {
    const param = await AsyncStorage.getItem( "selectedLocal");
    if (param == null)
      return router.push({ pathname: `${url == "checkout" ? "/" : "/"}` })
    const { data } = await axios.get(`${await API_URL()}/request/products/saved/${url}/${param}`)
    return data
  } catch (error) {
    router.push({ pathname: "/" })
    AsyncStorage.removeItem("selectedLocal")
    return []
  }

}
export const getEmployes = async (areaId) => {
  try {
    const { data } = await axios.get(`${await API_URL()}/get-employes-by-area/${areaId}`)
    return data
  } catch (error) {
    return []
  }

}
export const getAreas = async () => {
  try {
    const { data } = await axios.get(`${await API_URL()}/areas-local`)
    return data
  } catch (error) {
    return []
  }
}

export const syncProducts = async (url: string, productos: any[]) => {
  try {
    const userId = await AsyncStorage.getItem('selectedResponsable');
    const areaId = await AsyncStorage.getItem('selectedLocal');
    const parsed= productos.map(item=>({...item, quantity:item.quantity?.[item.quantity?.length-1]==="."||item.quantity?.[item.quantity?.length-1]===","?item.quantity.slice(item.quantity.length-1):item.quantity}))
    const response = await axios.post(`${await API_URL()}/request/sync/${url}`, { productos, userId, areaId });
    return response.data;
  } catch (error) {
    console.log("syncProducts return",url,error)
    return null
  }
};
export const activateRequest = async () => {
  try {
    const areaId = await AsyncStorage.getItem('selectedLocal');
    const response = await axios.post(`${await API_URL()}/request/send-to-warehouse/${areaId}`);
    return response.data;
  } catch (error) {
    return []
  }
};

export const makeMovement = async (productos:any) => {
  try {
    const areaId = await AsyncStorage.getItem('selectedLocal');
    const response = await axios.post(`${await API_URL()}/request/make-movement/${areaId}`,{productos});
    return response.data;
  } catch (error) {
    return null
  }
};


export const getActiveRequests = async () => {
  try {
    const response = await axios.get(`${await API_URL()}/request/list`);
    return response.data;

  } catch (error) {

    return []
  }
};
