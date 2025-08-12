/**
 * Checks if response contains a valid lat/lon in the "position" object.
 * @param {Object} data - API response object.
 * @returns {boolean} true if valid, false otherwise.
 */
const isValidLatLon = (data) =>
  data?.position &&
  typeof data.position.lat === 'number' &&
  typeof data.position.lon === 'number' &&
  !Number.isNaN(data.position.lat) &&
  !Number.isNaN(data.position.lon) &&
  data.position.lat >= -90 && data.position.lat <= 90 &&
  data.position.lon >= -180 && data.position.lon <= 180;

export default isValidLatLon;
