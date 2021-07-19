export default function getLocation() {
  if (navigator.geolocation) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((position) => {
        resolve(`[${position.coords.latitude}, -${position.coords.longitude}]`);
      }, (error) => {
        reject(error);
      });
    });
  }
  return new Promise((resolve, reject) => reject(new Error('Geo not avalible')));
}

export function validate(str) {
  const re = /^([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  return re.test(str);
}
