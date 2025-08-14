import { DialogTrigger, ActionButton, Dialog, Heading, Divider, Content, Flex, Text } from '@adobe/react-spectrum';
import InfoOutline from '@spectrum-icons/workflow/InfoOutline';


export default function AircraftInfoDialog({ selectedAircraftData, showText = true }) {
  if (!selectedAircraftData) return null;

  return (
    <DialogTrigger type="tray">
      <ActionButton aria-label="Info">
        <InfoOutline />
        {showText && <Text>Info</Text>}
      </ActionButton>
      <Dialog>
        <Heading>
          {selectedAircraftData?.make || 'Unknown Make'} {selectedAircraftData?.model || 'Unknown Model'}
        </Heading>
        <Divider />
        <Content>
          <Flex direction="column" gap="size-100">
            {[
              ['Type', selectedAircraftData?.registrant_type || 'Unknown'],
              ['Owner', selectedAircraftData?.owner_name || 'Unknown'],
              ['Tail #', selectedAircraftData?.tail_number || 'Unknown'],
              ['Year', selectedAircraftData?.year || 'Unknown'],
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
  );
}
