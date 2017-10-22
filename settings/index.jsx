import { WEB_APP } from './../common/constants.js'


function mySettings(props) {
  console.log('mySettings');
   
  return (
    <Page>
      <Section
        title={<Text bold align="center">Settings</Text>}>
        <Text>
           Lorem ipsum...
        </Text>
      </Section>
      <Section
        title="Activity Reporting">
        <Text>
          Connect to give access to read your synced activities.
        </Text>
        <Oauth
          settingsKey="oauth"
          title="Fitbit Login"
          label="Fitbit"
          status="Login"
          authorizeUrl="https://www.fitbit.com/oauth2/authorize"
          requestTokenUrl="https://api.fitbit.com/oauth2/token"
          clientId={WEB_APP.CLIENT_ID}
          clientSecret={WEB_APP.CLIENT_SECRET}
          scope={WEB_APP.SCOPE}
        />
      </Section>
      <Section
        title="Toggles">
        <ColorSelect
          settingsKey="color" 
          colors={[
            {color: 'green', value: '#00A629'},
            {color: 'red', value: '#F83C40'},
            {color: 'blue', value: '#3182DE'},
            {color: 'purple', value: '#BD4EFC'},
            {color: 'yellow', value: '#E4FA3C'},
            {color: 'orange', value: '#FC6B3A'}
          ]}
        />
        <Toggle
          settingsKey="displayAlwaysOn"
          label="Display Always On"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
