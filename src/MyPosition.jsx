import { ActionButton, Text } from '@adobe/react-spectrum';
import Crosshairs from '@spectrum-icons/workflow/Crosshairs';
import { GEO_SERVICE } from './config'; 
import { isValidLatLon } from './utils';

export default function MyPosition({ setMyPosition, setCenter, showText = true }) {
  const handlePress = async () => {
    try {
      const response = await fetch(GEO_SERVICE);

      if (!response.ok) throw new Error('Failed to fetch position');

      const data = await response.json();

      if (isValidLatLon(data)) {
        const { lat, lon } = data.position;
        setMyPosition([lat, lon]);
        setCenter([lat, lon]);
      }
    } catch (err) {
      console.warn('Could not fetch current position:', err);
    }
  };

  return (
    <ActionButton aria-label="Recenter" onPress={handlePress}>
      <Crosshairs />
      {showText && <Text>My Position</Text>}
    </ActionButton>
  );
}
