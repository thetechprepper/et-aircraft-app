import { DialogTrigger, ActionButton, Dialog, Heading, Divider, Content, ListBox, Item, ButtonGroup, Button, Text } from '@adobe/react-spectrum';
import Filter from '@spectrum-icons/workflow/Filter';

export default function AircraftFilter({
  registrantTypes,
  selectedTypes,
  setSelectedTypes,
  tempSelection,
  setTempSelection,
  showText = true
}) {
  return (
    <DialogTrigger type="tray">
      <ActionButton aria-label="Filter">
        <Filter />
        {showText && <Text>Filter</Text>}
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
            <Button
              variant="secondary"
              onPress={() => {
                setTempSelection(new Set(selectedTypes)); // Reset to current selection
                close();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onPress={() => {
                setSelectedTypes(new Set(tempSelection));
                close();
              }}
            >
              Apply
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  );
}
