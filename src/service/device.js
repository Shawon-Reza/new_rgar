import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "device_id";

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);

  if (!id) {
    id = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }

  return id;
}

export function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();

  // any mobile or tablet-like device → mobile
  if (/mobi|android|iphone|ipad|tablet/.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

export function getDeviceInfo() {
  return {
    device_id: getDeviceId(),
    device_type: getDeviceType(),
  };
}
