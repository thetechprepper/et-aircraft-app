import React, { useCallback, useEffect, useState } from 'react'
import {
  ActionButton,
  Button,
  defaultTheme,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Flex,
  Heading,
  Item,
  Picker,
  Provider,
  Text,
  View,
  TableView,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
} from '@adobe/react-spectrum'
import Crosshairs from '@spectrum-icons/workflow/Crosshairs'
import Filter from '@spectrum-icons/workflow/Filter'
import InfoOutline from '@spectrum-icons/workflow/InfoOutline'
import Minimize from '@spectrum-icons/workflow/Minimize'
import ShowMenu from '@spectrum-icons/workflow/ShowMenu'
import { Map, Marker, ZoomControl } from 'pigeon-maps'
import Airplane from './Airplane.jsx'

function App() {

  const DATA_HOST = import.meta.env.VITE_DATA_HOST || 'http://localhost:1090';
  const MAP_HOST = import.meta.env.VITE_MAP_HOST || 'http://localhost:8000';

  const [center, setCenter] = useState([33.0, -112.0]);
  const [zoom, setZoom] = useState(10);

  const [useFallback, setUseFallback] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aircraftList, setAircraftList] = useState([]);
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedAircraftData, setSelectedAircraftData] = useState(null);

  const [sortDescriptor, setSortDescriptor] = useState({
    column: 'flight',
    direction: 'ascending',
  })

  //const mapTiles = {
  //  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  //  opentopo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
  //}

  const handleAircraftClick = async (icao24) => {
    const response = await fetch(`http://localhost:1981/api/aircraft?icao24=${icao24}`);
    const data = await response.json();
    setSelectedAircraftData(data[0] || null);
  };

  // Fetch aircraft data every 5 seconds
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        const response = await fetch(`${DATA_HOST}/data.json`)
        const data = await response.json()
        setAircraftList(data)
      } catch (error) {
        console.error('Failed to fetch aircraft data:', error)
      }
    }

    fetchAircraft(); // initial fetch
    const intervalId = setInterval(fetchAircraft, 5000); // repeat every 5 sec

    return () => clearInterval(intervalId); // clean up on unmount
  }, []);

  const sortedAircraft = [...aircraftList].sort((a, b) => {
    const col = sortDescriptor.column
    let valA = a[col]
    let valB = b[col]

    if (valA == null) valA = ''
    if (valB == null) valB = ''

    // For strings, lowercase comparison
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return sortDescriptor.direction === 'ascending' ? -1 : 1
    if (valA > valB) return sortDescriptor.direction === 'ascending' ? 1 : -1
    return 0
  })

  const [tileBaseUrl, setTileBaseUrl] = useState(null);

  // Load map tile service info on mount
  useEffect(() => {
    async function fetchMapServices() {
      try {
        const response = await fetch(`${MAP_HOST}/services`);
        const services = await response.json();
        if (services.length > 0) {
          setTileBaseUrl(services[0].url);
        } else {
          console.warn('No map tile services found.');
          setUseFallback(true);
        }
      } catch (err) {
        console.error('Failed to fetch map services:', err);
        setUseFallback(true);s
      }
    }

    fetchMapServices();
  }, []);

  const mapTiler = useCallback(
    (x, y, z, dpr) => {
      if (useFallback) {
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
      if (!tileBaseUrl) return '';
      return `${tileBaseUrl}/tiles/${z}/${x}/${y}.png`;
    },
    [tileBaseUrl, useFallback]
  );

  return (
    <Provider theme={defaultTheme}>
      <Flex direction="column" height="100vh">
        {/* Content: Sidebar + Map */}
        <Flex direction="row" flexGrow={1}>
          {/* Sidebar */}
          {sidebarOpen && (
            <View width="40%" backgroundColor="gray-100" padding="size-200">
              <Flex direction="column" gap="size-200">
		<Flex direction="row" gap="size-200">
                  <ActionButton onPress={() => setSidebarOpen(false)} aria-label="Hide Panel">
                    <Minimize/><Text>Hide</Text>
                  </ActionButton>

                  <ActionButton aria-label="Recenter">
                    <Crosshairs/><Text>My Position</Text>
                  </ActionButton>

                  <ActionButton aria-label="Filter">
                    <Filter/><Text>Filter</Text>
                  </ActionButton>

                  <DialogTrigger type="tray">
                    <ActionButton aria-label="Info">
                      <InfoOutline/><Text>Info</Text>
                    </ActionButton>
                    <Dialog>
                      <Heading>{selectedAircraftData?.make || 'Unknown Make'} {selectedAircraftData?.model || 'Unknown Model'}</Heading>
                      <Divider />
                      <Content>
		        <Flex direction="column" gap="size-100">
                          <Text>
                            Tail #: {selectedAircraftData?.tail_number || 'Uknown'}  
                          </Text>
                          <Text>
                            Owner: {selectedAircraftData?.owner_name || 'Unknown'}  
                          </Text>
                          <Text>
                            City: {selectedAircraftData?.city|| 'Unknown'}  
                          </Text>
                          <Text>
                            State: {selectedAircraftData?.state|| 'Unknown'}  
                          </Text>
		        </Flex>
                      </Content>
                    </Dialog>
                  </DialogTrigger>
		</Flex>

                <TableView
                  aria-label="Aircraft Table"
                  selectionMode="single"
                  selectedKeys={selectedHex ? new Set([selectedHex]) : new Set()}
                  onSelectionChange={(keys) => {
                    const [key] = Array.from(keys)
                    const curAircraft = aircraftList.find(ac => ac.hex === key);
                    setSelectedHex(key)
		    handleAircraftClick(key)
                    setCenter([curAircraft.lat,curAircraft.lon])
                  }}
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                  height="100%"
		  density="compact"
                >
                  <TableHeader>
                    <Column key="flight" allowsSorting>
                      Flight #
                    </Column>
                    <Column key="hex">
                      ICAO24
                    </Column>
		  {/* <Column key="lat" allowsSorting> Lat/Lon </Column> */ }
                    <Column key="speed" allowsSorting>
                      Speed
                    </Column>
                    <Column key="altitude" allowsSorting>
                      Altitude
                    </Column>
                  </TableHeader>
                  <TableBody>
                    {sortedAircraft.map((ac) => (
                      <Row key={ac.hex}>
                        <Cell>{ac.flight || 'NA'}</Cell>
                        <Cell>{ac.hex.toUpperCase()}</Cell>
			    {/* <Cell>{ac.lat.toFixed(3)},{ac.lon.toFixed(3)}</Cell> */}
                        <Cell>{ac.speed}</Cell>
                        <Cell>{ac.altitude.toLocaleString()}</Cell>
                      </Row>
                    ))}
                  </TableBody>
                </TableView>
              </Flex>
            </View>
          )}

          {/* Toggle Button if Sidebar is hidden */}
          {!sidebarOpen && (
            <View backgroundColor="gray-100" padding="size-100">

              <Flex direction="column" gap="size-200">
                <ActionButton onPress={() => setSidebarOpen(true)} aria-label="Show Panel">
                  <ShowMenu />
                </ActionButton>

                <ActionButton aria-label="Recenter">
                  <Crosshairs/>
                </ActionButton>

                <ActionButton aria-label="Filter">
                  <Filter/>
                </ActionButton>

                <ActionButton aria-label="Info">
                  <InfoOutline/>
                </ActionButton>
              </Flex>
            </View>
          )}

          {/* Map */}
          <View flexGrow={1}>
            <Map 
              attributionPrefix="The Tech Prepper | Pigeon Maps"
              provider={mapTiler}
              height="100%"
              center={center}
              zoom={zoom}
              minZoom={2}
              maxZoom={11}
              onBoundsChanged={({ center, zoom }) => { 
                setCenter(center) 
                setZoom(zoom) 
              }} 
            >

              <ZoomControl />
              <Marker anchor={[33.0, -112.0]} />

              {aircraftList.map((ac) => (
                <Marker key={ac.hex} anchor={[ac.lat, ac.lon]}>
                  <Airplane
                    heading={ac.track}
                    flight={ac.flight || ac.hex.toUpperCase()}
                    altitude={ac.altitude}
                    speed={ac.speed}
                    track={ac.track}
                    isSelected={selectedHex === ac.hex}
                  />
                </Marker>
              ))}
            </Map>
          </View>
        </Flex>
      </Flex>
    </Provider>
  )
}

export default App
