import { API_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { subDays } from "date-fns";
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
    const param = await AsyncStorage.getItem("selectedLocal");
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
    const parsed = productos.map(item => ({ ...item, quantity: item.quantity?.[item.quantity?.length - 1] === "." || item.quantity?.[item.quantity?.length - 1] === "," ? item.quantity.slice(item.quantity.length - 1) : item.quantity }))
    const response = await axios.post(`${await API_URL()}/request/sync/${url}`, { productos, userId, areaId });
    return response.data;
  } catch (error) {
    console.log("syncProducts return", url, error)
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

export const makeMovement = async (productos: any) => {
  try {
    const areaId = await AsyncStorage.getItem('selectedLocal');
    const response = await axios.post(`${await API_URL()}/request/make-movement/${areaId}`, { productos });
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

export const fetchMovements = async (areaId=undefined) => {
  try {
    // const areaId = await AsyncStorage.getItem("selectedLocal");
    // if (!areaId) return [];
    const filterStart = subDays(new Date().setHours(0, 0, 0, 0), 2).toISOString();
    const filterEnd = (new Date()).toISOString();
    await axios.post(`${await API_URL()}/login`, { username: "admin", password: "1234" });
    const url = `${await API_URL()}/inventory-movements`;
    const response = await axios.get(url, { params: { filterStart, filterEnd,areaId } });
    return response.data; // asumimos que la API devuelve un array de Movement
  } catch (error) {
    console.warn("Error fetching movements:", error);
    throw error;
  }
};


export const getPendingTransfer = async () => {
  try {
    const areaId = "cm7xtf4sn005i13r1wtc1x5ou"
      ;
    if (areaId == null) {
      return router.push({ pathname: "/" })
    }
    const { data } = await axios.get(`${await API_URL()}/request/products/recibe/area2area/${areaId}`)
    return data
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return []
  }
}

export const receiveTransfer = async () => {
  try {
    const areaId = "cm7xtf4sn005i13r1wtc1x5ou";
    if (areaId == null) {
      return router.push({ pathname: "/" })
    }
    const { data } = await axios.post(`${await API_URL()}/request/products/recibe/area2area/${areaId}`)
    return true
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return false
  }
}
export const rejectTransfer = async (fromAreaId) => {
  try {
    const areaId = "cm7xtf4sn005i13r1wtc1x5ou";
    if (areaId == null) {
      return router.push({ pathname: "/" })
    }
    const { data } = await axios.post(`${await API_URL()}/request/request/post/area2area`,{productos:[],fromAreaId})
    return true
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return false
  }
}
export const getItemsByArea = async () => {
  try {
    const areaId = await AsyncStorage.getItem('selectedLocal');
    if (areaId == null) {
      return router.push({ pathname: "/" })
    }
    const { data } = await axios.get(`${await API_URL()}/areas-items/items/${areaId}`)
    return data
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return false
  }
}
export const actualizarProductosDelArea = async (itemsId) => {
  try {
    const areaId = await AsyncStorage.getItem('selectedLocal');
    if (areaId == null) {
      return router.push({ pathname: "/" })
    }
    await axios.post(`${await API_URL()}/login`, { username: "admin", password: "1234" });
    const { data } = await axios.put(`${await API_URL()}/areas-items/items`,{areaId,itemsId})
    return data
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return false
  }
}
export const getAllProducts = async () => {
  try {
    await axios.post(`${await API_URL()}/login`, { username: "admin", password: "1234" });
    const { data } = await axios.get(`${await API_URL()}/inventory-items`)
    return data
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return false
  }
}
export const undoMovement = async (movementId) => {
  try {
    await axios.post(`${await API_URL()}/login`, { username: "admin", password: "1234" });
    const { data } = await axios.delete(`${await API_URL()}/inventory-movements/${movementId}`)
    return data
  } catch (error) {
    console.log("getProductsSaved error return", error);
    AsyncStorage.removeItem("selectedLocal")
    AsyncStorage.removeItem("LOCAL_DENOMINATION")
    AsyncStorage.removeItem("selectedResponsable")
    router.push({ pathname: "/" })
    return false
  }
}