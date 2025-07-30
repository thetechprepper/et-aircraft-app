import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  Button,
  ButtonGroup,
  defaultTheme,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Flex,
  Heading,
  Item,
  ListBox,
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
} from '@adobe/react-spectrum';
import Crosshairs from '@spectrum-icons/workflow/Crosshairs';
import Filter from '@spectrum-icons/workflow/Filter';
import InfoOutline from '@spectrum-icons/workflow/InfoOutline';
import Minimize from '@spectrum-icons/workflow/Minimize';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import Airplane from './Airplane.jsx';
import './App.css';

function App() {

  const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:1981';
  const DATA_HOST = import.meta.env.VITE_DATA_HOST || 'http://localhost:1090';
  const MAP_HOST = import.meta.env.VITE_MAP_HOST || 'http://localhost:8000';

  const [myPosition, setMyPosition] = useState([33.0, -112.0]);
  const [center, setCenter] = useState([33.0, -112.0]);
  const [zoom, setZoom] = useState(10);

  const [useFallback, setUseFallback] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aircraftList, setAircraftList] = useState([]);
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedAircraftData, setSelectedAircraftData] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [tempSelection, setTempSelection] = useState(new Set());

  const [sortDescriptor, setSortDescriptor] = useState({
    column: 'flight',
    direction: 'ascending',
  });

  //const mapTiles = {
  //  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  //  opentopo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
  //}

  useEffect(() => {
    const fetchDefaultGrid = async () => {
      try {
        const response = await fetch(`${API_HOST}/api/geo/position`);
        if (!response.ok) throw new Error('Failed to fetch default location from et-api');
        const data = await response.json();
        if (data.lat && data.lon) {
          setMyPosition([data.lat, data.lon]);
          setCenter([data.lat, data.lon]);
        }
      } catch (err) {
        console.warn('Could not load default location from GPS or user config:', err);
      }
    };

    fetchDefaultGrid();
  }, []);

  const handleAircraftClick = async (icao24) => {
    const response = await fetch(`${API_HOST}/api/aircraft?icao24=${icao24}`);
    const data = await response.json();
    setSelectedAircraftData(data[0] || null);
  };

  // Fetch aircraft data every 10 seconds
  useEffect(() => {
    const fetchAircraft = async () => {
      try {
        // Step 1: Fetch ADS-B data from dump1090 endpoint
        const response = await fetch(`${DATA_HOST}/data.json`);
        const primaryData = await response.json();

        // Step 2: Extract the hex codes
        const hexCodes = primaryData.map(ac => ac.hex).join(',');

        // Step 3: Fetch additional aircraft data from the offline FAA endpoint 
        const secondaryResponse = await fetch(`${API_HOST}/api/aircraft?icao24=${hexCodes}`);
        const secondaryData = await secondaryResponse.json();

        // Step 4: Index FAA data by the hex code (ICAO24) for quick lookup
        const secondaryMap = {};
        for (const ac of secondaryData) {
	  if (ac.icao24) {
            secondaryMap[ac.icao24.toLowerCase()] = ac;
          }
        }

        // Step 5: Merge ADS-B data with the FAA registry
        const merged = primaryData.map(ac => ({
          ...ac,
          ...secondaryMap[ac.hex]
        }))

        setAircraftList(merged);

      } catch (error) {
        console.error('Failed to fetch aircraft data:', error);
      }
   }

  fetchAircraft(); // initial fetch
  const intervalId = setInterval(fetchAircraft, 10000);

  return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  const filteredAircraft = useMemo(() => {
    if (selectedTypes.size === 0) return aircraftList;
    return aircraftList.filter(ac => selectedTypes.has(ac.registrant_type));
  }, [aircraftList, selectedTypes]);

  const sortedAircraft = useMemo(() => {
    return [...filteredAircraft].sort((a, b) => {
      const col = sortDescriptor?.column;
      if (!col) return 0;

      let valA = a[col];
      let valB = b[col];

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDescriptor.direction === 'ascending' ? -1 : 1;
      if (valA > valB) return sortDescriptor.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredAircraft, sortDescriptor]);

  const registrantTypes = [
    'Individual',
    'Partnership',
    'Corporation',
    'Co-Owner',
    'Government',
    'LLC',
    'Non-Citizen Corporation',
    'Non-Profit Organization'
  ];

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
            <View width="50%" backgroundColor="gray-100" padding="size-200">
              <Flex direction="column" gap="size-200">
		<Flex direction="row" gap="size-200">
                  <ActionButton onPress={() => setSidebarOpen(false)} aria-label="Hide Panel">
                    <Minimize/><Text>Hide</Text>
                  </ActionButton>

		  <ActionButton
                    aria-label="Recenter"
                    onPress={async () => {
                      try {
                        const response = await fetch(`${API_HOST}/api/geo/position`);

                        if (!response.ok) throw new Error('Failed to fetch position');

                        const data = await response.json();

                        if (data.lat && data.lon) {
                          setMyPosition([data.lat, data.lon]);
                          setCenter([data.lat, data.lon]);
                        }
                      } catch (err) {
                        console.warn('Could not fetch current position:', err);
                      }
                    }}
                  >
                    <Crosshairs/><Text>My Position</Text>
                  </ActionButton>

		  <DialogTrigger type="tray">
                    <ActionButton aria-label="Filter">
                      <Filter/><Text>Filter</Text>
                    </ActionButton>

                    {(close) => (
                      <Dialog>
                        <Heading>Filter by Registrant Type</Heading>
                        <Divider />
                        <Content>
                          <ListBox
                            selectionMode="multiple"
                            selectedKeys={tempSelection}
                            onSelectionChange={setTempSelection}
                          >
                            {registrantTypes.map(type => (
                              <Item key={type}>{type}</Item>
                            ))}
                          </ListBox>
                        </Content>
                        <ButtonGroup>
                          <Button variant="secondary" onPress={() => {
                            setTempSelection(new Set(selectedTypes)); // Reset to current selection
                            close();
                          }}>
                            Cancel
                          </Button>
                          <Button variant="accent" onPress={() => {
                            setSelectedTypes(new Set(tempSelection));
                            close();
                          }}>
                            Apply
                          </Button>
                        </ButtonGroup>
                      </Dialog>
                    )}
                  </DialogTrigger>

		  {selectedAircraftData && (<DialogTrigger type="tray">
                    <ActionButton aria-label="Info">
                      <InfoOutline/><Text>Info</Text>
                    </ActionButton>
                    <Dialog>
                      <Heading>{selectedAircraftData?.make || 'Unknown Make'} {selectedAircraftData?.model || 'Unknown Model'}</Heading>
                      <Divider />
                      <Content>
                        <Flex direction="column" gap="size-100">
                          {[
                            ['Type', selectedAircraftData?.registrant_type || 'Unknown'],
                            ['Owner', selectedAircraftData?.owner_name || 'Unknown'],
                            ['Tail #', selectedAircraftData?.tail_number || 'Unknown'],
                            ['Year', selectedAircraftData?.year|| 'Unknown'],
                            ['City', selectedAircraftData?.city || 'Unknown'],
                            ['State', selectedAircraftData?.state || 'Unknown']
                          ].map(([label, value]) => (
                            <Flex key={label} direction="row" gap="size-100" alignItems="start">
                              <Text width="size-800" UNSAFE_style={{ fontWeight: 'bold' }}>
                                {label}:
                              </Text>
                              <Text flex="1">
                                {value}
                              </Text>
                            </Flex>
                          ))}
                        </Flex>
                      </Content>
                    </Dialog>
                  </DialogTrigger>
	          )}
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
		    <Column key="registrant_type" allowsSorting>
		      Type
		    </Column>
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
		        <Cell>{ac.registrant_type}</Cell>
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
              <Marker anchor={myPosition}>
	        <div className="my-position-marker" />
	      </Marker>

              {filteredAircraft.map((ac) => (
                <Marker key={ac.hex} anchor={[ac.lat, ac.lon]}>
		  <div style={{ pointerEvents: 'auto' }}>
                    <Airplane
                      heading={ac.track}
                      flight={ac.flight || ac.hex.toUpperCase()}
                      altitude={ac.altitude}
                      speed={ac.speed}
                      track={ac.track}
                      isSelected={selectedHex === ac.hex}
	              onSelect={() => {
                        setSelectedHex(ac.hex);
                        handleAircraftClick(ac.hex);
                        setCenter([ac.lat, ac.lon]);
                      }}
                    />
		  </div>
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
