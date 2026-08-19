import {useEffect,useState} from "react";
import api from "../lib/api";

const REFRESH_INTERVAL_MS=3000;

export default function useLiveHomeData(endpoint,fallback){
  const [data,setData]=useState(null);
  useEffect(()=>{
    let active=true,timer=null,loading=false;
    const load=async()=>{
      if(!active||loading)return;
      loading=true;
      try{const response=await api.get(endpoint,{params:{_refresh:Date.now()}});if(active)setData(response.data)}
      catch{if(active)setData(current=>current??fallback)}
      finally{loading=false;if(active&&document.visibilityState==="visible")timer=window.setTimeout(load,REFRESH_INTERVAL_MS)}
    };
    const refreshWhenVisible=()=>{if(document.visibilityState==="visible"){window.clearTimeout(timer);load()}};
    load();
    document.addEventListener("visibilitychange",refreshWhenVisible);
    window.addEventListener("focus",refreshWhenVisible);
    return()=>{active=false;window.clearTimeout(timer);document.removeEventListener("visibilitychange",refreshWhenVisible);window.removeEventListener("focus",refreshWhenVisible)};
  },[endpoint,fallback]);
  return data;
}
